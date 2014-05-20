OA.Model = function(userSetting) {

  THREE.Object3D.call(this);

  //private
  var _def = {
    cardW: 64,
    cardH: 90,
    gridNum: 20,
    initAngle: 90
  };

  var editPlane = null;

  
  var _setting = $.extend({}, _def, userSetting);
  var cardW = _setting.cardW, cardH = _setting.cardH;
  var gridStep = cardW / _setting.gridNum;
  var movePoint = new OA.Point({scale: gridStep});
  var model = this;
  var userFaces = [];
  var edges = [];
  var raycaster = null;
  var camera = null;
  var cardAngle = _setting.initAngle;
  var refreshFaceGroup = new THREE.Object3D();
  var cameraCtrl = null;
  refreshFaceGroup.cardAngle = null;
  var foldable = true;
  var liveContour = null;
  var contourStateType = {"NO_EDITING" : 0, "EDITING": 1, "CLOSE": 2};
  this.contourState = contourStateType.NO_EDITING;

  var bindEvents = function() {
    $(window).bind("mousewheel", onMousewheel);
    $(window).bind("mousemove", onDocumentMouseMove);
    $(window).bind("mousedown", onMousedown);
    $(window).bind("mouseup", onMouseup);
  };


  var unbindEvents = function() {
    $(window).unbind("mousewheel", onMousewheel);
    $(window).unbind("mousemove", onDocumentMouseMove);
    $(window).unbind("mousedown", onMousedown);
    $(window).bind("mouseup", onMouseup);
  };

  function getHoverPosition(intersector) {
    if (intersector.face === null) {
      //OA.log(intersector)
    }
    var cx = Math.floor((intersector.point.x / gridStep) + 0.5) * gridStep,
      cy = Math.floor((intersector.point.y / gridStep) + 0.5) * gridStep,
      cz = intersector.object.parent.oaInfo.t;
    return new THREE.Vector3(cx, cy, cz);
  }

  function formatFloat(num, pos) {
    var size = Math.pow(10, pos);
    return Math.round(num * size) / size;
  }

  function onDocumentMouseMove(event) {

  }

  function enterContourEditingState() {
    model.contourState = contourStateType.EDITING;
    if(liveContour == null){
      liveContour = new OA.Contour({startPointSize: gridStep, t: editPlane.oaInfo.t});
      model.add(liveContour);
    }
    //cameraCtrl.enabled = false;
    movePoint.setColor(1);
  }

  function enterContourNoEditingState() {
    model.contourState = contourStateType.NO_EDITING;
    model.remove(liveContour);
    liveContour = null;
    cameraCtrl.enabled = true;
    movePoint.setColor(0);
  }

  function enterContourCloseState() {
    model.contourState = contourStateType.CLOSE;
    movePoint.setColor(2);
  }


  function addSimpleFaceToModel(pointAry, faceType, t){
    var rt = 0;
    if(editPlane && editPlane.oaInfo && editPlane.oaInfo.t){
      rt = editPlane.oaInfo.t;
    }
    var newFace = new OA.Face({
      t: rt,
      contours: [{
        "outer": pointAry,
        "holes": [
          [ /*points*/ ]
        ]
      }],
      type: faceType
    });
    userFaces.push(newFace);
    refreshFaceGroup.add(newFace);
  }

  function onMousedown(event){
    event.preventDefault();
    if (movePoint.isVisible) {
       cameraCtrl.noZoom = true;
       cameraCtrl.noRotate = true;

        if(event.which ===1 ){
           if(liveContour === null){
              enterContourEditingState();
           }
           if(!liveContour.checkClosed()){
             var p = movePoint.getPosition3D();
             liveContour.addPosition3D(p);
             if(liveContour.checkClosed()){
                enterContourCloseState();
             }
           }else{

              var ary = liveContour.getPoint2DAry();
              enterContourNoEditingState();
              if(ary.length>2){
                 addSimpleFaceToModel(ary, "VFACE");
              }
           }
        }else if(event.which === 3){

           if(model.contourState === contourStateType.EDITING){
             if(liveContour.getPointSize()>1){
                liveContour.undo();
                // if(model.contourState == contourStateType.CLOSE){
                //    enterContourEditingState();
                // }
             }else if(liveContour.getPointSize()===1){
                liveContour.undo();
                enterContourNoEditingState();
                event.stopImmediatePropagation();
             }
           }
           else if(model.contourState === contourStateType.CLOSE){
                $(window).bind("mousemove", onDragContour);
           }
        
        }
      
    }
  }

  function onDragContour(event){
     liveContour.moveTo(movePoint.getPosition3D(), editPlane.oaInfo.t);
  }

  function onMouseup(event){
    $(window).unbind("mousemove", onDragContour);
    event.preventDefault();
    cameraCtrl.noZoom = false;
    cameraCtrl.noRotate = false;
  }

  function onMousewheel(event, delta, deltaX, deltaY) {
    event.preventDefault();
    if(editPlane.isVisible && model.contourState!==contourStateType.EDITING){
      var d = ((deltaY < 0) ? 1 : -1);
      //OA.log(delta, deltaX, deltaY);
      var newDist = formatFloat(editPlane.oaInfo.t + gridStep * d , 4);
      if (d > 0 && newDist < cardH) {
        editPlane.position.z = newDist+0.1;
        editPlane.oaInfo.t = newDist;
        // viewerR += gridStep;
      } else if (d < 0 && newDist >= 0) {
        editPlane.position.z = newDist+0.1;
        editPlane.oaInfo.t = newDist;
      }

      if(model.contourState === contourStateType.CLOSE){
        liveContour.moveTo(null, editPlane.oaInfo.t);
      }
    }

    if(foldable){
      var d = ((deltaY < 0) ? -1 : 1);
      //OA.log(delta, deltaX, deltaY);
      var newAngle = cardAngle + d * 5;
      if (newAngle >= 0 && newAngle <= 180) {
        cardAngle = newAngle;
      }
    }


  }

  var init = function() {
    // var tFace = new OA.Face({
    //   contours: OA.Utils.getTestExPolygonTree(),
    //   //   contours
    //   type: "VFACE"
    // });

    // faces.push(tFace);
    // refreshFaceGroup.add(tFace);
    var editBufferY = gridStep * 4;
    var pEditAry = [
      [0, editBufferY],
      [cardW, editBufferY],
      [cardW, -cardH],
      [0, -cardH]
    ];
    editPlane = new OA.Face({
      contours: [{
        "outer": pEditAry.map(function(i) {
          return {
            "X": i[0],
            "Y": i[1]
          };
        }),
        "holes": [
          [ /*points*/ ]
        ]
      }],
      //   contours
      type: "VFACE",
      opacity: 0,
      depthTest: false,
      depthWrite: false,
      borderColor: 0x5399E3,
      addingLine: [[0, 0],[cardW, 0]],
      gridData: {
        w: cardW,
        h: cardH,
        s: gridStep,
        color: 0x1F6CBD,
        opacity: 0.2,
        extendY: editBufferY
      }
    });
    editPlane.name = "editPlane";
    model.add(editPlane);
    model.add(movePoint);


    var pAryV = [
      [0, 0],
      [cardW, 0],
      [cardW, -cardH],
      [0, -cardH]
    ];
    //base vface
    addSimpleFaceToModel(OA.Utils.ary2Point2Dary(pAryV), "VFACE");
    var pAryH = [
      [0, 0],
      [cardW, 0],
      [cardW, cardH],
      [0, cardH]
    ];
    //base hface
    addSimpleFaceToModel(OA.Utils.ary2Point2Dary(pAryH), "HFACE");


    bindEvents();
    model.updateCardAngle();
    return model;
  };

  function getRealIntersector(intersects) {
    for (i = 0; i < intersects.length; i++) {
      intersector = intersects[i];
      return intersector;
    }
    return null;
  }

  this.showEditPlane = function(showFlag){
      OA.Utils.setObject3DVisible(editPlane, !!showFlag);
  };

  this.updateCardAngle = function() {
    var faces = userFaces;
    if (refreshFaceGroup.cardAngle !== cardAngle){
      model.remove(refreshFaceGroup)
      refreshFaceGroup = new THREE.Object3D();
      refreshFaceGroup.cardAngle = cardAngle;
      for (var i = 0; i < faces.length; i++) {
        var f = faces[i];
        refreshFaceGroup.add(f);
        f.setAngle(cardAngle);
      }
      model.add(refreshFaceGroup);
     }
  };

  this.setFoldable = function(canFold, angle){
       foldable = canFold;
       if(angle != undefined && angle !== cardAngle){
          cardAngle = angle;
          model.updateCardAngle();
      }
  };

  this.setCameraCtrl = function(ctrl) {
    camera = ctrl.object;
    cameraCtrl = ctrl;
  };

  this.tick = function(params) {
      raycaster = params.raycaster;
      if (foldable) {
         model.updateCardAngle();
      }
      if (editPlane.isVisible === true) {
        var intersects = raycaster.intersectObjects([editPlane.getObjectByName("faceBody")]);
        if (intersects.length > 0) {
          intersector = getRealIntersector(intersects);
          if (intersector) {
            var hoverPos = getHoverPosition(intersector);
            if(!movePoint.isEqualPosition(hoverPos)){
              movePoint.setPosition3D(hoverPos);
              movePoint.setVisible(true);
            }

            if(liveContour!=null){
              if (model.contourState === contourStateType.EDITING) {
                movePoint.setColor(1);
                var pos3Ds = liveContour.getPosition3Ds();
                var movePointPos = movePoint.getPosition3D();
                var distFromFitstP;
              try{
                distFromFitstP = pos3Ds[0].distanceTo(movePoint.getPosition3D());
                if (pos3Ds.length > 2 && distFromFitstP < gridStep *2) {
                  movePoint.setPosition3D(pos3Ds[0]);
                  movePoint.setColor(2);
                }
                liveContour.drawHoverLine(movePoint.getPosition3D());
              }catch(e){
                debugger;
              }
              }else if(model.contourState === contourStateType.CLOSE){
                
              }
            }
          }
        }else{
          movePoint.setVisible(false);
        }
      }else{
        movePoint.setVisible(false);
      }
  };

  

  //public
  this.destory = function() {
    unbindEvents();
  };

  this.getCardW = function() {
    return cardW;
  };

  this.getCardH = function() {
    return cardH;
  };

  return init();
};

OA.Model.prototype = Object.create(THREE.Object3D.prototype);