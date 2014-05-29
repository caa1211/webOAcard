    if (!Detector.webgl) Detector.addGetWebGLMessage();

    var container = document.getElementById('container');
    var $container = $(container);
    var cameraOffset = 110;

    var debugMode = OA.debugMode;
    var camera, scene, renderer;
    var modelOption = {
        angle: 90,
        cardW: 120,
        cardH: 100,
        gridNum: 30,
        domContainer: container
    };
    
    var cardW = modelOption.cardW,
        cardH = modelOption.cardH;
    OA.Utils.texture.loadAllTexture({cardW:cardW, cardH: cardH});
    var maxWidth = cardW > cardH ? cardW : cardH;
    var gridStep = maxWidth / modelOption.gridNum;

    var oaModel = new OA.Model(modelOption);
    var sceneOffset = new THREE.Vector3(oaModel.getCardW() / 2, oaModel.getCardH() / 3, 0);

    var viewerR = maxWidth * 2.5;
    var mouse2D = new THREE.Vector3(0, 10000, 0.5);
    var orbitCtrls;
    var raycaster, projector;
    var stats;
    //for preview
    var camera2, scene2, renderer2 , cam2, model2d;
    var faceCreateModeType = {"faces":0, "hole":1, "pull": 2};
    var $container2D = $("#container2D");
    var previewW = $container2D.width();
    var previewH = $container2D.height();
    var $modeText = $("#modeText");

    var $imgContainer = $("#imgContainer");
    var $downloadLink = $imgContainer.children("a");
    var $previewUI = $("#previewUI");
    var $download2D = $("#download2D");
    var $previewUIwrapper = $("#previewUIwrapper");
    var $fileUpload = $("#fileUpload");
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

        setGlobalValuableByCardSize(cardW, cardH, modelOption.gridNum);
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


        oaModel.setCardMode(0);

        //download 2d pattern

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

    function onDocumentMouseDown(event) {
        event.preventDefault();
        if (event.which == 3) {
            oaModel.switchCardMode();
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
        var depthEditCtrl;
        var $savedHint;
        var loadedFileName = "";
        var angleChangeUI;
        var subLevelUI;
        var xLimitUI;
        var contourInfoUI;

        function noIm() {
            alert("not yet implemented!");
        }

        function newOAModel(opt) {
            scene.remove(oaModel);
            oaModel.destory();
            $.extend(modelOption, opt);
            OA.Utils.texture.loadAllTexture(modelOption);
            oaModel = new OA.Model(modelOption);
            scene.add(oaModel);
            setGlobalValuableByCardSize(modelOption.cardW, modelOption.cardH, modelOption.gridNum);
            oaModel.setCardMode(0);
            renderPreview();
        }

        var oaControl = {
            cardAngle: 90,
            angleChange: function(angle) {
                    oaModel.setCardAngle(angle);
                    oaModel.showEditPlane(false);
                    oaModel.setFoldable(true);
            },
            onAngleChange: function(e, angle) {
                  oaControl.cardAngle = oaModel.getCardAngle();
                  angleChangeUI.updateDisplay();
            },
            editDepth: 16,
            editDepthChange: function(value) {
                oaModel.setCardMode(0);
                oaModel.setEditDepth(value);
            },
            onEditDepthChange: function(e, value) {
                oaControl.editDepth = oaModel.getEditDepth();
                depthEditCtrl.updateDisplay();
            },
            isEditMode: true,
            editModeChange: function(value) {
                if (value) {
                    oaModel.setCardMode(0);
                } else {
                    oaModel.setCardMode(1);
                }
            },
            faceMode: "faces",
            faceModeChange: function(value) {
                oaModel.setFaceCreateMode(value);
                $modeText.html(value);
            },
            fundo: function() {
                oaModel.undo();
            },
            fredo: function() {
                oaModel.redo();
            },
            fclear: function() {
                if(oaControl.confirmModelChange()){
                     oaModel.clearAllFaces();
                }
            },
            cPrevious: function() {
                oaModel.prevContour();
            },
            cNext: function() {
                oaModel.nextContour();
            },
            cclear: function() {
                oaModel.clearContour();
            },
            liveContour_id: "---",
            contourIdChange: function() {

            },
            rotateX: function() {
                oaModel.contourRotateX();
            },
            cardW: modelOption.cardW,
            cardH: modelOption.cardH,
            gridNum: modelOption.gridNum,
            checkSaved: function() {
                if ($savedHint == undefined) {
                    return;
                }
                if (oaModel.checkModelSaved()) {
                    $savedHint.hide();
                } else {
                    $savedHint.show();
                }
            },
            otherUpdate: function() {
                oaControl.checkSaved();
            },
            newModel: function() {
                if (oaControl.confirmModelChange()) {
                    newOAModel(oaControl);
                    createGUI();
                }
            },
            readOAFile: function(evt){
                var f = evt.target.files[0];
                if (f) {
                    var r = new FileReader();
                    r.onload = function(e) {
                        var contents = e.target.result;
                        try {
                            if(oaControl.confirmModelChange()){
                                oaControl.passFileToModel(contents);
                                loadedFileName = f.name;
                            }
                        } catch (e) {
                            alert("Failed to load file");
                        }
                        //alert("Got the file.n" + "name: " + f.name + "n" + "type: " + f.type + "n" + "size: " + f.size + " bytesn" + "starts with: " + contents);
                    }
                    r.readAsText(f);
                } else {
                    alert("Failed to load file");
                }
                $fileUpload[0].value="";
            },
            confirmModelChange: function(){
                var res = false;
                if (!oaModel.checkModelSaved()) {
                    var r = confirm("discard all changes?");
                    if (r == true) {
                        res = true;
                    } else {}
                } else {
                    res = true;
                }
                return res;
            },
            passFileToModel: function(contents) {
                var fileObj = jQuery.parseJSON(contents);
                newOAModel(fileObj.settings);
                oaModel.setModel(fileObj);
                createGUI();
            },
            loadModel: function() {
                //will trigger readOAFile handle
                $fileUpload.click();
            },
            saveModel: function() {
                var downloadFile = function(filename, content) {
                    var blob = new Blob([content], {type: "application/json"});
                    var $link = $('<a></a>');
                    $link.attr({
                        download: filename,
                        href: (window.URL || window.webkitURL).createObjectURL(blob)
                    }).appendTo("body").get(0).click();
                    $link.remove();
                };

                var name;
                if (loadedFileName != "") {
                    name = loadedFileName;
                } else {
                    var date = new Date();
                    name = "oaCard_" + date + ".oa";
                }
                var fileObj = oaModel.getModel();
                downloadFile(name, JSON.stringify(fileObj));
                oaModel.setModelSaved();
                oaControl.checkSaved();
            },
            downloadImg: function() {
                //download 2d pattern
                var $imgContainer = $("#imgContainer");
                var $downloadLink = $imgContainer.children("a");
                var $previewUI = $("#previewUI");
                var $download2D = $("#download2D");
                var dataUrl = make2DImg(1000, 1000, previewW, previewH, $imgContainer, function() {
                    $downloadLink[0].click();
                });
            },
            subLevel: oaModel.getSubLevel(),
            xLimit: 1,
            subLevelChange: function(value) {
                oaModel.subdivision(value, oaControl.xLimit);
            },
            xLimitChange: function(value) {
                oaModel.subdivision(oaControl.subLevel, value);
            },
            onContourStateChange: function(i, state){
                var contourState = oaModel.contourState;
                if(contourState === 0){
                    oaControl.subLevel = 1;
                    oaControl.xLimit = 1
                    subLevelUI.updateDisplay();
                    xLimitUI.updateDisplay();
                }
                oaControl.liveContour_id = oaModel.getLiveContourID();
                contourInfoUI.updateDisplay();
            },
            onEditModeChange: function(){
                oaControl.isEditMode = oaModel.getEditMode();
            }

        };

    function createGUI() {
        var angleOpt;
        var gui = new dat.GUI({
            autoPlace: false
        });

        $datContainer = $("#datContainer");
        $previewUIwrapper.css("visibility", "hidden");
        $("body").append($previewUIwrapper);

        $datContainer.empty();
        $datContainer.append(gui.domElement);

        angleChangeUI = gui.add(oaControl, "cardAngle", 0, 180).step(-5).name("Card Angle")
            .onChange(oaControl.angleChange);

        depthEditCtrl = gui.add(oaControl, "editDepth", 0, oaControl.cardH - 1).step(gridStep).name("Edit Depth")
            .onChange(oaControl.editDepthChange);

        gui.add(oaControl, 'isEditMode').name("Edit Mode").listen()
            .onChange(oaControl.editModeChange);

        var f0 = gui.addFolder('Model');

        var f0_0 = f0.addFolder('New Model Settings');
        f0_0.add(oaControl, 'cardW', 50, 300).step(1).name('Card Width');
        f0_0.add(oaControl, 'cardH', 50, 300).step(1).name('Card Height');
        f0_0.add(oaControl, 'gridNum', 20, 100).step(1).name('Grid Num');
        f0.add(oaControl, 'newModel').name('<i class="fa fa-child"></i> New ');
        f0.open();

        f0.add(oaControl, 'loadModel').name('<i class="fa fa-folder-open"></i> Load');

        f0.add(oaControl, 'saveModel').name('<i class="fa fa-floppy-o"></i> Save ' +
            '<i id="savedHint" class="fa fa-circle" title="need save"></i>');

        //f0.open();

        var f1 = gui.addFolder('Face');
        var faceModeUI = f1.add(oaControl, 'faceMode', {
            'Faces': "faces",
            'Hole': "hole",
            'Pull': "pull"
        }).name('<i class="fa fa-paw fa-1x"></i> Face Mode')
            .onChange(oaControl.faceModeChange);

        $modeText.html(oaControl.faceMode);
        $modeText.click(function(e) {
            var index = (oaModel.getFaceCreateMode() + 1) % 3;
            var modeTye = ["faces", "hole", "pull"];
            $modeText.html(modeTye[index]);
            oaControl.faceMode = modeTye[index];
            faceModeUI.updateDisplay();
            oaModel.setFaceCreateMode(modeTye[index]);
            e.preventDefault();
        });
        f1.add(oaControl, 'fundo').name('<i class="fa fa-arrow-circle-left"></i> Undo');
        f1.add(oaControl, 'fredo').name('<i class="fa fa-arrow-circle-right "></i> Redo');
        f1.add(oaControl, 'fclear').name('<i class="fa fa-trash-o"></i> Clear Faces');
        f1.open();

        var f2 = gui.addFolder('Contour');
        f2.add(oaControl, 'cPrevious').name('<i class="fa fa-long-arrow-left"></i> Reuse Prev');
        f2.add(oaControl, 'cNext').name('<i class="fa fa-long-arrow-right"></i> Reuse Next');
        f2.add(oaControl, 'cclear').name('<i class="fa fa-times "></i> Clear Contour');
        contourInfoUI = f2.add(oaControl, 'liveContour_id').name('<i class="fa fa-info-circle"></i> Info');
        f2.add(oaControl, 'rotateX').name('<i class="fa fa-arrows-h"></i> Mirror');
        subLevelUI = f2.add(oaControl, "subLevel", 1, 5).step(1).name(' Subdivision').onChange(
            oaControl.subLevelChange);
        xLimitUI = f2.add(oaControl, "xLimit", 1, 100).step(5).name(' Subdiv X limit').onChange(
            oaControl.xLimitChange);

        f2.open();

        var f3 = gui.addFolder('2D Pattern');
        // f3.add(oaControl, 'width2D').min(600).max(1200).name('Width').onChange(oaControl.width2DChange);
        // f3.add(oaControl, 'height2D').min(600).max(1200).name('Height');
        f3.add(oaControl, 'downloadImg').name('<i class="fa fa-floppy-o fa-1x"></i> Save');
        //f3.open();

        $fileUpload.unbind("change").bind("change", oaControl.readOAFile);
        $savedHint = $datContainer.find("#savedHint");
        $datContainer.find(".close-button").before($previewUIwrapper);
        $previewUIwrapper.css("visibility", "visible");
       
        $(oaModel).unbind("facesClipped", oaControl.checkSaved)
            .bind("facesClipped", oaControl.checkSaved);
        oaControl.checkSaved();
        $(oaModel).unbind("editModeChange", oaControl.onEditModeChange)
            .bind("editModeChange", oaControl.onEditModeChange);
        oaControl.onEditModeChange();
        $(oaModel).unbind("angleChange", oaControl.onAngleChange)
            .bind("angleChange", oaControl.onAngleChange);
        oaControl.onAngleChange();    
        $(oaModel).unbind("zchange", oaControl.onEditDepthChange)
            .bind("zchange", oaControl.onEditDepthChange);
        oaControl.onEditDepthChange();
        $(oaModel).unbind("zchange", oaControl.onEditDepthChange)
            .bind("zchange", oaControl.onEditDepthChange);
        oaControl.onEditDepthChange();

        $(oaModel).unbind("contourStateChange", oaControl.onContourStateChange)
            .bind("contourStateChange", oaControl.onContourStateChange);
        oaControl.onContourStateChange();


    }
    createGUI();
};

//======================================
function setGlobalValuableByCardSize(cardW, cardH, gridNum) {

    maxWidth = cardW > cardH ? cardW : cardH;
    gridStep = maxWidth / gridNum;
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

    // $(oaModel).bind("editModeChange", function() {
    //     //renderPreview();
    // });

    var fogNear = viewerR / 18000;
    var fogFar = viewerR * 2.2;
    scene.fog = new THREE.Fog(0xffffff, fogNear, fogFar);
    camera.position.set(0, 0,  viewerR);
    orbitCtrls.noPan = true;
    orbitCtrls.zoomSpeed = 0.1;

    orbitCtrls.panUp(sceneOffset.y);
    orbitCtrls.maxPolarAngle = 120 * Math.PI / 180;
    orbitCtrls.rotateUp(10 * Math.PI / 180);
    orbitCtrls.rotateLeft(-14 * Math.PI / 180);

    orbitCtrls.minDistance =  viewerR ;
    orbitCtrls.maxDistance =  viewerR + oaModel.getInitEditT();

    oaModel.setCameraCtrl(orbitCtrls);
    orbitCtrls.target = new THREE.Vector3(sceneOffset.x, 0, 0);

}

//======================================


 
var slevel=0;
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

    
   if (e.which == 69) { //e redo
      slevel++;
        oaModel.subdivision(slevel);
      
    }


   if (e.which == 71) { //g 
        if (slevel > 0) {
             slevel--;
            oaModel.subdivision(slevel);
           
        }
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



