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
        gridNum: 40,
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


    function init(oa) {
    
    //==preview===

    var $container2D = $("#container2D");
    var previewW = $container2D.width();
    var previewH = $container2D.height();
    var requestAnimationFrame2 = null;

    scene2 = new THREE.Scene();
    renderer2 = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    
    $container2D.append(renderer2.domElement);
    //cam2 = new THREE.PerspectiveCamera(45, $container2D.width() /$container2D.height(), 1, 10000);
    cam2 = new  THREE.OrthographicCamera( previewW / -2, previewW / 2, previewH / 2, previewH / -2, -1000, 1000);
    cam2.position.set(0, viewerR, 0);
    scene2.position.x = cardW / 2;
    cam2.position.x = cardW / 2;
    cam2.lookAt(scene2.position);
    cam2.rotation.z = 0 * Math.PI / 180;

    cam2.aspect = previewW / previewH;
    cam2.updateProjectionMatrix();
    renderer2.setSize(previewW, previewH);
    $(oaModel).bind("facesClipped", function(){
        renderPreview();
    });
    renderPreview();
    //==========


        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, $container.width() / $container.height(), 0.1, 20000);
        //camera = new  THREE.OrthographicCamera( window.innerWidth / - 6, window.innerWidth / 6, window.innerHeight / 6, window.innerHeight / - 6, -1000, 1000);
        scene.add(camera);
        var fogNear = viewerR/18000;
        var fogFar = viewerR*2.2;
        //scene.fog=new THREE.FogExp2( 0xffffff, fogNear );
        scene.fog=new THREE.Fog( 0xffffff, fogNear, fogFar );

        camera.position.set(0, 0, maxWidth * 2.0);
 
        if (Detector.webgl)
            renderer = new THREE.WebGLRenderer({
                antialias: true//,
                // precision: "highp",
                // preserveDrawingBuffer: true,
                // alpha: true
            });
        else
            renderer = new THREE.CanvasRenderer();

        renderer.setClearColor(new THREE.Color(0xEEEEEE, 1.0));
        //renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setSize($container.width(), $container.height());

        if(OA.light){
            var ambientLight = new THREE.AmbientLight(0xFFE4C4);
            scene.add(ambientLight);
            var spotLight = new THREE.SpotLight( 0xffffff);
            spotLight.position.set( -viewerR*30, viewerR*25, viewerR*40);
            //spotLight.castShadow = true;
            scene.add( spotLight );
        }

   
        container.appendChild(renderer.domElement);
        orbitCtrls = new THREE.OrbitControls(camera, renderer.domElement, container);
        orbitCtrls.noPan = true;
        //orbitCtrls.panLeft(-sceneOffset.x);
        //orbitCtrls.panLeft(-30);
        orbitCtrls.panUp(sceneOffset.y);
        orbitCtrls.maxPolarAngle = 120*Math.PI/180;
        orbitCtrls.rotateUp(10*Math.PI/180);
        orbitCtrls.rotateLeft(-10*Math.PI/180);
        orbitCtrls.zoomSpeed = 0.1;
        orbitCtrls.minDistance = oaModel.getCardH() * 2.5;
        oaModel.setCameraCtrl(orbitCtrls);
        orbitCtrls.target = new THREE.Vector3(sceneOffset.x, 0, 0);
        //orbitCtrls.rotateLeft(-10*Math.PI/180);
 
    var w = $container.width();
    var h = $container.height();

    camera.setViewOffset(w, h, cameraOffset, 0, w, h);

        if (debugMode) {
            OA.Utils.debugaxis(scene, oa, 1000);
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
        // document.addEventListener('mousemove', onDocumentMouseMove, false);
        //document.addEventListener('mousedown', onDocumentMouseDown, false);
        // document.addEventListener('keydown', onDocumentKeyDown, false);
        // document.addEventListener('mousedown', onMouseDown, false);
        // document.addEventListener('keyup', onDocumentKeyUp, false);

        // //window.addEventListener('DOMMouseScroll', onMousewheel, false);
         //$(window).bind("mousewheel", onMousewheel);

 

        // $("#previewUI").click(function(e) {
        //     e.preventDefault();
        //     e.stopPropagation();
        //     return false;
        // });



        //download 2d pattern
        var $imgContainer = $("#imgContainer");
        var $downloadLink = $imgContainer.children("a");
        var $previewUI =  $("#previewUI");
        var $download2D = $("#download2D");

        $download2D.click(function(e) {
           var dataUrl = make2DImg(1000, 1000, previewW, previewH, $imgContainer, function(){
                 $downloadLink[0].click();

           });
           
        });

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

    function changeCardMode(cardMode){
        var opt = cardModeOpts[cardMode];
        orbitCtrls.enabled = opt.cameraControl;
        oaModel.showEditPlane(opt.showEditPlane);

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



//===============GUI=================
var FizzyText = function() {
  this.message = 'dat.gui';
  this.speed = 0.8;
  this.displayOutline = false;
  this.explode = function() {  };
  // Define render logic ...
};

window.onload = function() {
    var text = new FizzyText();

    var gui = new dat.GUI({
        autoPlace: false
    });

    var datContainer = document.getElementById('datContainer');
    datContainer.appendChild(gui.domElement);


    var $previewUI = $("#previewUI")

    gui.add(text, 'message');
    gui.add(text, 'speed', -5, 5);
    gui.add(text, 'displayOutline');
    gui.add(text, 'explode');
    gui.add(text, 'explode');
    gui.add(text, 'explode');
    gui.add(text, 'explode');
    $(datContainer).find(".close-button").before($previewUI);
    $previewUI.css("visibility", "visible");
};

//======================================

// function animate2() {
//     renderPreview();
//     requestAnimationFrame2 = requestAnimationFrame(animate2);
//     renderer2.render(scene2, cam2);
// }

//  animate2();




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



