OA.Face = function(userSetting) {
   THREE.Object3D.call(this);
   //private
   var _def = {
      contours: [{
         "outer": [],
         "holes": [
            /*[ ]*/
         ]
      }],
      t: 0,
      isBoundaryClipped: false,
      baseContour: null,
      upper2Ds: null,
      type: "HFACE", //HFACE or VFACE,
      opacity: 1,
      gridData: {},
      borderColor: 0x333333,
      borderWidth: 2.5,
      initAngle: 90,
      addingLine: null,
      depthTest: true,
      depthWrite: true,
      name: null,
   };
   var face = this;
   var isAngleFrom0 = false;
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
   if(_setting.name){
      face.name = _setting.name;
   }
   var type = _setting.type;

   var createLine = function(geometry) {
      return new THREE.Line(geometry, new THREE.LineBasicMaterial({
         linewidth: _setting.borderWidth,
         color: _setting.borderColor
      }));
   };


   var buildByCoutours = function(contours) {
      OA.Utils.cleanObject3D(face);
      var exPolygons = contours;
      var border, borderGeo, p, a, i, j, jlen, ilen, exPolygon, holes, outer, polygon, outer_shape, hole_shape;
      var alen = exPolygons.length;
      var shapes = new Array(alen);
      var holeShapes = [];
      var outerPoints = [];
      var borderWidth = _setting.borderWidth;
      var borderColor = _setting.borderColor;
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
               outerPoints.push(point);
            }
            outer_shape = new THREE.Shape(outerPoints);
            ilen = holes && holes.length;
            if (ilen && ilen > 0) {

               for (i = 0; i < ilen; i++) {
                  polygon = holes[i];
                  borderGeo = new THREE.Geometry();
                  for (j = 0, jlen = polygon.length; j < jlen; j++) {
                     point = polygon[j];
                     point = new THREE.Vector2(point.X, point.Y); // convert Clipper point to THREE.Vector2
                     polygon[j] = point;
                  }
                  if (jlen > 0) {
                     //hole border
                     hole_shape = new THREE.Shape(polygon);
                     holeShapes.push(hole_shape);
                     borderGeo = hole_shape.createPointsGeometry();
                     border = new THREE.Line(borderGeo, new THREE.LineBasicMaterial({
                        linewidth: borderWidth,
                        color: borderColor,
                        transparent: true
                     }));
                     border.position.z =-0.1; 
                     border.name = "holeBolder";
                     face.add(border);
                  }
               }
               if (polygon.length > 0) {
                  outer_shape.holes = holeShapes;
               }
            }
            shapes[a] = outer_shape;
            //bouter border
            borderGeo = outer_shape.createPointsGeometry();
            border = new THREE.Line(borderGeo, new THREE.LineBasicMaterial({
               linewidth: borderWidth,
               color: borderColor,
               transparent: true,
               depthTest: _setting.depthTest,
               depthWrite: _setting.depthWrite
            }));
            border.position.z =-0.1; 
            border.name = "outerBolder";
            face.add(border);
         }
      }
      var planeGeom = new THREE.ShapeGeometry(shapes);
      var plane = new THREE.Mesh(planeGeom, new THREE.MeshBasicMaterial({
         color: typeOpts[type].color,
         side: THREE.DoubleSide,
         opacity: _setting.opacity,
         visible: _setting.opacity === 0 ? false : true
      }));
      plane.name = "faceBody";
      face.add(plane);

   };

   function createAddingLine(face){
      var lAry = _setting.addingLine;
      var geometry = new THREE.Geometry();
      for(var i=0; i<lAry.length; i++ ){
         geometry.vertices.push(new THREE.Vector3(lAry[i][0], -0.1, lAry[i][1]-0.1));
      }
     
      var addingLines = new THREE.Line(geometry, new THREE.LineDashedMaterial({
         linewidth: 4,
         color: 0x336699
      }));

      face.add(addingLines);
   }

   function createFaceGrid(face, gridData) {;
      var geometry = new THREE.Geometry();
      var extendY = gridData.extendY ?  gridData.extendY : 0;
      for (var i = -extendY; i <= gridData.h; i += gridData.s) {
         geometry.vertices.push(new THREE.Vector3(0, -i, -0.1));
         geometry.vertices.push(new THREE.Vector3(gridData.w, -i, -0.1));
      }
      for (var i = 0; i <= gridData.w; i += gridData.s) {
         geometry.vertices.push(new THREE.Vector3(i, extendY, -0.1));
         geometry.vertices.push(new THREE.Vector3(i, -gridData.h, -0.1));
      }
      var material = new THREE.LineBasicMaterial({
         color: gridData.color || 0x9699A4,
         linewidth: gridData.linewidth || 1,
         opacity: gridData.opacity || 0.3,
         transparent: true,
         depthTest: _setting.depthTest,
         depthWrite: _setting.depthWrite
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
      buildByCoutours(_setting.contours);

      if (_setting.gridData) {
         createFaceGrid(face, _setting.gridData);
      }
     if (_setting.addingLine) {
         createAddingLine(face);
      }
      // face.updateMatrix();
      // face.updateMatrixWorld();
      applyAngle(face, _setting.initAngle);
      return face;
   };

   this.getExPolygons = function(){
      return _setting.contours;
   };

   this.setExPolygons = function(exPolygons){
       _setting.contours = exPolygons;
   };


   this.setAngle = function(angle) {
      applyAngle(this, angle);
   };
   
   this.getT = function(){
      return face.oaInfo.t;
   };

   this.setT = function(t){
      face.oaInfo.t = t;
   };


   function applyAngle(face, angle) {

      var dist = face.oaInfo.t;
      var type = face.oaInfo.type;
      if (face.angle == angle) {
         return;
      }

      resetAngle(face);
      if(angle ===0){
         angle =0.5
      }
      if (isAngleFrom0) {
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

      if(angle ===0){
         angle =0.5
      }

      if (isAngleFrom0) {
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
         }
      } else {
         if (type == "VFACE") {
            face.translateOnAxis(new THREE.Vector3(0, 1, 0), dist);
            face.rotateOnAxis(new THREE.Vector3(-1, 0, 0), (180 - angle) * Math.PI / 180);
            face.translateOnAxis(new THREE.Vector3(0, -1, 0), dist);
         } else {
            face.translateOnAxis(new THREE.Vector3(0, -1, 0), dist);
            face.rotateOnAxis(new THREE.Vector3(1, 0, 0), (180 - angle) * Math.PI / 180);
            face.translateOnAxis(new THREE.Vector3(0, 1, 0), dist);
            face.rotateOnAxis(new THREE.Vector3(-1, 0, 0), (180 - angle) * Math.PI / 180);
         }
      }

   }

   this.clone = function(){
      return new OA.Face(_setting);
   }

   this.rebuild = function(contours){
      if(contours){
         _setting.contours = contours;
      }
      buildByCoutours(_setting.contours);
   };

   this.getUpper2Ds = function(){
      return _setting.upper2Ds;
   };

   this.getFaceMesh = function() {
      return faceMesh;
   };

   return init();
};


OA.Face.prototype = Object.create(THREE.Object3D.prototype);