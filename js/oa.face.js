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
      borderWidth: 2.0,
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


   var addBolderInShape = function(shape, face) {
      var borderGeo = shape.createPointsGeometry();
      var borderWidth = _setting.borderWidth;
      var borderColor = _setting.borderColor;
      var border = new THREE.Line(borderGeo, new THREE.LineBasicMaterial({
         linewidth: borderWidth,
         color: borderColor,
         transparent: true,
         linecap: "round"
      }));
      border.position.z = -0.1;

      face.add(border);
   };

   var buildByCoutours = function(contours) {
      OA.Utils.cleanObject3D(face);
      var exPolygons = contours;
      var alen = exPolygons.length;
      var shapes = [];
      var outer_shape;

      var a, j, i, k;

      for (a = 0; a < alen; a++) {
         var exPolygon = exPolygons[a];
         var outer = exPolygon.outer;
         var holes = exPolygon.holes;
         var jlen = outer.length;
         var p2dAry = [];
         if (jlen && jlen > 0) {
            for (j = 0; j < jlen; j++) {
               var point = outer[j];
               var p2d = new THREE.Vector2(point.X, point.Y);
               p2dAry.push(p2d);
            }

            //check orientation before create shape
            //OA.Utils.modifyPathOrientation(p2dAry)

            outer_shape = new THREE.Shape(p2dAry);
            var hlen = holes && holes.length;
            var hole_shapes = [];
            if (hlen && hlen > 0) {

               for (i = 0; i < hlen; i++) {
                  polygon = holes[i];
                  var holeP2dAry = [];

                  for (k = 0; k < polygon.length; k++) {
                     var point = polygon[k];
                     var p2d = new THREE.Vector2(point.X, point.Y); // convert Clipper point to THREE.Vector2
                     holeP2dAry.push(p2d);
                  }
                  if (polygon.length > 0) {
                     //check orientation before create shape
                     //OA.Utils.modifyPathOrientation(holeP2dAry)

                     hole_shape = new THREE.Shape(holeP2dAry);
                     hole_shapes.push(hole_shape);
                     addBolderInShape(hole_shape, face);
                  }
               }
               outer_shape.holes = hole_shapes;
            }
         }
         if (outer_shape) {
            addBolderInShape(outer_shape, face);
            shapes.push(outer_shape);
         }
      }

      var planeGeom = new THREE.ShapeGeometry(shapes);



      var paperTexture = null;
      if (OA.paperTexture) {
         var textures = OA.Utils.texture.getTexture();
         var paperTexture = textures.paper;
        // paperTexture.repeat.set(0.05, 0.05);
      }


      var baseMaterial = new THREE.MeshBasicMaterial({
         map: paperTexture,
         color: typeOpts[type].color,
         side: THREE.DoubleSide,
         opacity: _setting.opacity,
         visible: _setting.opacity === 0 ? false : true
      });

      var lightMaterial = new THREE.MeshPhongMaterial({
         map: paperTexture,
         ambient: 0x555555,
         color: typeOpts[type].color,
         side: THREE.DoubleSide,
         opacity: _setting.opacity,
         visible: _setting.opacity === 0 ? false : true,
         side: THREE.DoubleSide,
         specular: 0x555555,
         shininess: 50,
         shading: THREE.SmoothShading
      });

      var planeMat = OA.light ? lightMaterial : baseMaterial;
 
      var plane = new THREE.Mesh(planeGeom, planeMat);
      if (OA.light) {
         plane.receiveShadow = true;
      }
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