OA.Contour = function(userSetting) {
   THREE.Object3D.call(this);
   //private
   var _def = {
      point: {
         color: 0x498698
      },
      line: {
         color: 0x6ECAE6,
         lineWidth: 3
         //color: 0xE7AB6D
      },
      startPointSize: 1
   };
   var contour = this;
   var isClosed = false;
   var position3Ds = [];
   var lineGroup = null;
   var closeLine = null;
   var openLines = null;
   var pointGroup = null;
   var _setting = $.extend({}, _def, userSetting);
   var hoverLine = null;
   var circleGroup = null;
   var baseT = null;

   var init = function() {
      contour.t = _setting.t;
      contour.baseT = _setting.t;
      if (!lineGroup) {
         lineGroup = new THREE.Object3D();
         contour.add(lineGroup);
         lineGroup.position.z = 0.1;
      }
      return contour;
   };

   this.getPointSize = function() {
      return position3Ds.length;
   };

   this.getPosition3Ds = function() {
      return position3Ds;
   };


   function drawPoints() {
      if (pointGroup) {
         contour.remove(pointGroup);
      }
      pointGroup = new THREE.Object3D();
      var pLen = position3Ds.length;
      var radius = 0.6;
      var segments = 32;
      var p, r, c;
      var material;
      var circleGeometry;
      var circle;

      for (var i = 0; i < pLen; ++i) {
         p = position3Ds[i];
         if (i == 0) {
            circle = new OA.Point({scale: _setting.startPointSize, 
               inner:{ 
                  color: 0x498698,
                  opacity: 1,
                  size: 1}
            });
            circle.setColor(3);
         } else {
            if (i === 0) {
               r = radius * 1.3;
            } else {
               r = radius;
            }
            circleGeometry = new THREE.CircleGeometry(r, segments);
            material = new THREE.MeshBasicMaterial({
               color: _setting.point.color,
               transparent: true,
         transparent: true,
         depthTest: false,
         depthWrite: false
            });
            circle = new THREE.Mesh(circleGeometry, material);

         }
            circle.position.x = p.x;
            circle.position.y = p.y;
            circle.position.z = p.z;
            pointGroup.add(circle);

      }
      pointGroup.position.z = 0.3;
      contour.add(pointGroup);
   }

   function addCloseLine(parent) {
      var len = position3Ds.length;
      var p1 = position3Ds[0],
         p2 = position3Ds[len - 1];
      var geometry = new THREE.Geometry();
      geometry.vertices.push(p1, p2);
      geometry.computeLineDistances();
      var closeLine = new THREE.Line(geometry, new THREE.LineDashedMaterial({
         linewidth: _setting.line.lineWidth,
         color: 0x498698,
         opacity: 0.5,
         dashSize: 1,
         gapSize: 0.5,
         transparent: true,
         depthTest: false,
         depthWrite: false

      }));
      parent.add(closeLine);
   }

   function drawLines() {
      if (openLines) {
         lineGroup.remove(openLines);
      }
      if (position3Ds.length < 2) {
         return;
      }

      var geometry = new THREE.Geometry();
      var len = position3Ds.length;
      for (var i = 1; i < len; ++i) {
         var p1 = position3Ds[i],
            p2 = position3Ds[i - 1];
         geometry.vertices.push(p1, p2);
      }
      openLines = new THREE.Line(geometry, new THREE.LineBasicMaterial({
         linewidth: _setting.line.lineWidth,
         color: _setting.line.color,
         transparent: true,
         depthTest: false,
         depthWrite: false
      }), THREE.LinePieces);

      openLines.name = "openLines";
      addCloseLine(openLines);
      lineGroup.add(openLines);
   };

   function updateContour(position3D) {
      drawLines();
      drawPoints();
   };


   this.moveTo = function(newPos, t){
      if (newPos) {
         var geometry = openLines.geometry;
         geometry.computeBoundingBox();
         var bb = geometry.boundingBox;
         var middlePos = new THREE.Vector3();
         middlePos.x = (bb.min.x + bb.max.x) / 2;
         middlePos.y = (bb.min.y + bb.max.y) / 2;
        
         contour.position.x = lineGroup.position.x + newPos.x - middlePos.x;
         contour.position.y = lineGroup.position.y + newPos.y - middlePos.y;
         //contour.position.z = t - contour.baseT;
      }
      if(t){
         contour.position.z = t - contour.baseT;
         contour.t = t;
      }
   };

   // this.getPoint2D = function(){
   //    contour.updateMatrixWorld();
   //    var vector;
   //    var ary = [];
   //    var t = contour.t;
   //    for (var i = 0; i < pointGroup.children.length; i++) {
   //       vector = new THREE.Vector3();
   //       vector.setFromMatrixPosition(pointGroup.children[i].matrixWorld);
   //       ary.push([vector.x, t - vector.y]);
   //    }
   //    return ary;
   // };

   this.getPoint2DAry = function() {
      contour.updateMatrixWorld();
      var vector;
      var ary = [];
      var t = contour.t;
      for (var i = 0; i < pointGroup.children.length; i++) {
         vector = new THREE.Vector3();
         vector.setFromMatrixPosition(pointGroup.children[i].matrixWorld);
         ary.push({X: vector.x, Y: t - vector.y});
      }
      return ary;
   };


   function closeContour() {
      if (hoverLine) {
         lineGroup.remove(hoverLine);
      }
   }
   //public

   this.undo = function() {
      position3Ds.pop();
      updateContour();
      isClosed = false;
   };

   this.addPosition3D = function(position3D) {
      if(position3Ds.length>2 && OA.Utils.checkEqualPosition(position3Ds[0], position3D) ){
         isClosed = true;
         closeContour();
      }

      position3Ds.push(position3D);
      updateContour(position3D);
   };

   this.checkClosed = function(){
      return isClosed;
   };



   this.drawHoverLine = function(movePosition3D) {
      if (!lineGroup) {
         return;
      }

      if (hoverLine) {
         lineGroup.remove(hoverLine);
      }
      var len = position3Ds.length;
      if (len < 1) {
         return;
      }

      var p1 = movePosition3D,
         p2 = position3Ds[len - 1],
         geometry = new THREE.Geometry();
      geometry.vertices.push(p1, p2);
      geometry.computeLineDistances();
      hoverLine = new THREE.Line(geometry, new THREE.LineDashedMaterial({
         linewidth: _setting.line.lineWidth,
         color: 0xff0000,
         opacity: 0.5,
         transparent: true,
         dashSize: 1,
         gapSize: 0.5,
         transparent: true,
         depthTest: false,
         depthWrite: false
      }));


      var radius = 0.6;
      var segments = 32;
      var material = new THREE.MeshBasicMaterial({
         color: 0xD02C55,
         opacity: 1,
         transparent: true,
         depthTest: false,
         depthWrite: false
      });
      var circleGeometry = new THREE.CircleGeometry(radius, segments);
      var circle = new THREE.Mesh(circleGeometry, material);
      circle.position.x = p2.x;
      circle.position.y = p2.y;
      circle.position.z = p2.z;
      //  contour.add(circle);
      hoverLine.add(circle);
      hoverLine.position.z = 0.2;
      lineGroup.add(hoverLine);
   };

   return init();

};

OA.Contour.prototype = Object.create(THREE.Object3D.prototype);