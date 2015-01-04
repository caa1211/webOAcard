function getUrlVar(key) {
    var result = new RegExp(key + "=([^&]*)", "i").exec(window.location.search);
    return result && unescape(result[1]) || "";
}

// To convert it to a jQuery plug-in, you could try something like this:
(function($) {
    $.getUrlVar = function(key) {
        var result = new RegExp(key + "=([^&]*)", "i").exec(window.location.search);
        return result && unescape(result[1]) || "";
    };
})(jQuery);


if (!Detector.webgl) Detector.addGetWebGLMessage();

var container = document.getElementById('container');
var $container = $(container);
var cameraOffset = OA.cameraOffset;

var debugMode = OA.debugMode;
var camera, scene, renderer;
var modelOption = {
    angle: 90,
    cardW: 120,
    cardH: 100,
    gridNum: 40,
    gridZstep: 5,
    domContainer: container
};
var spotLight;
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
var $loadingMask = $("#loadingMask");
var $tip = $("#tip");
var $tipBtn = $("#tipBtn");
$loadingMask.show = function(){
    this.fadeIn(300);
};
$loadingMask.hide = function(){
    this.fadeOut(300);
};

$loadingMask.hide();

function init(oa) {

    raycaster = new THREE.Raycaster();
    $tipBtn.click(function() {
        $tip.hasClass("hide") ?
            function() {
                $tip.removeClass("hide");
                $tipBtn.children(".fa").addClass("fa-rotate-90");
            }() :
            function() {
                $tip.addClass("hide");
                $tipBtn.children(".fa").removeClass("fa-rotate-90");
            }()
    });
    //==preview===
    scene2 = new THREE.Scene();
    renderer2 = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });

    $container2D.append(renderer2.domElement);
    cam2 = new THREE.PerspectiveCamera(45, $container2D.width() / $container2D.height(), 1, 20000);

    cam2.aspect = previewW / previewH;
    cam2.updateProjectionMatrix();
    renderer2.setSize(previewW, previewH);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, $container.width() / $container.height(), 0.1, 200000);
    //camera = new  THREE.OrthographicCamera( window.innerWidth / - 6, window.innerWidth / 6, window.innerHeight / 6, window.innerHeight / - 6, -1000, 1000);
    scene.add(camera);

    if (Detector.webgl)
        renderer = new THREE.WebGLRenderer({
            antialias: true//,
            //alpha: true//,
            // precision: "highp",
            // preserveDrawingBuffer: true,
        });
    else
        renderer = new THREE.CanvasRenderer();

    renderer.setClearColor(new THREE.Color(0xEEEEEE, 1.0));
    renderer.setSize($container.width(), $container.height());
    renderer.shadowMapEnabled = true;
    renderer.shadowMapSoft = true;
    renderer.shadowMapType = THREE.PCFShadowMap;

    container.appendChild(renderer.domElement);
    orbitCtrls = new THREE.OrbitControls(camera, renderer.domElement, container);

    setGlobalValuableByCardSize(cardW, cardH);
    renderPreview();

    if (OA.light) {
            //var ambientLight = new THREE.AmbientLight(0xEEEEEE);
            //scene.add(ambientLight);
        var spotLightBase = new THREE.SpotLight(0xffffff);
        spotLightBase.position.set(maxWidth*1.5, maxWidth*4.4, maxWidth*1.5);
        scene.add(spotLightBase);

        spotLight = new THREE.SpotLight(0xffffff);
        //spotLight.position.set(-viewerR * 1, viewerR * 1.0, viewerR*1.4 );
        //spotLight.shadowCameraVisible = true;
        spotLight.shadowDarkness = 0.2;
        spotLight.castShadow = true;
        spotLight.shadowCameraFov = 40;
        spotLight.shadowMapWidth = 2048;
        spotLight.shadowMapHeight = 2048;
        spotLight.shadowBias = -0.00001;
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
    spotLight.position.set(camera.position.x*1.6-250,camera.position.y*1.6-30, camera.position.z*1.6);

    var vector = mouse2D.clone().unproject( camera );
    var direction = new THREE.Vector3( 0, 0, -1 ).transformDirection( camera.matrixWorld );
    raycaster.set( camera.position, vector.sub( camera.position ).normalize());

    oaModel.tick({
        raycaster: raycaster,
        ctrlKey: mouse2D.ctrlKey,
        shiftKey: mouse2D.shiftKey
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
        oaModel.visible = false;
        scene.add(oaModel);
        setGlobalValuableByCardSize(modelOption.cardW, modelOption.cardH);
        oaModel.setCardMode(0);
        renderPreview();
        setTimeout(function(){
            oaModel.visible = true;
        }, 100);
    }

    function removeURLParameter() {
        var uri = window.location.toString();
        if (uri.indexOf("?") > 0) {
            var clean_uri = uri.substring(0, uri.indexOf("?"));
            window.history.replaceState({}, document.title, clean_uri);
        }
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
        editDepth: modelOption.gridZstep,
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
        gridNumChange: function(value){
            modelOption.gridNum = value;
            oaModel.setGridNum(value);
        },
        otherUpdate: function() {
            oaControl.checkSaved();
        },
        newModel: function() {
            if (oaControl.confirmModelChange()) {
                newOAModel(oaControl);
                createGUI();
                removeURLParameter();
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
                            oaControl.passFileToModel(contents, f.name);
                            loadedFileName = f.name;
                        }
                    } catch (e) {
                        alert("Failed to load file");
                    }
                    //alert("Got the file.n" + "name: " + f.name + "n" + "type: " + f.type + "n" + "size: " + f.size + " bytesn" + "starts with: " + contents);
                };
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
        passFileToModel: function(contents, name) {
            var fileObj = jQuery.parseJSON(contents);
            newOAModel(fileObj.settings);
            oaModel.setModel(fileObj);
            if(name){
                history.pushState(null, null, "?m="+name.toLowerCase());
            }
            createGUI();
        },
        passJsonToModel: function(jsonContents, name) {
            var fileObj = jsonContents;
            newOAModel(fileObj.settings);
            oaModel.setModel(fileObj);
            oaControl.editModeChange(0);
            if(name){
                history.pushState(null, null, "?m="+name.toLowerCase());
            }
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
            // if (loadedFileName != "") {
            //     name = loadedFileName;
            // } else {
            var date = new Date();
            name = "oaCard_" + date + ".oa";
            //}
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
        },
        textInput: "ABC",
        textSize: 20,
        textBold: true,
        textItalic: false,
        textAdd: function(){
            oaControl.textSize = parseInt(oaControl.textSize);
            if(oaControl.textInput == null){
                return;
            }
            oaModel.addTextContour(
                oaControl.textInput,
                oaControl.textSize,
                oaControl.textBold,
                oaControl.textItalic
            );
        },
        alignXCenter: function(){
            oaModel.contourAlignXCenter();
        }
    };

    var gui = null;
    function createGUI() {
        var angleOpt;
        $previewUIwrapper.css("visibility", "hidden");
        $("body").append($previewUIwrapper);
        if(gui != null){
            $(gui.domElement).unbind().remove();
        }
        gui = new dat.GUI();
        $guiDom = $(gui.domElement);
        $guiDom.prepend($previewUIwrapper);
        angleChangeUI = gui.add(oaControl, "cardAngle", 0, 180).step(-5).name("Card Angle")
            .onChange(oaControl.angleChange);

        depthEditCtrl = gui.add(oaControl, "editDepth", 0, oaControl.cardH - 1).step(modelOption.gridZstep).name("Edit Depth")
            .onChange(oaControl.editDepthChange);

        gui.add(oaControl, 'gridNum', 20, 100).step(1).name('Grid Number')
            .onChange(oaControl.gridNumChange);

        gui.add(oaControl, 'isEditMode').name("Edit Mode").listen()
            .onChange(oaControl.editModeChange);

        var f1 = gui.addFolder('Face');
        var faceModeUI = f1.add(oaControl, 'faceMode', {
            'Faces': "faces",
            'Hole': "hole",
            'Pull': "pull"
        }).name('<i class="fa fa-paw fa-1x"></i> Face Mode')
            .onChange(oaControl.faceModeChange);
        oaControl.faceMode = "faces";
        $modeText.html(oaControl.faceMode);
        $modeText.unbind("click").click(function(e) {
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
        var f2_1 = f2.addFolder('Text');
        f2_1.add(oaControl, 'textInput').name('<i class="fa fa-font  "></i> Input');
        f2_1.add(oaControl, 'textSize', 5, cardH).name('<i class="fa fa-text-height  "></i> Size');
        f2_1.add(oaControl, 'textBold').name('<i class="fa fa-bold "></i> Bold');
        f2_1.add(oaControl, 'textItalic').name('<i class="fa fa-italic "></i> Italic');
        f2_1.add(oaControl, 'textAdd').name('<i class="fa fa-plus   "></i> Add');

        contourInfoUI = f2.add(oaControl, 'liveContour_id').name('<i class="fa fa-info-circle"></i> Info');
        f2.add(oaControl, 'cPrevious').name('<i class="fa fa-long-arrow-left"></i> Reuse Prev');
        f2.add(oaControl, 'cNext').name('<i class="fa fa-long-arrow-right"></i> Reuse Next');
        f2.add(oaControl, 'cclear').name('<i class="fa fa-times "></i> Clear Contour');

        f2.add(oaControl, 'rotateX').name('<i class="fa fa-arrows-h"></i> Flip');
        f2.add(oaControl, 'alignXCenter').name('<i class="fa fa-compress"></i> Align Center');
        subLevelUI = f2.add(oaControl, "subLevel", 1, 5).step(1).name(' Subdivision').onChange(
            oaControl.subLevelChange);
        xLimitUI = f2.add(oaControl, "xLimit", 1, 100).step(5).name(' Subdiv X limit').onChange(
            oaControl.xLimitChange);
        //f2.open();

        $fileUpload.unbind("change").bind("change", oaControl.readOAFile);
        $savedHint = $guiDom.find("#savedHint");
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
        $(oaModel).unbind("contourStateChange", oaControl.onContourStateChange)
            .bind("contourStateChange", oaControl.onContourStateChange);
        oaControl.onContourStateChange();

    }
    createGUI();


    var fileGUI = null;

    function createFileGUI(){
        if(fileGUI != null){
            $(fileGUI.domElement).unbind().remove();
        }
        fileGUI = new dat.GUI({
            autoPlace: false
        });
        $fileUIContainer = $("#fileUIContainer");
        $fileUIContainer.append(fileGUI.domElement);
        fileGUI.add(oaControl, 'newModel').name('<i class="fa fa-child"></i> New ');
        var f0_0 = fileGUI.addFolder('Settings');
        f0_0.add(oaControl, 'cardW', 50, 300).step(1).name('Width');
        f0_0.add(oaControl, 'cardH', 50, 300).step(1).name('Height');
        fileGUI.open();
        fileGUI.add(oaControl, 'loadModel').name('<i class="fa fa-folder-open"></i> Load');
        buildRecentList(fileGUI);
        fileGUI.add(oaControl, 'saveModel').name('<i class="fa fa-floppy-o"></i> Save ' +
            '<i id="savedHint" class="fa fa-circle" title="need save"></i>');
    }

    function buildRecentList(gui){
        var demoControl = {};
        var recentFolder = gui.addFolder('Open Recent');
        $(recentFolder.domElement).addClass("recentFolder");
        $.each(demoList, function(i, d){
            demoControl[d.name]= function(){
                var path = d.path;
                $loadingMask.show();
                $.getJSON(path, function(data){
                    oaControl.passJsonToModel(data, d.name);
                    $loadingMask.hide();
                });
            };
            recentFolder.add(demoControl, d.name).name(d.name);
        });
        $(recentFolder.domElement).find("li:not(.title)").addClass("recentItem");
    }

    createFileGUI();

    //load demo model from url parameter
    $.ajaxSetup({ cache: false });
    var urlParam = getUrlVar("m").toLowerCase();
    function loadDemoModel(name) {
        if (name) {
            $.each(demoList, function(i, t) {
                if (t.name.toLowerCase() === name) {
                    var path = t.path;
                    $loadingMask.show();
                    $.getJSON(path, function(data) {
                        oaControl.passJsonToModel(data, name);
                        $loadingMask.hide();
                    });
                }
            });
        }
    }
    loadDemoModel(urlParam);
};

//======================================
function setGlobalValuableByCardSize(cw, ch) {
    cardH = ch;
    cardW = cw;
    maxWidth = cardW > cardH ? cardW : cardH;
    viewerR = maxWidth * 2.5;
    sceneOffset = new THREE.Vector3(cardW / 2, cardH / 3, 0);
    cam2.position.set(0, viewerR, 0);
    scene2.position.x = 0;
    cam2.position.x = cardW / 2;
    cam2.lookAt(new THREE.Vector3(cardW / 2, 0, 0));
    cam2.rotation.z = 0 * Math.PI / 180;

    $(oaModel).bind("facesClipped", function() {
        renderPreview();
    });

    $(oaModel).bind("editModeChange", function(e, b) {
        if(b){//editing
            $tip.removeClass("contouring contoured display").addClass("edit");
        }else{//display
            $tip.removeClass("contouring contoured edit").addClass("display");
        }
    });

    $(oaModel).bind("contourStateChange", function(e, b) {
        if(b===0){//edit
            $tip.removeClass("contouring contoured display").addClass("edit");
        }
        else if(b===1){//contour editing
            $tip.removeClass("edit contoured display").addClass("contouring");
        }else if(b ===2){//contour closed
            $tip.removeClass("edit contouring display").addClass("contoured");
        }
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

    orbitCtrls.maxDistance =  viewerR + cardH/3;

    oaModel.setCameraCtrl(orbitCtrls);
    orbitCtrls.target = new THREE.Vector3(sceneOffset.x, 0, 0);

}

//======================================


window.addEventListener("keydown", function(e) {
    mouse2D.ctrlKey = e.ctrlKey;
    mouse2D.shiftKey = e.shiftKey;

    if (e.which == 90 && e.metaKey) {
        oaModel.undo();
        e.preventDefault();
        return false;
    }
    if (e.which == 89 && e.metaKey) {
        oaModel.redo();
        e.preventDefault();
        return false;
    }
});

window.addEventListener("keyup", function(e) {
    var imgData, imgNode;
    mouse2D.ctrlKey = false;
    mouse2D.shiftKey = false;
});

/*** Debug key ***/
window.addEventListener("keyup", function(e) {

    //Listen to 'P' key
    if (e.which == 80) { //p
        //  doPreview = true;
        //make2DImg(1000, 1000, 250, 250, $("#imgContainer"));
    }

    if (e.which == 68) { //d undo
        //  doPreview = true;
        //oaModel.undo();
    }

    if (e.which == 70) { //f redo
        //  doPreview = true;
        //oaModel.redo();
        // oaModel.moveContourTest()
    }


    if (e.which == 69) { //e redo


        // oaModel.setGridNum(100)
    }


    if (e.which == 71) { //g 
        // oaModel.addTextContour("aa")
    }



    if (e.which == 82) { //r
        //  oaModel.setCardAngle(180)
        // m2 = new OA.Model(modelOption)//oaModel.clone();
        // var cfs = oaModel.getCloneClippedFaces();
        // m2.setClippedFaces(cfs);
        // m2.updateModel(cfs);
        // m2.unbindEvents();

        // m2.setCardAngle(180)


        // if (model2d != null) {
        //     scene2.remove(model2d)

        // }
        // model2d = oaModel.build2DPattern();
        // scene2.add(model2d);

        // renderer2.render(scene2, cam2);



        //oaModel.setCardAngle(90)
        //      m2.setCardAngle(180)

    }
    //  debugger;
    // imgNode = document.createElement("img");
    // imgNode.src = imgData;
    // document.body.appendChild(imgNode);
});


