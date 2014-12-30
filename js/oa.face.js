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
      faceCreateMode: 0,
      isBoundaryClipped: false,
      baseContour: null,
      upper2Ds: null,
      lower2Ds: null,
      type: "HFACE", //HFACE or VFACE,
      opacity: 1,
      gridData: {},
      borderColor: 0x888888,
      borderWidth: 2.2,
      initAngle: 90,
      addingLine: null,
      depthTest: true,
      depthWrite: true,
      name: null,
      oaMode: 0 //0: pattern3D, 1: pattern2D
   };
   var gridColor = [0x1F6CBD, 0xFF5755, 0x417D42];
   var gridBorderColor = [0x5399E3, 0xFF5755, 0x5DA31B];

   var face = this;
   var isAngleFrom0 = false;
   var contour = [];
   var rot = [Math.PI / 2, 0, 0];
   var _setting = $.extend({}, _def, userSetting);
   var faceCreateModeType = {"faces":0, "hole":1, "pull": 2};
   face.faceCreateMode = _setting.faceCreateMode;
   var baseContour = _setting.baseContour;
   var typeOpts = {
      "HFACE": {
         //color: 0xE9DABC
         color: 0xEADED2
      },
      "VFACE": {
         color: 0xEADED2
      }
   };

   var highlightOpts = {
      body: {
         "HFACE": {
            color: 0xFEFF91
         },
         "VFACE": {
            color: 0xFEFF91
         }
      },
      border:{
         linewidth: 3
      }
   };
   face.oaInfo = _setting;
   if(_setting.name){
      face.name = _setting.name;
   }
   var type = _setting.type;

   var addBolderInShape = function(shape, borderGroup) {
      var borderGeo = shape.createPointsGeometry();
      var borderWidth = _setting.borderWidth;
      var borderColor = _setting.borderColor;

      var borderMat = new THREE.LineBasicMaterial({
         linewidth: borderWidth,
         color: borderColor,
         transparent: true,
         linecap: "round"
      });

      if (_setting.oaMode === 1) {
         borderMat = new THREE.LineBasicMaterial({
            linewidth: 1,
            color: 0x000000
         });
      }

      var border = new THREE.Line(borderGeo, borderMat);
      border.position.z = -0.1;
      border.name="faceBorder";
      borderGroup.add(border);
   };

   var buildByCoutours = function(contours) {
      OA.Utils.cleanObject3D(face);
      if(!contours || (contours && contours.length) === 0){
         return;
      }
      var exPolygons = contours;
      var alen = exPolygons.length;
      var shapes = [];
      var outer_shape;
      var borderGroup = new THREE.Object3D();
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
                     addBolderInShape(hole_shape, borderGroup);
                  }
               }
               outer_shape.holes = hole_shapes;
            }
         }
         if (outer_shape) {
            addBolderInShape(outer_shape, borderGroup);
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
         ambient: 0x555555,
         color: typeOpts[type].color,
         side: THREE.DoubleSide,
         opacity: _setting.opacity,
         visible: _setting.opacity === 0 ? false : true,
         side: THREE.DoubleSide,
         specular: 0x444444,
         shininess: 0.1,
         shading: THREE.SmoothShading,
         // map: paperTexture,
         bumpMap: paperTexture
      });
      lightMaterial.bumpScale = -0.3;

      var planeMat = lightMaterial;


      if (_setting.oaMode === 1) {
         planeMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            linewidth: 0.5
         });
      }

      var plane = new THREE.Mesh(planeGeom, planeMat);
      if (OA.light) {
         plane.receiveShadow = true;
         plane.castShadow = true;
      }
      plane.name = "faceBody";
      face.add(plane);

      borderGroup.name = "faceBorders";
      face.add(borderGroup);


      if(_setting.oaMode === 0){
         //update upper and lower for finding fold line when draw preview
         face.updateUpperLower2Ds(_setting.contours, true);
      }

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
      addingLines.name = "addingLines";
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
      var line = new THREE.Line(geometry, material, THREE.LinePieces);
      line.name = "faceGrid";
      face.add(line);
   }

   this.drawGrid = function(gridData) {
      var grid = face.getObjectByName("faceGrid");
      face.remove(grid);
      createFaceGrid(face, gridData);
   };
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

   function collectTopUpperLower(upperStore, lowerStore, pAry, index) {
      if(!pAry || pAry && pAry.length ===0){
         return {
            uppers: upperStore,
            lowers: lowerStore
         };
      }
      OA.Utils.modifyPathOrientation(pAry, true);

      var topY = 9999;
      var bottomY = 0;
      uppers = [];
      lowers = [];
      var len = pAry.length;
      for (var i = 0; i < len; ++i) {
         if (i != len - 1) {
            p1 = pAry[i];
            p2 = pAry[i + 1];
         } else {
            p1 = pAry[i];
            p2 = pAry[0];
         }
         var upperOrLower = [p1, p2];
         upperOrLower.inHole = false;
         upperOrLower.inOuter = true;
         upperOrLower.polyIndex = index;
         if (p1.Y === p2.Y && p1.X > p2.X ) {
            uppers.push(upperOrLower);
            if (p1.Y < topY) {
               topY = p1.Y;
            }
         }
         if (p1.Y === p2.Y && p1.X < p2.X) {
            lowers.push(upperOrLower);
            if (p1.Y > bottomY) {
               bottomY = p1.Y;
            }
         }
      }

      uppers = $.grep(uppers, function(upper) {
         return upper[0].Y === topY;
      });

      lowers = $.grep(lowers, function(lower) {
         return lower[0].Y === bottomY;
      });
      $.merge(upperStore, uppers);
      $.merge(lowerStore, lowers);
   }

   function collectUpperLower(upperStore, lowerStore, pAry, isOuter, index) {
      var len = pAry.length;
      var uppers = [];
      var lowers = [];
      var inHole = false;
      var inOuter = false;
      if(!pAry || pAry && pAry.length ===0){
         return {
            uppers: upperStore,
            lowers: lowerStore
         };
      }
      if (upperStore) {
         uppers = upperStore;
      }

      if (lowerStore) {
         lowers = lowerStore;
      }

      if (isOuter) {
         inOuter = true;
         OA.Utils.modifyPathOrientation(pAry, true)
      } else {
         //is hole
         inHole = true;
         OA.Utils.modifyPathOrientation(pAry, false)
      }
      for (var i = 0; i < len; ++i) {
         if (i != len - 1) {
            p1 = pAry[i];
            p2 = pAry[i + 1];
         } else {
            p1 = pAry[i];
            p2 = pAry[0];
         }
         var upperOrLower = [p1, p2];
         upperOrLower.inHole = inHole;
         upperOrLower.inOuter = inOuter;
         upperOrLower.polyIndex = index;
         if (p1.Y === p2.Y && p1.X > p2.X) {
            uppers.push(upperOrLower);
         }

         if (p1.Y === p2.Y && p1.X < p2.X) {
            lowers.push(upperOrLower);
         }
      }
      return {
         uppers: uppers,
         lowers: lowers
      };
   }

   this.updateUpperLower2Ds = function(contours, isforce) {
      //OA.Utils.modifyPathOrientation(contours, false);
      if(!_setting.upper2Ds && !isforce){
         //do not have upper
         return;
      }
      var upper2Dary = [];
      var lower2Dary = [];
      if (contours &&  contours.type !== "expolygons") {
         // debugger;
         $.each(contours, function(i, poly) {
            var outer = poly.outer;
            var holes = poly.holes;
            OA.Utils.modifyPathOrientation(outer, true);
            var len = outer.length;
            collectUpperLower(upper2Dary, lower2Dary, outer, true, i);
            var hlen = holes
            if (holes.length > 0) {
               $.each(holes, function(j, holePoly) {
                  collectUpperLower(upper2Dary, lower2Dary, holePoly, false, i);
               });
            }
         });
      }else{
         //expolygons only collectop top upper
         $.each(contours, function(i, poly) {
            var outer = poly.outer;
            collectTopUpperLower(upper2Dary, lower2Dary, outer, i);
         });
      }
      _setting.upper2Ds = upper2Dary;
      _setting.lower2Ds = lower2Dary;
   };

   this.rebuild = function(contours, updateUpper){
      try {
         face.updateUpperLower2Ds(contours);
         var type = _setting.contours.type;
         _setting.contours = contours;
         _setting.contours.type = type;
         buildByCoutours(_setting.contours);
      } catch (e) {
         OA.log("rebuild contour failed " +JSON.stringify(contours), 0);
      }
   };

   this.highlight = function(isOn){
      var opts = highlightOpts;
      var borders = face.getObjectByName("faceBorders");
      var body = face.getObjectByName("faceBody");
      if (borders && borders.children) {
         if (isOn) {
            $.each(borders.children, function(i, border) {
               //border.material.color.setHex(opts.border.color);
               border.material.linewidth = opts.border.linewidth;
            });
            body.material.color.setHex(opts.body[type].color);
         } else {
            $.each(borders.children, function(i, border) {
               //border.material.color.setHex(_setting.borderColor);
               border.material.linewidth = _setting.borderWidth;
            });
            body.material.color.setHex(typeOpts[type].color);
         }
      }
   };

   this.getUpper2Ds = function(){
      return _setting.upper2Ds;
   };

   this.getLower2Ds = function(){
      return _setting.lower2Ds;
   };


   this.getFaceMesh = function() {
      return face.getObjectByName("faceBody");
   };

   this.setGridColorByIndex = function(index) {
      var faceGrid = face.getObjectByName("faceGrid");
      var borders = face.getObjectByName("faceBorders");
      var addingLines = face.getObjectByName("addingLines");
      var color = gridColor[index];
      var borderColor = gridBorderColor[index];

      if (color && borders && borders.children && addingLines && borderColor) {
         faceGrid.material.color.setHex(color);
         addingLines.material.color.setHex(borderColor);
         $.each(borders.children, function(i, border) {
            //border.material.color.setHex(_setting.borderColor);
            border.material.color.setHex(borderColor);
         });

      }
   }
   return init();
};


OA.Face.prototype = Object.create(THREE.Object3D.prototype);