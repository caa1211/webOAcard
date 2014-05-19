OA.Contour = function(userSetting) {
   THREE.Object3D.call(this);
   //private
   var _def = {
      point: {
         color: 0x498698
      },
      line: {
         color: 0x6ECAE6
      }
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
   var init = function() {
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
      var radius = 0.5;
      var segments = 32;
      var p;
      var material;
      var circleGeometry;
      var circle;

      for (var i = 0; i < pLen; ++i) {
         p = position3Ds[i];
         material = new THREE.MeshBasicMaterial({
            color: _setting.point.color
         });
         circleGeometry = new THREE.CircleGeometry(radius, segments);
         material = new THREE.MeshBasicMaterial({
            color: _setting.point.color
         });
         circle = new THREE.Mesh(circleGeometry, material);
         circle.position.x = p.x;
         circle.position.y = p.y;
         circle.position.z = p.z;
         pointGroup.add(circle);
      }
      pointGroup.position.z = 0.2;
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
         linewidth: 3,
         color: 0xE69E6E,
         dashSize: 1,
         gapSize: 0.5

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
         linewidth: 3,
         color: _setting.line.color
      }), THREE.LinePieces);


      addCloseLine(openLines);
      lineGroup.add(openLines);
   };

   function updateContour(position3D) {
      drawLines();
      drawPoints();
   };

   function closeContour(){
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
      if(position3Ds.length>3 && OA.Utils.checkEqualPosition(position3Ds[0], position3D) ){
         isClosed = true;
         closeContour();
      }
      position3Ds.push(position3D);
      updateContour(position3D);
   };

   this.checkClosed = function(){
      return isClosed;
   };

   this.closeCoutour = function() {

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
         linewidth: 3,
         color: 0xff0000,
         opacity: 0.5,
         transparent: true,
         dashSize: 1,
         gapSize: 0.5,
      }));


      var radius = 0.5;
      var segments = 32;
      var material = new THREE.MeshBasicMaterial({
         color: 0xff0000,
         opacity: 0.5,
         transparent: true
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