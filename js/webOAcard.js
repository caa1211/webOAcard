    if (!Detector.webgl) Detector.addGetWebGLMessage();

    var container = document.getElementById('container');
    var $container = $(container);
    var cameraOffset = 80;

    var debugMode = OA.debugMode;
    var camera, scene, renderer;
    var modelOption = {
        angle: 90,
        cardW: 120,
        cardH: 100,
        gridNum: 30,
        domContainer: container
    };
    OA.Utils.texture.loadAllTexture(modelOption);
    var cardW = modelOption.cardW,
        cardH = modelOption.cardH;
    var maxWidth = cardW > cardH ? cardW : cardH;
    var gridStep = maxWidth / modelOption.gridNum;

    var oaModel = new OA.Model(modelOption);
    var sceneOffset = new THREE.Vector3(oaModel.getCardW() / 2, oaModel.getCardH() / 3, 0);

    var viewerR = maxWidth * 2.5;
    var mouse2D = new THREE.Vector3(0, 10000, 0.5);
    var orbitCtrls;
    var raycaster, projector;
    var cardModeOpts = [
        {name: "Edit", cameraControl: true, showEditPlane: true, angleFixed: 90},
        {name: "Display", cameraControl: true, showEditPlane: false, angleFixed: -1}];
        //,{name: "Print",cameraControl: false, editPlane: false, angleFixed: 180} 
 
    var cardMode = 0;
    var stats;
    //for preview
    var camera2, scene2, renderer2 , cam2, model2d;

    var $container2D = $("#container2D");
    var previewW = $container2D.width();
    var previewH = $container2D.height();

    function init(oa) {

        //==preview===
        scene2 = new THREE.Scene();
        renderer2 = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });

        $container2D.append(renderer2.domElement);
        cam2 = new THREE.PerspectiveCamera(45, $container2D.width() / $container2D.height(), 1, 20000);
        //cam2 = new  THREE.OrthographicCamera( previewW / -2, previewW / 2, previewH / 2, previewH / -2, -1000, 1000);

        cam2.aspect = previewW / previewH;
        cam2.updateProjectionMatrix();
        renderer2.setSize(previewW, previewH);

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, $container.width() / $container.height(), 0.1, 200000);
        //camera = new  THREE.OrthographicCamera( window.innerWidth / - 6, window.innerWidth / 6, window.innerHeight / 6, window.innerHeight / - 6, -1000, 1000);
        scene.add(camera);

        if (Detector.webgl)
            renderer = new THREE.WebGLRenderer({
                antialias: true //,
                // precision: "highp",
                // preserveDrawingBuffer: true,
                // alpha: true
            });
        else
            renderer = new THREE.CanvasRenderer();

        renderer.setClearColor(new THREE.Color(0xEEEEEE, 1.0));
        //renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setSize($container.width(), $container.height());

        container.appendChild(renderer.domElement);
        orbitCtrls = new THREE.OrbitControls(camera, renderer.domElement, container);

        setGlobalValuableByCardSize(cardW, cardH);
        renderPreview();

        if (OA.light) {
            var ambientLight = new THREE.AmbientLight(0xFFE4C4);
            scene.add(ambientLight);
            var spotLight = new THREE.SpotLight(0xffffff);
            spotLight.position.set(-viewerR * 30, viewerR * 25, viewerR * 40);
            //spotLight.castShadow = true;
            scene.add(spotLight);
        }

        var w = $container.width();
        var h = $container.height();

        camera.setViewOffset(w, h, cameraOffset, 0, w, h);

        if (debugMode) {
            //OA.Utils.debugaxis(scene, oa, 1000);
            stats = new Stats();
            stats.domElement.style.position = 'absolute';
            stats.domElement.style.top = '0px';
            container.appendChild(stats.domElement);
        }

        scene.add(oaModel);

        projector = new THREE.Projector();
        //bind Event
        $(window).bind('resize', onWindowResize);
        $container.bind("mousemove", onDocumentMouseMove);
        $container.bind("mousedown", onDocumentMouseDown);

        changeCardMode(cardMode);

        //download 2d pattern
        var $imgContainer = $("#imgContainer");
        var $downloadLink = $imgContainer.children("a");
        var $previewUI = $("#previewUI");
        var $download2D = $("#download2D");

        $download2D.click(function(e) {
            var dataUrl = make2DImg(1000, 1000 * previewH / previewW, previewW, previewH, $imgContainer, function() {
                $downloadLink[0].click();
            });
        });

        ////for debug
        // $(oaModel).bind("facesClipped", function(e, params) {
        //     var faces = params.faces;
        //     console.error("        ");
        //     console.error("==================" + faces.length);
        //     $.each(faces, function(i, f) {
        //         console.error("t--" + f.getT() + " type--" + f.oaInfo.type);

        //     });
        // });

    }

    function onWindowResize() {
        camera.aspect = $container.width() / $container.height();
        camera.updateProjectionMatrix();
        renderer.setSize($container.width(), $container.height());
        var w = $container.width();
        var h = $container.height();
        camera.setViewOffset(w, h, cameraOffset, 0, w, h);
    }

    function onDocumentMouseMove(event) {
        event.preventDefault();
        mouse2D.x = (event.clientX /$container.width()) * 2 - 1;
        mouse2D.y = -(event.clientY / $container.height()) * 2 + 1;
    }

    function changeCardMode(cmode){
        var opt = cardModeOpts[cmode];
        orbitCtrls.enabled = opt.cameraControl;
        oaModel.showEditPlane(opt.showEditPlane);
        cardMode = cmode;
        if(opt.angleFixed === -1){
            oaModel.setFoldable(true);
        }else{
            oaModel.setFoldable(false);
            oaModel.resetCardAngle();
        }
    }

    function onDocumentMouseDown(event) {
        event.preventDefault();
        if (event.which == 3) {
            if(oaModel.contourState===0){
                cardMode = (cardMode + 1) % cardModeOpts.length;
                changeCardMode(cardMode);
            }
        }

        if (event.which == 2) {
             var angle = oaModel.getCardAngle();
             oaModel.setCardAngle(angle +10);
        }

    }

    function toDataURL(renderer, mimetype) {
        mimetype = mimetype || "image/png";
        var dataUrl = renderer.domElement.toDataURL(mimetype);
        return dataUrl;
    };

    function make2DImg(w, h, rendererW, rendererH, $imgContainer, callback) {

         renderer2.setSize(w, h);
         setTimeout(function(){
            //add timer for firefox issue: setSize and render immediately, browser will hang up 
            renderer2.render(scene2, cam2);
            var imgData;
            //var imgContainer =  $("#imgContainer");
            try {
                // renderer.setSize(window.innerWidth, window.innerHeight);
                imgData = toDataURL(renderer2); //renderer.domElement.toDataURL();
                // renderer.setSize(window.innerWidth, window.innerHeight);
                console.log(imgData);
            } catch (e) {
                console.log("Browser does not support taking screenshot of 3d context");
                return;
            }
            //imgContainer.show();
            var date = new Date();
            $imgContainer.children("img").attr("src", imgData);
            $imgContainer.children("a").attr("href", imgData)
            .attr("download", "oaCard_"+ date +".png");
            renderer2.setSize(rendererW, rendererH);
            setTimeout(function(){
                renderer2.render(scene2, cam2);
            }, 1);
            
            callback(imgData);

        }, 1);
        // _aspectResize(imgData, 1500, 1500, callback);
        // function callback(newImgData) {
        //     imgContainer.show();
        //     imgContainer.children("img").attr("src", newImgData);
        //     imgContainer.children("a").attr("href", newImgData);
        // }
    }


    function animate() {
        requestAnimationFrame(animate);
        render();
        if (stats!=undefined) {
            stats.update();
        }
        orbitCtrls.update();

       
    }
    function render() {
        raycaster = projector.pickingRay(mouse2D.clone(), camera);
        oaModel.tick({
            raycaster: raycaster
        });
        renderer.render(scene, camera);
    }


    init(oaModel);
    animate();


function renderPreview() {
    if (model2d != null) {
        scene2.remove(model2d);
    }
    model2d = oaModel.build2DPattern();
    scene2.add(model2d);
    renderer2.render(scene2, cam2);
}



// function animate2() {
//     renderPreview();
//     requestAnimationFrame2 = requestAnimationFrame(animate2);
//     renderer2.render(scene2, cam2);
// }

//  animate2();



//===============GUI=================
 

window.onload = function() {

    // var oaControl = new function(){

    //     this.cardAngle = 90;
    //     this.displayOutline = false;
    //     //this.message = "download 2D pattern";
    //     this.fundo = function() { 
    //         oaModel.undo();
    //     };
    //     this.fredo = function() { 
    //          oaModel.redo();
    //     };

    //     this.fclear = function(){

    //     };

    //     this.cundo = function(){

    //     };

    //     this.credo = function(){

    //     };

    //     this.width2D = 1000;
    //     this.height2D = 1000;
 //   }
    function noIm(){
        alert("not yet implemented!"); 
    };
    var oaControl = {
        cardAngle: 90,
        angleChange: function(value) {
           oaModel.setCardAngle(value);
           oaModel.showEditPlane(false);
           oaModel.setFoldable(true);
        },
        editDepth: 16,
        editDepthChange: function(value){
           if (!oaModel.isEditMode) {
                changeCardMode(0);
           }
           oaModel.setEditDepth(value);
        },
        isEditMode: true, 
        editModeChange: function(value){
            if(value){
                changeCardMode(0);
            }else{
                changeCardMode(1);
            }
        },
        faceMode: "face",
        faceModeChange: function(value){
           oaModel.setFaceCreateMode(value);
        },
        fundo: function(){
            oaModel.undo();
        },
        fredo: function(){
            oaModel.redo();
        },
        fclear: function(){ 
            var r = confirm("clear all faces?");
            if (r == true) {
                oaModel.clearAllFaces();
            } else {}
        },
        cundo: function(){
            noIm(); 
        },
        credo: function(){
            noIm(); 
        },
        cclear: function(){
            noIm(); 
        },
        cardWidth: modelOption.cardW,
        cardHeight: modelOption.cardH,
        gridNum: modelOption.gridNum,
        newModel: function(){
            // var modelOption = {
            //     angle: 90,
            //     cardW: 120,
            //     cardH: 100,
            //     gridNum: 40,
            //     domContainer: container
            // };
            //noIm(); 
            scene.remove(oaModel);
            oaModel.destory();
            modelOption.cardW = oaControl.cardWidth;
            modelOption.cardH = oaControl.cardHeight;
            modelOption.gridNum = oaControl.gridNum;
            oaModel = new OA.Model(modelOption);
            scene.add(oaModel);
            setGlobalValuableByCardSize(modelOption.cardW, modelOption.cardH);
            changeCardMode(cardMode);
            renderPreview();
        },
        loadModel: function(){
            noIm();
        },
        saveModel: function(){
            noIm();
        },
        subdivisionV: 0,
        subdivisionH: 0,
        downloadImg: function() {
            //download 2d pattern
            var $imgContainer = $("#imgContainer");
            var $downloadLink = $imgContainer.children("a");
            var $previewUI = $("#previewUI");
            var $download2D = $("#download2D");
            var dataUrl = make2DImg(1000, 1000, previewW, previewH, $imgContainer, function() {
                $downloadLink[0].click();
            });
        }
    };

    var angleOpt;
    var gui = new dat.GUI({
        autoPlace: false
    });

    var datContainer = document.getElementById('datContainer');
    datContainer.appendChild(gui.domElement);


    var $previewUI = $("#previewUI");


    gui.add(oaControl, "cardAngle", 0, 180).step(-5).listen().name("Card Angle")
    .onChange(oaControl.angleChange);

    var depthEditCtrl = gui.add(oaControl, "editDepth", 0, oaControl.cardHeight-1).step(gridStep).listen().name("Edit Depth")
    .onChange(oaControl.editDepthChange);

    gui.add(oaControl, 'isEditMode').name("Edit Mode").listen()
    .onChange(oaControl.editModeChange);

    var f0 = gui.addFolder('Model');
    f0.add(oaControl, 'cardWidth', 50, 300).step(1).name('Width');
    f0.add(oaControl, 'cardHeight', 50, 300).step(1).name('Height');
    f0.add(oaControl, 'gridNum', 20, 100).step(1).name('Grid Num');
    f0.add(oaControl, 'newModel').name('New');
    f0.add(oaControl, 'loadModel').name(' Save');
    f0.add(oaControl, 'saveModel').name('Load');
    //f0.open();

    var f1 = gui.addFolder('Face');
    f1.add(oaControl, 'faceMode', { 'Faces': 0, 'Hole': 1, 'Pull':2 } ).name("Face Mode")
    .onChange(oaControl.faceModeChange);
    f1.add(oaControl, 'fundo').name('<i class="fa fa-arrow-circle-left fa-1x"></i> Undo');
    f1.add(oaControl, 'fredo').name('<i class="fa fa-arrow-circle-right fa-1x"></i> Redo');
    f1.add(oaControl, 'fclear').name('<i class="fa fa-trash-o  fa-1x"></i> Clear');
    f1.open();

    var f2 = gui.addFolder('Contour');
    f2.add(oaControl, 'cundo').name('Undo');
    f2.add(oaControl, 'credo').name('Redo');
    f2.add(oaControl, 'cclear').name('Clear');
    f2.add(oaControl, "subdivisionV", 0, 5).step(1).name("Subdiv V");
    f2.add(oaControl, "subdivisionH", 0, 5).step(1).name("Subdiv H");
    //f2.open();

    var f3 = gui.addFolder('2D Pattern');
    // f3.add(oaControl, 'width2D').min(600).max(1200).name('Width').onChange(oaControl.width2DChange);
    // f3.add(oaControl, 'height2D').min(600).max(1200).name('Height');
    f3.add(oaControl, 'downloadImg').name("Save");
    f3.open();

    var update = function() {
      requestAnimationFrame(update);
      oaControl.cardAngle = oaModel.getCardAngle();
      oaControl.editDepth = oaModel.getEditDepth();
      oaControl.isEditMode = oaModel.getEditMode();
    };

    update();


    $(datContainer).find(".close-button").before($("#previewUIwrapper"));
    $previewUI.css("visibility", "visible");
};

//======================================
function setGlobalValuableByCardSize(cardW, cardH) {

    maxWidth = cardW > cardH ? cardW : cardH;
    gridStep = maxWidth / modelOption.gridNum;
    viewerR = maxWidth * 2.5;
    sceneOffset = new THREE.Vector3(cardW / 2, cardH / 3, 0);
    cam2.position.set(0, viewerR, 0);
    scene2.position.x = cardW / 2;
    cam2.position.x = cardW / 2;
    cam2.lookAt(scene2.position);
    cam2.rotation.z = 0 * Math.PI / 180;

    $(oaModel).bind("facesClipped", function() {
        renderPreview();
    });
   
    var fogNear = viewerR / 18000;
    var fogFar = viewerR * 2.2;
    scene.fog = new THREE.Fog(0xffffff, fogNear, fogFar);
    camera.position.set(0, 0, cardH * 2.5);
    orbitCtrls.noPan = true;
    orbitCtrls.zoomSpeed = 0.1;

    orbitCtrls.panUp(sceneOffset.y);
    orbitCtrls.maxPolarAngle = 120 * Math.PI / 180;
    orbitCtrls.rotateUp(10 * Math.PI / 180);
    orbitCtrls.rotateLeft(-10 * Math.PI / 180);

    orbitCtrls.minDistance = cardH * 2.5;
    orbitCtrls.maxDistance = cardW * 2.9;
    oaModel.setCameraCtrl(orbitCtrls);
    orbitCtrls.target = new THREE.Vector3(sceneOffset.x, 0, 0);
}

//======================================



 

/*** ADDING SCREEN SHOT ABILITY ***/
window.addEventListener("keyup", function(e) {
    var imgData, imgNode;
    //Listen to 'P' key
    if (e.which == 80) { //p
        //  doPreview = true;
         make2DImg(1000, 1000, 250, 250, $("#imgContainer"));
    }

    if (e.which == 68) { //d undo
        //  doPreview = true;
        oaModel.undo();
    }

    if (e.which == 70) { //f redo
        //  doPreview = true;
        oaModel.redo();
    }



    if (e.which == 82) { //r
        //  oaModel.setCardAngle(180)
        // m2 = new OA.Model(modelOption)//oaModel.clone();
        // var cfs = oaModel.getCloneClippedFaces();
        // m2.setClippedFaces(cfs);
        // m2.updateModel(cfs);
        // m2.unbindEvents();

        // m2.setCardAngle(180)
        if (model2d != null) {
            scene2.remove(model2d)

        }
        model2d = oaModel.build2DPattern();
        scene2.add(model2d);

        renderer2.render(scene2, cam2);

        //oaModel.setCardAngle(90)
        //      m2.setCardAngle(180)

    }
    //  debugger;
    // imgNode = document.createElement("img");
    // imgNode.src = imgData;
    // document.body.appendChild(imgNode);
});



