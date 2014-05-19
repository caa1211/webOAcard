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
  var mouse2D, mouse3D, raycaster, projector;
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


  function setMovePoint(intersector) {

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

    var radius = gridStep / 2;
    var innerR = radius - radius / 4;
    var segments = 32;

    var circleBorderGeom = new THREE.RingGeometry(innerR, radius, 32);
    var circleBorder = new THREE.Mesh(circleBorderGeom, materials[0]);
    var circleFillGeom = new THREE.CircleGeometry(innerR, 32);
    var circleFill = new THREE.Mesh(circleFillGeom, materials[1]);
    var rollOverMesh, rollOverMaterial;
    var cx = Math.floor((intersector.point.x / gridStep) + 0.5) * gridStep,
      cy, cz;
    cy = Math.floor((intersector.point.y / gridStep) + 0.5) * gridStep;
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

    console.error(cx + " " + cy + " " + cz + " editPlane " + editPlane.oaInfo.t);

  }



  function formatFloat(num, pos) {
    var size = Math.pow(10, pos);
    return Math.round(num * size) / size;
  }

  function onDocumentMouseMove() {
    event.preventDefault();
    //console.error()
    mouse2D.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse2D.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }


  function onMousewheel(event, delta, deltaX, deltaY) {
    var d = ((deltaY < 0) ? 1 : -1);
    console.log(delta, deltaX, deltaY);
    var newDist = formatFloat(editPlane.oaInfo.t + gridStep * d, 4);
    if (d > 0 && newDist < cardH) {
      editPlane.position.z = newDist;
      editPlane.oaInfo.t = newDist;
      // viewerR += gridStep;
    } else if (d < 0 && newDist > 0) {
      editPlane.position.z = newDist;
      editPlane.oaInfo.t = newDist;
      // viewerR -= gridStep;
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

    mouse2D = new THREE.Vector3(0, 10000, 0.5);
    projector = new THREE.Projector();

    function setMovePoint(intersector, parentGroup) {

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

      var radius = gridStep / 2;
      var innerR = radius - radius / 4;
      var segments = 32;

      var circleBorderGeom = new THREE.RingGeometry(innerR, radius, 32);
      var circleBorder = new THREE.Mesh(circleBorderGeom, materials[0]);
      var circleFillGeom = new THREE.CircleGeometry(innerR, 32);
      var circleFill = new THREE.Mesh(circleFillGeom, materials[1]);

      var cx = Math.floor((intersector.point.x / gridStep) + 0.5) * gridStep,
        cy, cz;
      if (false) {
        movePoint.add(circleFill);
        movePoint.add(circleBorder);
        if (intersector.object && intersector.object.parent && intersector.object.parent.oaInfo &&
          intersector.object.parent.oaInfo.type === "HFACE") {
          cy = intersector.object.parent.oaInfo.t;
          //cy = intersector.point.y;
          cz = Math.floor((intersector.point.z / gridStep) + 0.5) * gridStep;
          movePoint.position.set(cx, cy + 0.2, cz);
          movePoint.rotation.x = -Math.PI / 2;
        } else {
          cy = Math.floor((intersector.point.y / gridStep) + 0.5) * gridStep;
          //cz = intersector.point.z;
          cz = intersector.object.parent.oaInfo.t;
          movePoint.position.set(cx, cy, cz + 0.2);
        }
        //console.error("depth: "+ intersector.object.parent.oaInfo.depth + ", cz: " + cz);
        parentGroup.add(movePoint);
      } else {
        cy = Math.floor((intersector.point.y / gridStep) + 0.5) * gridStep;
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
        parentGroup.add(particles);
      }

    }

    //drawTestPoly();

    //test

    // boolenPoly
    //OA.utils.boolenPoly(model); 
    //OA.Utils.drawTestPoly(model);
    //     var geometry = new THREE.Geometry();

    //                 var shape1 = new THREE.Shape([
    //                     { x: 0, y: 0 },
    //                     { x: 44.38593055732901,   y: 23.019321704747888 },
    //                     { x: 21.366608913089213,  y: 67.40525225755971 },
    //                     { x: 10.68330445880321,   y: 33.702626159033905 },
    //                     { x: -23.019321639722587, y: 44.3859306133199 }].map(function(pt) {
    //                         return new THREE.Vector2(pt.x, pt.y);
    //                     }));


    //                 var shape2 = new THREE.Shape([
    //                     { x: 0,      y: 0 },
    //                     { x: 44.38,  y: 23.01 },
    //                     { x: 21.36,  y: 67.40 },
    //                     { x: 10.68,  y: 33.70 },
    //                     { x: -23.01, y:  44.38 }].map(function(pt) {
    //                         return new THREE.Vector2(pt.x, pt.y);
    //                     }));

    //                 console.log("Triangulating bad shape");
    //                 var shape1Points = shape1.extractPoints();
    //                 THREE.Shape.Utils.triangulateShape(shape1Points.shape, shape1Points.holes);
    //                 console.log("Bad shape done");



    //                 console.log("Triangulating good shape");
    //                 var shape2Points = shape2.extractPoints();
    //                var faces = THREE.Shape.Utils.triangulateShape(shape2Points.shape, shape2Points.holes);
    //                 console.log("Good shape done");

    // var geometry = new THREE.Geometry();
    // for (var i = 0; i < shape2Points.shape.length; i++) {
    //     geometry.vertices.push(new THREE.Vector3(shape2Points.shape[i].x, 0, shape2Points.shape[i].y));
    // }
    // for (var i = 0; i < faces.length ; i++) {
    //     var a = faces[i][2] , b = faces[i][1] , c = faces[i][0] ;
    //     var v1 = shape2Points.shape[a], v2 = shape2Points.shape[b], v3 = shape2Points.shape[c];

    //     geometry.faces.push( new THREE.Face3(a, b, c) );    
    //     // geometry.faceVertexUvs[0].push(
    //     //     [ new THREE.UV(v1.x ,v1.y ), new THREE.UV(v2.x, v2.y), new THREE.UV(v3.x, v3.y)]);
    // }
    // geometry.computeCentroids();
    // geometry.computeFaceNormals();
    //    var plane = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
    //          color: 0xff00ff,
    //          side: THREE.DoubleSide,

    //       }));

    //
    //create base H/V faces
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
      //   contours
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

    // [
    //     new THREE.Vector2(0, 0),
    //     new THREE.Vector2(cardW, 0),
    //     new THREE.Vector2(cardW, -cardH),
    //     new THREE.Vector2(0, -cardH)
    // ];

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
      gridData: {
        w: cardW,
        h: cardH,
        s: gridStep
      }
    });
    editPlane.name = "editPlane";
    //editPlane.angle=0;
    //editPlane.setAngle(180);
    model.add(editPlane);
    // objects.push(editPlane.children[0]);

    //model.add(editPlane);

    // var pAry = [
    //     new THREE.Vector2(0, 0),
    //     new THREE.Vector2(cardW, 0),
    //     new THREE.Vector2(cardW, -cardH),
    //     new THREE.Vector2(0, -cardH)
    // ];

    // var vFace = new OA.Face({
    //     ptnAry: pAry,
    //     cotours: [new OA.Contour({
    //       isHole: false,
    //       point2Ds:[
    //               [61,68],  
    //               [145,122],  
    //               [186,94], 
    //               [224,135],  
    //               [204,211],  
    //               [105,200],  
    //               [141,163],  
    //               [48,139], 
    //               [74,117]]
    //     })],
    //     type: "VFACE"
    // });


    // var pAryh = [
    //     new THREE.Vector2(0, 0),
    //     new THREE.Vector2(cardW, 0),
    //     new THREE.Vector2(cardW, cardH),
    //     new THREE.Vector2(0, cardH)
    // ];

    // var hFace = new OA.Face({
    //     ptnAry: pAryh,
    //     type: "HFACE"
    // });

    //model.add(vFace);
    // model.add(hFace);

    //  //test
    //  var plane = new THREE.Mesh(new THREE.CubeGeometry(10, 10, 10), new THREE.MeshBasicMaterial({
    //        color: 0xff0000,
    //        side: THREE.DoubleSide,
    //        //opacity: _setting.opacity,
    //        //visible: _setting.opacity === 0 ? false : true,
    //        transparent: true
    //    }));

    // model.add(plane);
    //
    bindEvents();
    return model;
  };

  function getRealIntersector(intersects) {
    for (i = 0; i < intersects.length; i++) {
      intersector = intersects[i];
      // debugger;
      // if (intersector.object != rollOverMesh) {
      return intersector;
      // }
    }
    return null;
  }


  this.setCameraCtrl = function(ctrl) {
    camera = ctrl.object;
    cameraCtrl = ctrl;
  };

  this.tick = function() {
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
    // if (cameraCtrl) {
    //   cameraCtrl.enabled = true;
    // }
    if (camera != null) {
      //console.error(JSON.stringify())
      raycaster = projector.pickingRay(mouse2D.clone(), camera);
      var intersects = raycaster.intersectObjects([editPlane.getObjectByName("faceBody")]);

      if (intersects.length > 0) {
        intersector = getRealIntersector(intersects);
        if (intersector) {

          if (movePoint && movePoint.remove) {
            model.remove(movePoint);
          }
          // if (cameraCtrl) {
          //   cameraCtrl.enabled = false;
          // }

          movePoint = new THREE.Object3D();
          setMovePoint(intersector);
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
  // this.getModel = function(){

  //  var plane = new THREE.Mesh(new THREE.CubeGeometry(10, 10, 10), new THREE.MeshBasicMaterial({
  //        color: 0xff0000,
  //        side: THREE.DoubleSide,
  //        //opacity: _setting.opacity,
  //        //visible: _setting.opacity === 0 ? false : true,
  //        transparent: true
  //    }));

  // model.add(plane);


  //    return model;
  // }


  this.test = function() {

    //alert(1);
  }
  return init();
};

OA.Model.prototype = Object.create(THREE.Object3D.prototype);