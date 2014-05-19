OA.Model = function(userSetting) {

  THREE.Object3D.call(this);

  //private
  var _def = {
    cardW: 64,
    cardH: 36,
    gridNum: 20,
    initAngle: 90
  };

  var editPlane = null;
  var movePointTexture = THREE.ImageUtils.loadTexture("img/cborder.png");
  var movePointFillTexture = THREE.ImageUtils.loadTexture("img/cfill.png");
  var movePoint = new THREE.Object3D();
  var _setting = $.extend({}, _def, userSetting);
  var cardW = _setting.cardW,
    cardH = _setting.cardH;
  var gridStep = cardW / _setting.gridNum;
  var model = this;
  var faces = [];
  var edges = [];
  var raycaster;
  var camera = null;
  var cardAngle = _setting.initAngle;
  var refreshFaceGroup = new THREE.Object3D();
  var cameraCtrl = null;
  refreshFaceGroup.cardAngle = null;
  var bindEvents = function() {
    $(window).bind("mousewheel", onMousewheel);
    $(window).bind("mousemove", onDocumentMouseMove);
  };

  var unbindEvents = function() {
    $(window).unbind("mousewheel", onMousewheel);
    $(window).unbind("mousemove", onDocumentMouseMove);

  };

  function setMovePointPosition(intersector) {

    if (intersector.face === null) {
      console.log(intersector)
    }

    var materials = [
      new THREE.MeshBasicMaterial({
        color: 0x174F89
      }),
      new THREE.MeshBasicMaterial({
        color: 0xDCAAAF
      })
    ];

    var cx = Math.floor((intersector.point.x / gridStep) + 0.5) * gridStep,
    cy = Math.floor((intersector.point.y / gridStep) + 0.5) * gridStep,
    cz = intersector.object.parent.oaInfo.t + 0.2;

    material = new THREE.SpriteMaterial({
      map: movePointTexture,
      transparent: true,
      opacity: 0.5,
      useScreenCoordinates: false,
      color: 0xffffff
    });

    var particle = new THREE.Particle(material);
    particle.position.x = cx;
    particle.position.y = cy;
    particle.position.z = cz + 0.1;
    // Set the size of the particle
    particle.scale.x = particle.scale.y = particle.scale.z = gridStep * 1.0;
    var particle2 = particle.clone();
    particle2.material = new THREE.SpriteMaterial({
      map: movePointFillTexture,
      transparent: false,
      opacity: 0.3,
      useScreenCoordinates: false,
      color: 0xffffff
    });
    particle2.scale.x = particle2.scale.y = particle2.scale.z = gridStep * 1.5;

    var particles = new THREE.ParticleSystem();
    particles.add(particle);
    particles.add(particle2);
    movePoint.add(particles);
    //console.error(cx + " " + cy + " " + cz + " editPlane " + editPlane.oaInfo.t);
  }

  function formatFloat(num, pos) {
    var size = Math.pow(10, pos);
    return Math.round(num * size) / size;
  }

  function onDocumentMouseMove() {
    event.preventDefault();
    // mouse2D.x = (event.clientX / window.innerWidth) * 2 - 1;
    // mouse2D.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }


  function onMousewheel(event, delta, deltaX, deltaY) {
    var d = ((deltaY < 0) ? 1 : -1);
    console.log(delta, deltaX, deltaY);
    var newDist = formatFloat(editPlane.oaInfo.t + gridStep * d, 4);
    if (d > 0 && newDist < cardH) {
      editPlane.position.z = newDist;
      editPlane.oaInfo.t = newDist;
      // viewerR += gridStep;
    } else if (d < 0 && newDist >= 0) {
      editPlane.position.z = newDist;
      editPlane.oaInfo.t = newDist;
    }
    //event.stopPropagation();
    event.preventDefault();

    var d = ((deltaY < 0) ? -1 : 1);
    //console.log(delta, deltaX, deltaY);
    var newAngle = cardAngle + d * 5;
    if (newAngle >= 0 && newAngle <= 180) {
      cardAngle = newAngle;
    }


  }

  var init = function() {

    var pAryV = [
      [0, 0],
      [cardW, 0],
      [cardW, -cardH],
      [0, -cardH]
    ];
    //var pAry = [[0, -cardH], [cardW, -cardH], [cardW, 0], [0, 0]];

    var vFace = new OA.Face({
      contours: [{
        "outer": pAryV.map(function(i) {
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
      type: "VFACE"
    });

    faces.push(vFace);
    refreshFaceGroup.add(vFace);


    // var tFace = new OA.Face({
    //   contours: OA.Utils.getTestExPolygonTree(),
    //   //   contours
    //   type: "VFACE"
    // });

    // faces.push(tFace);
    // refreshFaceGroup.add(tFace);


    var pAryH = [
      [0, 0],
      [cardW, 0],
      [cardW, cardH],
      [0, cardH]
    ];
    var hFace = new OA.Face({
      contours: [{
        "outer": pAryH.map(function(i) {
          return {
            "X": i[0],
            "Y": i[1]
          };
        }),
        "holes": [
          [ /*points*/ ]
        ]
      }],
      type: "HFACE"
    });
    faces.push(hFace);
    refreshFaceGroup.add(hFace);

    var pEditAry = [
      [0, 0],
      [cardW, 0],
      [cardW, -cardH],
      [0, -cardH]
    ];

    editPlane = new OA.Face({
      contours: [{
        "outer": pAryV.map(function(i) {
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
      borderColor: 0x237BD7,
      gridData: {
        w: cardW,
        h: cardH,
        s: gridStep,
        color: 0x1F6CBD,
        opacity: 0.2
      }
    });
    editPlane.name = "editPlane";
    model.add(editPlane);
   
    bindEvents();
    return model;
  };

  function getRealIntersector(intersects) {
    for (i = 0; i < intersects.length; i++) {
      intersector = intersects[i];
      return intersector;
    }
    return null;
  }


  this.setCameraCtrl = function(ctrl) {
    camera = ctrl.object;
    cameraCtrl = ctrl;
  };

  this.tick = function(params) {
    if (refreshFaceGroup.cardAngle !== cardAngle) {
      model.remove(refreshFaceGroup)
      refreshFaceGroup = new THREE.Object3D();
      refreshFaceGroup.cardAngle = cardAngle;
      for (var i = 0; i < faces.length; i++) {
        refreshFaceGroup.add(faces[i]);
        faces[i].setAngle(cardAngle);
      }
      model.add(refreshFaceGroup);
    }
    if (camera != null) {
      var intersects = params.raycaster.intersectObjects([editPlane.getObjectByName("faceBody")]);
      if (intersects.length > 0) {
        intersector = getRealIntersector(intersects);
        if (intersector) {
          if (movePoint && movePoint.remove) {
            model.remove(movePoint);
          }
          movePoint = new THREE.Object3D();
          setMovePointPosition(intersector);
          model.add(movePoint);
        }
      }
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