OA.Face = function(userSetting) {
   THREE.Object3D.call(this);
   //private
   var _def = {
      contours: [{
         "outer": [],
         "holes": [
            [ /*points*/ ]
         ]
      }],
      t: 0,
      type: "HFACE", //HFACE or VFACE,
      opacity: 1,
      gridData: {},
      borderColor: 0x374F69,
      borderWidth: 3,
      initAngle: 90
   };
   var face = this;

   var contour = [];
   var rot = [Math.PI / 2, 0, 0];
   var _setting = $.extend({}, _def, userSetting);
   var typeOpts = {
      "HFACE": {
         color: 0xE9DABC
      },
      "VFACE": {
         color: 0xEADED2
      }
   };
   face.oaInfo = _setting;
   var type = _setting.type;

   var createLine = function(geometry) {
      return new THREE.Line(geometry, new THREE.LineBasicMaterial({
         linewidth: _setting.borderWidth,
         color: _setting.borderColor
      }));
   };

   var getObject3DByCoutours = function(contours) {
      var exPolygons = contours;
      var border, borderGeo, p, a, i, j, jlen, ilen, exPolygon, holes, outer, polygon, outer_shape, hole_shape;
      var alen = exPolygons.length;
      var shapes = new Array(alen);
      for (a = 0; a < alen; a++) {
         exPolygon = exPolygons[a];
         holes = exPolygon.holes;
         outer = exPolygon.outer;
         jlen = outer.length;
         if (jlen && jlen > 0) {
            borderGeo = new THREE.Geometry();
            for (j = 0; j < jlen; j++) {
               point = outer[j];
               point = new THREE.Vector2(point.X, point.Y); // convert Clipper point to THREE.Vector2
               outer[j] = point;

               p = new THREE.Vector3(point.x, point.y, 0);
               borderGeo.vertices.push(new THREE.Vertex(p));

               if (j == jlen - 1) {
                  //    debugger;
                  p = new THREE.Vector3(outer[0].x, outer[0].y, 0);
                  borderGeo.vertices.push(new THREE.Vertex(p));
               }
            }

            face.add(createLine(borderGeo));

            outer = new THREE.Shape(outer);
            ilen = holes && holes.length;
            if (ilen && ilen > 0) {

               for (i = 0; i < ilen; i++) {
                  polygon = holes[i];
                  borderGeo = new THREE.Geometry();
                  for (j = 0, jlen = polygon.length; j < jlen; j++) {
                     point = polygon[j];
                     point = new THREE.Vector2(point.X, point.Y); // convert Clipper point to THREE.Vector2
                     polygon[j] = point;
                     p = new THREE.Vector3(point.x, point.y, 0);
                     borderGeo.vertices.push(new THREE.Vertex(vv));
                     if (i == ilen - 1) {
                        p = new THREE.Vector3(polygon[0].x, polygon[0].y, 0);
                        borderGeo.vertices.push(new THREE.Vertex(vv));
                     }
                  }
                  if (jlen > 0) {
                     face.add(createLine(borderGeo));
                     holes[i] = new THREE.Shape(polygon);
                  }
               }
               if (polygon.length > 0) {
                  outer.holes = holes;
               }
            }
            shapes[a] = outer;
         }
      }
      shapes = shapes.filter(function() {
         return true
      });

      var planeGeom = new THREE.ShapeGeometry(shapes);
      var plane = new THREE.Mesh(planeGeom, new THREE.MeshBasicMaterial({
         color: typeOpts[type].color,
         side: THREE.DoubleSide,
         opacity: _setting.opacity,
         visible: _setting.opacity === 0 ? false : true,
         transparent: true
      }));
      plane.name = "faceBody";
      face.add(plane);

   };

   function createFaceGrid(face, gridData) {;
      var geometry = new THREE.Geometry();
      for (var i = 0; i <= gridData.h; i += gridData.s) {
         geometry.vertices.push(new THREE.Vector3(0, -i, 0));
         geometry.vertices.push(new THREE.Vector3(gridData.w, -i, 0));
      }
      for (var i = 0; i <= gridData.w; i += gridData.s) {
         geometry.vertices.push(new THREE.Vector3(i, 0, 0));
         geometry.vertices.push(new THREE.Vector3(i, -gridData.h, 0));
      }
      var material = new THREE.LineBasicMaterial({
         color: 0x9699A4,
         linewidth: 1,
         opacity: 0.3,
         transparent: true
      });
      var line = new THREE.Line(geometry, material);
      line.type = THREE.LinePieces;
      face.add(line);
   }

   //var faceMesh = new THREE.Object3D();
   //public
   var init = function() {
      //debugger;
      face.rotation.set(rot[0], rot[1], rot[2]);


      getObject3DByCoutours(_setting.contours)

      // var shape = new THREE.Shape(_setting.ptnAry);
      // var planeGeom = new THREE.ShapeGeometry(shape);

      // var type = _setting.type;
      // var plane = new THREE.Mesh(planeGeom, new THREE.MeshBasicMaterial({
      //    color: typeOpts[type].color,
      //    side: THREE.DoubleSide,
      //    opacity: _setting.opacity,
      //    visible: _setting.opacity === 0 ? false : true,
      //    transparent: true
      // }));
      // that.oaInfo = _setting;
      // //face.angle = null;
      // that.add(plane);
      // var pointsGeom = shape.createPointsGeometry();
      // var border = new THREE.Line(pointsGeom, new THREE.LineBasicMaterial({
      //    linewidth: _setting.borderWidth,
      //    color: _setting.borderColor
      // }));
      // that.rotation.set(rot[0], rot[1], rot[2]);
      // that.add(border);
      if (_setting.gridData) {
         createFaceGrid(face, _setting.gridData);
      }
      applyAngle(face, _setting.initAngle);
      return face;
   };

   this.setAngle = function(angle) {
      applyAngle(this, angle);
   };

   function applyAngle(face, angle) {

      var dist = face.oaInfo.t;
      var type = face.oaInfo.type;
      if (face.angle == angle) {
         return;
      }

      resetAngle(face);

      if (window.isAngleFrom0) {
         //from 0
         if (type == "VFACE") {
            face.translateOnAxis(new THREE.Vector3(0, 1, 0), dist);
            face.rotateOnAxis(new THREE.Vector3(1, 0, 0), (180 - angle) * Math.PI / 180);
            face.translateOnAxis(new THREE.Vector3(0, -1, 0), dist);
         } else {
            face.translateOnAxis(new THREE.Vector3(0, -1, 0), dist);
            face.rotateOnAxis(new THREE.Vector3(-1, 0, 0), angle * Math.PI / 180);
            face.translateOnAxis(new THREE.Vector3(0, 1, 0), dist);
            face.rotateOnAxis(new THREE.Vector3(1, 0, 0), angle * Math.PI / 180);
         }
      } else {
         //from 180
         if (type == "VFACE") {
            face.translateOnAxis(new THREE.Vector3(0, 1, 0), dist);
            face.rotateOnAxis(new THREE.Vector3(1, 0, 0), (180 - angle) * Math.PI / 180);
            face.translateOnAxis(new THREE.Vector3(0, -1, 0), dist);
            //face.rotateOnAxis(new THREE.Vector3( -1, 0, 0), angle * Math.PI / 180 );
            //face.translateOnAxis(new THREE.Vector3( 0, -1, 0),  dist );
            //face.translateOnAxis(new THREE.Vector3( 0, 1, 0),  dist );
         } else {
            face.translateOnAxis(new THREE.Vector3(0, 1, 0), dist);
            face.rotateOnAxis(new THREE.Vector3(1, 0, 0), (180 - angle) * Math.PI / 180);
            face.translateOnAxis(new THREE.Vector3(0, -1, 0), dist);
            face.rotateOnAxis(new THREE.Vector3(-1, 0, 0), (180 - angle) * Math.PI / 180);

         }
      }
      face.angle = angle;
      // face.updateMatrix();
      // face.updateMatrix();
   }

   function resetAngle(face) {
      if (face.angle === undefined) {
         return;
      }
      var dist = face.oaInfo.t;
      var angle = face.angle;
      var type = face.oaInfo.type;

      if (window.isAngleFrom0) {
         // alert(3)
         //from 0 
         if (type == "VFACE") {
            face.translateOnAxis(new THREE.Vector3(0, 1, 0), dist);
            face.rotateOnAxis(new THREE.Vector3(-1, 0, 0), (180 - angle) * Math.PI / 180);
            face.translateOnAxis(new THREE.Vector3(0, -1, 0), dist);
         } else {

            face.translateOnAxis(new THREE.Vector3(0, 1, 0), dist);
            face.rotateOnAxis(new THREE.Vector3(-1, 0, 0), angle * Math.PI / 180);
            face.translateOnAxis(new THREE.Vector3(0, -1, 0), dist);
            face.rotateOnAxis(new THREE.Vector3(1, 0, 0), angle * Math.PI / 180);


            // face.rotateOnAxis(new THREE.Vector3( 1, 0, 0), angle * Math.PI / 180 );
            // face.translateOnAxis(new THREE.Vector3( 0, 1, 0),  dist );
            // face.rotateOnAxis(new THREE.Vector3( -1, 0, 0), angle * Math.PI / 180 );
            // face.translateOnAxis(new THREE.Vector3( 0, -1, 0),  dist );
         }
      } else {
         if (type == "VFACE") {
            // face.translateOnAxis(new THREE.Vector3( 0, 1, 0),  dist );
            // face.rotateOnAxis(new THREE.Vector3( -1, 0, 0), (180-angle) * Math.PI / 180 );
            // face.translateOnAxis(new THREE.Vector3( 0, -1, 0),  dist );

            // face.translateOnAxis(new THREE.Vector3( 0, -1, 0),  dist );
            //   face.rotateOnAxis(new THREE.Vector3( -1, 0, 0), (180-angle) * Math.PI / 180 );
            //   face.translateOnAxis(new THREE.Vector3( 0, 1, 0),  dist );


            face.translateOnAxis(new THREE.Vector3(0, 1, 0), dist);
            face.rotateOnAxis(new THREE.Vector3(-1, 0, 0), (180 - angle) * Math.PI / 180);
            face.translateOnAxis(new THREE.Vector3(0, -1, 0), dist);


            // face.translateOnAxis(new THREE.Vector3( 0, -1, 0),  dist );
            //     face.rotateOnAxis(new THREE.Vector3( -1, 0, 0), (180-angle) * Math.PI / 180 );
            //  face.translateOnAxis(new THREE.Vector3( 0, 1, 0),  dist );


         } else {
            face.translateOnAxis(new THREE.Vector3(0, -1, 0), dist);
            face.rotateOnAxis(new THREE.Vector3(1, 0, 0), (180 - angle) * Math.PI / 180);
            face.translateOnAxis(new THREE.Vector3(0, 1, 0), dist);
            face.rotateOnAxis(new THREE.Vector3(-1, 0, 0), (180 - angle) * Math.PI / 180);
         }
      }

   }


   this.getFaceMesh = function() {
      return faceMesh;
   };

   return init();
};


OA.Face.prototype = Object.create(THREE.Object3D.prototype);