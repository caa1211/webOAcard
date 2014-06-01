OA.ExContour = function(userSetting) {
   THREE.Object3D.call(this);
   //private
   var _def = {
      initData: [{
         "outer": [],
         "holes": [
            /*[ ]*/
         ]
      }],
      point: {
         color: 0x5F8A37
      },
      line: {
         color: 0xFA8000,
         lineWidth: 3.5,
         opacity: 0.8
      },
      gridStep: 1,
      t: 0
   };
   this.subLevel = 1;
   var modifyFloatPoint = OA.Utils.modifyFloatPoint;
   var _setting = $.extend({}, _def, userSetting);
   var exContour = this;
   exContour.t = _setting.t;
   var expolys = _setting.initData;
   var cid = expolys && expolys.cid;
   var beforeSubdiv_expolys = null;
   var gridStep = _setting.gridStep;
   var init = function(){
      var paths =  ClipperLib.JS.ExPolygonsToPaths(expolys);
      var bounds = ClipperLib.JS.BoundsOfPaths(paths, 1);
      var h = Math.abs(bounds.bottom - bounds.top);
      var w = Math.abs(bounds.left - bounds.right);
      expolys = movePoint2Ds(expolys, {X:w/2, Y:exContour.t - h/2}, exContour.t);
      draw3DExpolys();
      return exContour;
   };

   var addBolderInShape = function(shape) {
      var borderGeo = shape.createPointsGeometry();
      var borderWidth = _setting.line.lineWidth;
      var borderColor = _setting.line.color;
      var z = exContour.t;
      var borderMat = new THREE.LineBasicMaterial({
         linewidth: borderWidth,
         color: borderColor,
         transparent: true,
         linecap: "round"
      });

      var border = new THREE.Line(borderGeo, borderMat);

      border.position.z = z;
      exContour.add(border);
   };

   function draw3DExpolys(){
      OA.Utils.cleanObject3D(exContour);
      if (!expolys || (expolys && expolys.length) === 0) {
         return;
      }
      var t =exContour.t
      $.each(expolys, function(i, expoly){
         var outer = expoly.outer;
         var holes = expoly.holes;
         var p3dAry = [];
         var outer_shape;

         $.each(outer, function(j, point){
            var p3d = OA.Utils.D2To3(point, t, "VFACE");
            p3dAry.push(p3d);
         });
         outer_shape = new THREE.Shape(p3dAry);
         addBolderInShape(outer_shape);

         $.each(holes, function(k, hole){
            var holeP3dAry = [];
            var hole_shape;
            $.each(hole, function(l, point){
               var p3d = OA.Utils.D2To3(point, t, "VFACE");
               holeP3dAry.push(p3d);
            });
            hole_shape = new THREE.Shape(holeP3dAry); 
            addBolderInShape(hole_shape);
         });

      });
   }

   this.moveTo = function(newPos, t){
         var newPos2D;
         if(newPos){
            newPos2D = OA.Utils.D3To2(newPos, t);
         }
         var newExpolys = movePoint2Ds(expolys, newPos2D, t);
         expolys = newExpolys;
      
      draw3DExpolys();
   };


   function getMiddlePointFromPath(polys) {

      var paths =  ClipperLib.JS.ExPolygonsToPaths(polys);
      var bounds = ClipperLib.JS.BoundsOfPaths(paths, 1);
      var mpx = (bounds.left + bounds.right) / 2;
      var mpy = (bounds.top + bounds.bottom) / 2;
      return {
         X: mpx,
         Y: mpy
      };
   }

   this.moveTest = function(){

     var newExpolys =  movePoint2Ds(expolys, {X:0, Y:0}, 20);
      expolys = newExpolys;
      draw3DExpolys();
   };

   function movePoint2Ds(polys, newPos, t){
      var newPolys = [ /*{"outer": [],"holes": []}*/ ];
      var mf = modifyFloatPoint;
      var difft = 0;
      if (t != undefined && t != exContour.t) {
         difft = exContour.t - t;
         exContour.t = t;
      }
      var middlePoint = {
         X: 0,
         Y: 0
      };
      var target = {
         X: 0,
         Y: 0
      };
      if (newPos != undefined) {
         middlePoint = getMiddlePointFromPath(polys);
         middlePoint.X = Math.floor(middlePoint.X / gridStep) * gridStep;
         middlePoint.Y = Math.floor(middlePoint.Y / gridStep) * gridStep;
         target = {};
         target.X = Math.floor(newPos.X / gridStep) * gridStep;
         target.Y = Math.floor(newPos.Y / gridStep) * gridStep - difft;
      } else if (difft != 0) {
         target.Y = target.Y - difft;
      }

      newPolys = eachPointOperation(polys, function(point){
            return {
               X: point.X - middlePoint.X + target.X,
               Y: point.Y - middlePoint.Y + target.Y
            };
      });

      return newPolys;
   }

   this.setGridStep = function(value){
      _setting.gridStep = value;
      gridStep = value
   };

   this.getPoint2Ds = function(){
      expolys.type = "expolygons";
      expolys.cid = cid;
      return expolys;
   };


   function eachPathOperation(polys, opFn) {
      var newPolys = [];
      $.each(polys, function(i, expoly) {
         var outer = expoly.outer;
         var newOuter = opFn(outer);
         var holes = expoly.holes;
         var p2dAry = [];
         var outer_shape;
         var tmpPoly = {
            "outer": newOuter,
            "holes": []
         };
         $.each(holes, function(k, hole) {
            var newHole = opFn(hole);
            OA.Utils.modifyPathOrientation(newHole, false);
            tmpPoly.holes.push(newHole);
         });
         newPolys.push(tmpPoly);
      });
      return newPolys;
   }

   function eachPointOperation(polys, opFn) {
      var newPolys = [];
      $.each(polys, function(i, expoly) {
         var outer = expoly.outer;
         var holes = expoly.holes;
         var p2dAry = [];
         var outer_shape;
         var tmpPoly = {
            "outer": [],
            "holes": []
         };
         $.each(outer, function(j, point) {
            var p2d = opFn(point);
            tmpPoly.outer.push(p2d);
         });
         $.each(holes, function(k, hole) {
            var holeAry = [];
            $.each(hole, function(l, point) {
               var p2d = opFn(point);
               holeAry.push(p2d);
            });
            OA.Utils.modifyPathOrientation(holeAry, false);
            tmpPoly.holes.push(holeAry);
         });
         newPolys.push(tmpPoly);
      });
      return newPolys;
   }

   this.rotateX = function() {
      var newPolys = [];
      var polys = expolys;
      var mp = getMiddlePointFromPath(polys);
      newPolys = eachPointOperation(polys, function(point){
          return {
                  X: point.X * -1,
                  Y: point.Y
                 };
      });
      expolys = movePoint2Ds(newPolys, mp);
      draw3DExpolys();
   };

   this.checkClosed = function(){
      return true;
   };

   this.getPosition3Ds = function(){
      return {};
   };


     //public
   this.subdiv = function(level, xLimit) {

      exContour.subLevel = level;
      if (beforeSubdiv_expolys == null) {
         beforeSubdiv_expolys = expolys;
      }else{
         expolys = beforeSubdiv_expolys;
      }

      if (level > 1) {
         var newExpolys = expolys;
         for (i = 0; i < level; i++) {
            newExpolys = subdivision(newExpolys, xLimit);
         }
         expolys = newExpolys;
      }
      draw3DExpolys();
   };

   var subdivision = function(polys, xLimit) {
      var newPolys = eachPathOperation(polys, function(path){
         var newPath = OA.Utils.subdivision(path, xLimit);
            return newPath;
      });
      return newPolys;
   };
   return init();
};

OA.ExContour.prototype = Object.create(THREE.Object3D.prototype);