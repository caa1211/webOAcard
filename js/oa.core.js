var OA = {
   REVISION: 'r01',
   debugMode: true,
   logLevel: 2, //0: error, 1: warning, 2: info
   tunePath: true,
   light: true, 
   pointLight: false,
   paperTexture: true,
   clipScale: 10000,
   paperTextureInfo:{

     src: "img/p3.jpg",
     size: 128,
     isFill: false

     // src: "img/paper0.jpg",
     // size: 128,
     // isFill: false

     // src: "img/picture1.jpg",
     // size: 500,
     // isFill: true,
     // offset:{
     //  x:0,
     //  y:0.5
     // }
   }
};

OA.Utils = {
  log: function(str, logLevel) {
    if (!logLevel) {
      logLevel = 2;
    }
    if (logLevel <= OA.logLevel) {
      console.error(str);
    }
  },
  createFace: function (point2Ds, faceType, t, opt) {
    var rt = 0;
    if (t) {
      rt = t;
    } else  {
      //console.error("need t to create face");
    }
    var _opt = {
      t: rt,
      contours: [{
        "outer": point2Ds,
        "holes": [
          [ /*points*/ ]
        ]
      }],
      type: faceType
    }
    $.extend(_opt, opt);
    return new OA.Face(_opt);
  },
  log10: function(val) {
    return Math.log(val) / Math.LN10;
  },
  modifyFloatPoint: function(num) {
    var clipScale = OA.clipScale;
    var size = OA.Utils.log10(clipScale);
    size = Math.floor(size+0.5); //!!! Javascript float error @@!
    return OA.Utils.formatFloat(num, size);
  },
  mf: function(num){
    return OA.Utils.modifyFloatPoint(num);
  },
  adjustFloat: function(obj) {
     var mf = OA.Utils.modifyFloatPoint;
     if(obj instanceof THREE.Vector3){
        var p = new THREE.Vector3(mf(obj.x), mf(obj.y), mf(obj.z));
        return p;
     }
  },
   modifyPathOrientation: function(p2dAry, isCW){
      if(isCW === undefined){
         isCW = true;
      }
      var orientation = ClipperLib.Clipper.Orientation(p2dAry);
      if (orientation === isCW) {
         p2dAry.reverse();
         //console.error("=reverse path=");
      }
   },
   exPolygonsClean: function(exPolygons, distance){
      // $.each(exPolygons, function(i, exPoly){
      //   exPoly.outer = ClipperLib.Clipper.CleanPolygon(exPoly.outer, distance);
      //   exPoly.holes = ClipperLib.Clipper.CleanPolygons(exPoly.holes, distance);
      // });

      $.each(exPolygons, function(i, exPoly){
        exPoly.outer = ClipperLib.JS.Clean(exPoly.outer, distance);
        //exPoly.outer = ClipperLib.Clipper.SimplifyPolygons(exPoly.outer, ClipperLib.PolyFillType.pftEvenOdd);
        exPoly.holes = ClipperLib.JS.Clean(exPoly.holes, distance);
        //exPoly.holes = ClipperLib.Clipper.SimplifyPolygons(exPoly.holes, ClipperLib.PolyFillType.pftEvenOdd);
      });

      //tunedPath2 = ClipperLib.Clipper.SimplifyPolygons(tunedPath, ClipperLib.PolyFillType.pftNonZero);
   },
   facesClone: function(faces) {
    var newFaces = [];
    $.each(faces, function(i, f) {
      newFaces.push(f.clone());
    });
    return newFaces;
   },
   D3To2: function(d3p, t){
      //return {X: d3p.x, Y: t - d3p.y};
      var mf = OA.Utils.mf;
      return {X: mf(d3p.x), Y: mf(t - d3p.y)};
   },
   D2To3: function(d2p, t, type){
      var d3p = null;
      if(type === undefined || type === "VFACE"){
        d3p = new THREE.Vector3(d2p.X, t - d2p.Y , t);
      }else if(type === "HFACE"){
        d3p = new THREE.Vector3(d2p.X, t , t + d2p.y);
      }
      if(d3p!=null){
        d3p = OA.Utils.adjustFloat(d3p);
      }
      return d3p;
   },
   simplePathToPoly: function(path){
      return [{ "outer": path, "holes": []}];
   },
   scaleDownExPolygon: function(exPolygons, scale) {
    var a, i, j, exPolygon, holes, outer, polygon;
    if (!scale) scale = 1;
    for (a = 0, alen = exPolygons.length; a < alen; a++) {
      exPolygon = exPolygons[a];
      holes = exPolygon.holes;
      outer = exPolygon.outer;
      for (i = 0, ilen = holes.length; i < ilen; i++) {
        polygon = holes[i];

        for (j = 0, jlen = polygon.length; j < jlen; j++) {
          point = polygon[j];
          point.X = Number(point.X) / scale;
          point.Y = Number(point.Y) / scale;
        }
      }
      for (j = 0, jlen = outer.length; j < jlen; j++) {
        point = outer[j];
        point.X = Number(point.X) / scale;
        point.Y = Number(point.Y) / scale;
      }
    }
    return exPolygons;
  },
  cleanObject3D: function(object3D) {
      var children = object3D.children;
      var len = children.length;
      for(var i=0; i<len;i++){
        object3D.remove(children[0]);
      }
   },
   ary2Point2Ds: function(ary){
      var point2Ds = ary.map(function(i) {
        return {
          "X": i[0],
          "Y": i[1]
        };
      });
      return point2Ds;
   },
   checkEqualPosition: function(pos1, pos2){
        if(pos1 === undefined||pos2===undefined){
            return false;
        }
        if(pos1.x === pos2.x && 
           pos1.y === pos2.y &&
           pos1.z === pos2.z){
            return true;
        }else{
            return false;
        }
    },
   setObject3DVisible: function(object3D, visible){
      if(object3D.isVisible === undefined || object3D.isVisible !== visible){
         object3D.traverse( function ( object ) { object.visible = !!visible; } );
         object3D.isVisible = visible;
       }
   },
   texture: {
     ready: false,
     data: {
      movePointTexture: null,
      movePointFillTexture: null,
     },
     adjustTextureSize: function(maxWidth, imageSize, isFill){
        if(isFill){
          var w = imageSize/100;
        }else{
          var w = 2000/imageSize; 
        }
        var repeateSize = w/(maxWidth*10);//for 128 * 128 image
        return repeateSize;
      },
     loadAllTexture: function(modelOption){
      OA.Utils.texture.ready = true;
      OA.Utils.texture.data.movePointTexture = THREE.ImageUtils.loadTexture("img/cborder.png");
      OA.Utils.texture.data.movePointFillTexture = THREE.ImageUtils.loadTexture("img/cfill.png");

      var maxW = modelOption.cardW > modelOption.cardH ? modelOption.cardW : modelOption.cardH;
      if (OA.paperTexture) {
        var info = OA.paperTextureInfo;
        OA.Utils.texture.data.paper = THREE.ImageUtils.loadTexture(info.src);
        var imageSize = info.size; //must change this vaule by loaded image
        var paperT = OA.Utils.texture.data.paper;
        if (info.isFill) {
          //paperT.repeat = 0;
        }
        paperT.wrapS = paperT.wrapT = THREE.RepeatWrapping;
        //paperT.anisotropy = 1;
        paperT.offset.y = info.offset && info.offset.y?info.offset.y: 0;
        paperT.offset.x = info.offset && info.offset.x?info.offset.x: 0;
        paperT.flipY = false;
        var repeateSize = OA.Utils.texture.adjustTextureSize(maxW, imageSize, info.isFill); //isFull(true) or repeat
        paperT.repeat.set(repeateSize, repeateSize);
      }
     },
     getTexture: function(){
       if(OA.Utils.texture.ready){
          return OA.Utils.texture.data;
       }else{
          OA.Utils.texture.loadAllTexture();
          return OA.Utils.texture.data;
       }
     }
   },
   formatFloat: function (num, pos) {
     var size = Math.pow(10, pos);
     return Math.round(num * size) / size;
   },
    debugaxis: function(scene, oa, axisLength) {
      //Shorten the vertex function
      function v(x, y, z) {
        return new THREE.Vector3(x, y, z);
      }
      //Create axis (point1, point2, colour)
      function createAxis(p1, p2, color) {
        var line, lineGeometry = new THREE.Geometry(),
          lineMat = new THREE.LineBasicMaterial({
            color: color,
            lineWidth: 1
          });
        lineGeometry.vertices.push(p1, p2);
        line = new THREE.Line(lineGeometry, lineMat);
        scene.add(line);
      }
      createAxis(v(-axisLength, 0, 0), v(axisLength, 0, 0), 0xFF0000);
      createAxis(v(0, -axisLength, 0), v(0, axisLength, 0), 0x00FF00);
      createAxis(v(oa.getCardW() / 2, -axisLength, 0), v(oa.getCardW() / 2, axisLength, 0), 0x00FFFF);
      createAxis(v(0, 0, -axisLength), v(0, 0, axisLength), 0x0000FF);
    },
   getTestExPolygonTree: function(){
      return [{"outer":[{"X":103.181,"Y":220.799},{"X":104.364,"Y":190.337},{"X":99.849,"Y":182.369},{"X":104.803,"Y":183.405},{"X":105.069,"Y":164.693},{"X":101.856,"Y":144.889},{"X":96.602,"Y":131.47},{"X":94.137,"Y":128.41},{"X":87.938,"Y":126.121},{"X":68.853,"Y":124.712},{"X":55.191,"Y":137.809},{"X":54.012,"Y":135.274},{"X":57.142,"Y":133.283},{"X":55.261,"Y":131.519},{"X":49.807,"Y":133.03},{"X":48.27,"Y":137.16},{"X":48.762,"Y":142.672},{"X":47.331,"Y":146.85},{"X":44.672,"Y":148.789},{"X":45.573,"Y":135.814},{"X":43.345,"Y":140.126},{"X":42.719,"Y":137.016},{"X":36.671,"Y":141.24},{"X":33.291,"Y":130.355},{"X":37.363,"Y":127.208},{"X":36.772,"Y":122.604},{"X":39.952,"Y":125.467},{"X":42.663,"Y":124.482},{"X":44.19,"Y":120.736},{"X":43.192,"Y":117.816},{"X":36.355,"Y":119.368},{"X":34.878,"Y":115.119},{"X":38.146,"Y":113.954},{"X":35.52,"Y":109.941},{"X":36.896,"Y":107.535},{"X":40.517,"Y":109.3},{"X":48.975,"Y":99.851},{"X":54.198,"Y":97.87},{"X":55.123,"Y":96.323},{"X":53.293,"Y":92.238},{"X":47.891,"Y":91.602},{"X":44.017,"Y":97.261},{"X":43.072,"Y":95.066},{"X":44.522,"Y":90.935},{"X":44.008,"Y":88.647},{"X":40.073,"Y":88.1},{"X":43.185,"Y":74.685},{"X":45.661,"Y":77.401},{"X":52.455,"Y":76.115},{"X":52.093,"Y":71.941},{"X":48.26,"Y":65.59},{"X":52.041,"Y":62.795},{"X":54.785,"Y":62.356},{"X":60.725,"Y":53.764},{"X":64.398,"Y":54.837},{"X":61.601,"Y":44.213},{"X":62.183,"Y":42.429},{"X":68.685,"Y":38.57},{"X":70.857,"Y":43.864},{"X":75.301,"Y":36.658},{"X":79.74,"Y":34.903},{"X":81.903,"Y":30.601},{"X":86.186,"Y":30.127},{"X":96.983,"Y":24.682},{"X":99.042,"Y":24.701},{"X":102.3,"Y":28.63},{"X":103.329,"Y":25.855},{"X":118.837,"Y":26.405},{"X":120.026,"Y":29.068},{"X":121.061,"Y":27.36},{"X":125.084,"Y":25.838},{"X":126.883,"Y":26.514},{"X":127.849,"Y":38.57},{"X":128.615,"Y":33.388},{"X":130.273,"Y":31.36},{"X":131.323,"Y":33.438},{"X":132.884,"Y":29.553},{"X":134.28,"Y":32.955},{"X":133.89,"Y":37.482},{"X":135.186,"Y":37.093},{"X":138.311,"Y":30.826},{"X":140.772,"Y":37.436},{"X":141.693,"Y":35.85},{"X":144.879,"Y":37.805},{"X":142.882,"Y":42.808},{"X":148.072,"Y":39.964},{"X":157.87,"Y":48.073},{"X":158.349,"Y":54.987},{"X":159.992,"Y":53.247},{"X":165.235,"Y":59.029},{"X":168.358,"Y":68.004},{"X":166.742,"Y":72.543},{"X":165.338,"Y":71.529},{"X":160.255,"Y":72.686},{"X":158.431,"Y":75.073},{"X":161.396,"Y":76.487},{"X":168.524,"Y":74.919},{"X":169.529,"Y":78.059},{"X":168.336,"Y":85.228},{"X":173.242,"Y":81.367},{"X":174.67,"Y":82.369},{"X":173.259,"Y":76.874},{"X":174.359,"Y":75.745},{"X":178.357,"Y":80.253},{"X":179.604,"Y":88.167},{"X":182.692,"Y":88.307},{"X":183.609,"Y":92.202},{"X":182.202,"Y":94.947},{"X":180.434,"Y":95.677},{"X":181.412,"Y":98.679},{"X":183.225,"Y":97.639},{"X":185.774,"Y":116.788},{"X":184.176,"Y":122.163},{"X":185.003,"Y":125.744},{"X":178.737,"Y":137.703},{"X":176.195,"Y":132.677},{"X":178.874,"Y":144.616},{"X":176.53,"Y":145.613},{"X":171.927,"Y":132.208},{"X":159.229,"Y":117.148},{"X":154.959,"Y":115.578},{"X":154.223,"Y":118.482},{"X":151.973,"Y":119.361},{"X":153.848,"Y":123.672},{"X":152.992,"Y":125.585},{"X":151.361,"Y":125.072},{"X":151.736,"Y":135.538},{"X":152.862,"Y":136.284},{"X":153.905,"Y":134.54},{"X":153.711,"Y":137.53},{"X":151.96,"Y":137.511},{"X":146.422,"Y":122.475},{"X":143.737,"Y":118.367},{"X":132.696,"Y":126.829},{"X":117.466,"Y":150.083},{"X":112.725,"Y":162.23},{"X":112.52,"Y":196.304},{"X":115.346,"Y":220.799}],"holes":[[{"X":149.952,"Y":51.338},{"X":150.825,"Y":47.383},{"X":149.554,"Y":48.757}],[{"X":69.191,"Y":54.204},{"X":68.924,"Y":49.128},{"X":67.899,"Y":48.266}],[{"X":117.109,"Y":140.339},{"X":125.864,"Y":116.268},{"X":126.352,"Y":110.58},{"X":122.683,"Y":117.966}],[{"X":104.36,"Y":136.75},{"X":100.006,"Y":83.235},{"X":97.063,"Y":84.608},{"X":95.913,"Y":95.243},{"X":93.732,"Y":101.053},{"X":95.356,"Y":116.686}],[{"X":45.664,"Y":128.24},{"X":48.032,"Y":126.672},{"X":47.016,"Y":123.901},{"X":44.185,"Y":126.829}],[{"X":172.795,"Y":126.642},{"X":172.545,"Y":123.761},{"X":167.545,"Y":118.809}],[{"X":107.355,"Y":55.057},{"X":107.018,"Y":52.308},{"X":106.193,"Y":52.924}],[{"X":179.526,"Y":124.933},{"X":180.705,"Y":124.515},{"X":178.907,"Y":123.02}],[{"X":53.288,"Y":123.566},{"X":59.22,"Y":121.336},{"X":78.45,"Y":119.193},{"X":70.689,"Y":115.628},{"X":62.414,"Y":114.594},{"X":53.318,"Y":118.598},{"X":52.339,"Y":122.518}],[{"X":85.362,"Y":120.083},{"X":86.531,"Y":119.917},{"X":78.853,"Y":106.531},{"X":71.625,"Y":97.485},{"X":71.301,"Y":98.877},{"X":64.513,"Y":98.961},{"X":67.077,"Y":108.022}],[{"X":149.92,"Y":118.838},{"X":150.14,"Y":114.686},{"X":148.165,"Y":115.206},{"X":148.026,"Y":117.129}],[{"X":134.804,"Y":118.44},{"X":140.042,"Y":114.261},{"X":141.194,"Y":111.614},{"X":140.626,"Y":109.57},{"X":136.364,"Y":113.732}],[{"X":180.366,"Y":116.489},{"X":181.073,"Y":115.652},{"X":179.356,"Y":113.954},{"X":178.754,"Y":115.154}],[{"X":90.309,"Y":115.534},{"X":79.772,"Y":93.054},{"X":85.146,"Y":109.227}],[{"X":182.402,"Y":113.665},{"X":182.443,"Y":110.685},{"X":181.359,"Y":111.614}],[{"X":55.341,"Y":111.837},{"X":57.863,"Y":110.873},{"X":60.011,"Y":106.122},{"X":53.019,"Y":111.614}],[{"X":165.02,"Y":111.614},{"X":165.861,"Y":110.999},{"X":164.028,"Y":110.999}],[{"X":130.927,"Y":111.506},{"X":134.03,"Y":106.264},{"X":132.577,"Y":105.091}],[{"X":144.754,"Y":110.413},{"X":147.103,"Y":108.35},{"X":142.043,"Y":106.954}],[{"X":63.015,"Y":109.3},{"X":64.361,"Y":108.284},{"X":62.673,"Y":107.573},{"X":61.917,"Y":108.622}],[{"X":109.357,"Y":106.986},{"X":113.698,"Y":100.241},{"X":115.484,"Y":92.472},{"X":112.667,"Y":84.929},{"X":109.008,"Y":81.867},{"X":107.649,"Y":102.006}],[{"X":54.854,"Y":106.986},{"X":57.571,"Y":102.662},{"X":56.336,"Y":102.669},{"X":54.054,"Y":106.186}],[{"X":179.811,"Y":105.113},{"X":181.698,"Y":103.895},{"X":181.434,"Y":102.679},{"X":178.454,"Y":102.679}],[{"X":108.201,"Y":159.955},{"X":113.362,"Y":134.854},{"X":115.184,"Y":111.846},{"X":114.144,"Y":107.699},{"X":112.611,"Y":109.222},{"X":109.523,"Y":119.341}],[{"X":88.282,"Y":100.121},{"X":90.571,"Y":89.911},{"X":89.545,"Y":85.085},{"X":85.997,"Y":85.742},{"X":86.185,"Y":93.779}],[{"X":77.239,"Y":98.371},{"X":74.257,"Y":90.532},{"X":68.27,"Y":88.13}],[{"X":59.163,"Y":94.781},{"X":61.287,"Y":92.082},{"X":59.71,"Y":88.948},{"X":54.89,"Y":87.878},{"X":55.847,"Y":91.156}],[{"X":156.428,"Y":94.218},{"X":158.058,"Y":92.011},{"X":157.383,"Y":90.475},{"X":153.958,"Y":92.285}],[{"X":171.563,"Y":92.566},{"X":173.544,"Y":88.952},{"X":172.799,"Y":88.055},{"X":170.49,"Y":91.299}],[{"X":77.032,"Y":89.283},{"X":75.208,"Y":84.541},{"X":69.734,"Y":77.597},{"X":68.922,"Y":79.777}],[{"X":119.637,"Y":88.115},{"X":120.304,"Y":77.135},{"X":119.264,"Y":72.438},{"X":117.388,"Y":73.992},{"X":117.516,"Y":80.792}],[{"X":142.69,"Y":85.445},{"X":144.136,"Y":81.354},{"X":143.001,"Y":80.859}],[{"X":148.866,"Y":85.224},{"X":153.643,"Y":80.839},{"X":149.794,"Y":81.881}],[{"X":165.286,"Y":85.199},{"X":164.7,"Y":83.746},{"X":160.512,"Y":81.803},{"X":160.192,"Y":82.909}],[{"X":130.502,"Y":84.798},{"X":132.592,"Y":78.84},{"X":131.36,"Y":78.336}],[{"X":62.515,"Y":84.688},{"X":63.7,"Y":82.176},{"X":60.188,"Y":74.465},{"X":54.168,"Y":78.902},{"X":56.52,"Y":81.653}],[{"X":48.19,"Y":81.653},{"X":51.148,"Y":79.669},{"X":47.538,"Y":77.053},{"X":45.324,"Y":79.736}],[{"X":84.601,"Y":80.65},{"X":87.17,"Y":79.387},{"X":88.897,"Y":74.98},{"X":85.458,"Y":75.507}],[{"X":76.947,"Y":79.839},{"X":76.473,"Y":77.849},{"X":73.85,"Y":76.163}],[{"X":96.853,"Y":79.315},{"X":98.44,"Y":77.997},{"X":97.359,"Y":77},{"X":95.923,"Y":78.708}],[{"X":66.177,"Y":75.689},{"X":67.546,"Y":73.526},{"X":63.281,"Y":72.581}],[{"X":130.539,"Y":73.142},{"X":131.294,"Y":68.99},{"X":130.02,"Y":64.963}],[{"X":65.017,"Y":61.368},{"X":64.345,"Y":59.693},{"X":61.299,"Y":58.5},{"X":60.496,"Y":59.851}],[{"X":135.018,"Y":100.857},{"X":137.266,"Y":99.498},{"X":136.611,"Y":98.542},{"X":133.988,"Y":100.292}]]},{"outer":[{"X":38.514,"Y":145.195},{"X":37.752,"Y":142.742},{"X":39.6,"Y":142.152}],"holes":[]},{"outer":[{"X":157.87,"Y":124.933},{"X":156.944,"Y":122.296},{"X":160.246,"Y":121.59}],"holes":[]},{"outer":[{"X":47.011,"Y":72.151},{"X":46.675,"Y":68.557},{"X":47.796,"Y":70.737}],"holes":[]},{"outer":[{"X":54.646,"Y":61.208},{"X":53.213,"Y":60.121},{"X":54.348,"Y":57.995},{"X":55.63,"Y":58.915}],"holes":[]}];
   },
   getTestExPolygon: function(){

     return [{"outer":[{"X":50,"Y":150},{"X":50,"Y":110},{"X":10,"Y":110},{"X":10,"Y":10},{"X":110,"Y":10},{"X":110,"Y":50},{"X":150,"Y":50},{"X":150,"Y":150}],"holes":[[{"X":60,"Y":140},{"X":140,"Y":140},{"X":140,"Y":60},{"X":110,"Y":60},{"X":110,"Y":110},{"X":60,"Y":110}],[{"X":20,"Y":100},{"X":50,"Y":100},{"X":50,"Y":50},{"X":100,"Y":50},{"X":100,"Y":20},{"X":20,"Y":20}],[{"X":60,"Y":100},{"X":100,"Y":100},{"X":100,"Y":60},{"X":60,"Y":60}]]}];
   },  
    getTestExPolygon2: function(){

     return [{  
         "outer": [{"X":0,"Y":450},{"X":500,"Y":310},{"X":10,"Y":310}],
         "holes": [
            /*[ ]*/
         ]
      },

       { "outer":[{"X":50,"Y":150},{"X":50,"Y":110},{"X":10,"Y":110},{"X":10,"Y":10},{"X":110,"Y":10},{"X":110,"Y":50},{"X":150,"Y":50},{"X":150,"Y":150}],"holes":[[{"X":60,"Y":140},{"X":140,"Y":140},{"X":140,"Y":60},{"X":110,"Y":60},{"X":110,"Y":110},{"X":60,"Y":110}],[{"X":20,"Y":100},{"X":50,"Y":100},{"X":50,"Y":50},{"X":100,"Y":50},{"X":100,"Y":20},{"X":20,"Y":20}],[{"X":60,"Y":100},{"X":100,"Y":100},{"X":100,"Y":60},{"X":60,"Y":60}]]}];
   },   
    getTestExPolygon3: function(){

     return [
         {  
         "outer": [{"X":0,"Y":30},{"X":60,"Y":60},{"X":80,"Y":30}, {"X":0,"Y":0} ]
         },
         {  
         "outer": [{"X":0,"Y":-30},{"X":60,"Y":-60},{"X":80,"Y":-30}],
         "holes": []
         }
      ];
      
   },
       
   boolenPoly: function(){

   var vertices1 = [
      [61,68], 
      [145,122],  
      [186,94],   
      [224,135],  
      [204,211],  
      [105,200],  
      [141,163],  
      [48,139],   
      [74,117] 
   ];
   var vertices2 = [
      [131,84],   
      [224,110],  
      [174,180],  
      [120,136],  
      [60,167],   
   ];

   var vertices3 = [
      [141,174],  
      [144,170],  
      [174,180]   
   ];
   
   },
   drawTestPoly: function(model) {
    var polys = OA.Utils.getTestExPolygon();

    if (typeof(polys) != "undefined") {

      var exPolygons = polys;
      var a, i, j, jlen, ilen, exPolygon, holes, outer, polygon, outer_shape, hole_shape;
      var alen = exPolygons.length;
      var shapes = new Array(alen);

      for (a = 0; a < alen; a++) {
        exPolygon = exPolygons[a];
        holes = exPolygon.holes;
        outer = exPolygon.outer;
        jlen = outer.length;
        if (jlen) {

          var borderGeo = new THREE.Geometry();

          for (j = 0; j < jlen; j++) {
            point = outer[j];
            point = new THREE.Vector2(point.X, point.Y); // convert Clipper point to THREE.Vector2
            outer[j] = point;

            var vv = new THREE.Vector3(point.x, point.y, 0);
            //vv.normalize();
            //v.normalize()
            borderGeo.vertices.push(new THREE.Vertex(vv));
          }
          //-----

          vv = new THREE.Vector3(outer[0].x, outer[0].y, 0);
          borderGeo.vertices.push(new THREE.Vertex(vv));
          var border2 = new THREE.Line(borderGeo, new THREE.LineBasicMaterial({
            linewidth: 2,
            color: 0x00ffff
          }));
          model.add(border2);
          //----
          outer = new THREE.Shape(outer);
          ilen = holes.length;
          if (ilen) {


            for (i = 0; i < ilen; i++) {
              polygon = holes[i];

              var borderGeo = new THREE.Geometry();

              for (j = 0, jlen = polygon.length; j < jlen; j++) {
                point = polygon[j];
                point = new THREE.Vector2(point.X, point.Y); // convert Clipper point to THREE.Vector2
                polygon[j] = point;

                var vv = new THREE.Vector3(point.x, point.y, 0);
                borderGeo.vertices.push(new THREE.Vertex(vv));

              }

              vv = new THREE.Vector3(polygon[0].x, polygon[0].y, 0);
              borderGeo.vertices.push(new THREE.Vertex(vv));
              var border3 = new THREE.Line(borderGeo, new THREE.LineBasicMaterial({
                linewidth: 2,
                color: 0x00ffff
              }));
              model.add(border3);

              holes[i] = new THREE.Shape(polygon);
            }
            outer.holes = holes;
          }
          shapes[a] = outer;
        }
      }
      shapes = shapes.filter(function() {
        return true
      });
    }

    var materialFront = new THREE.MeshPhongMaterial({
      color: 0xff0000,
      // ambient: 0xffffff,
    });
    var materialSide = new THREE.MeshPhongMaterial({
      color: 0xA5589D,
      //  ambient: 0xffffff
    });

    var extrusionSettings = {
      amount: 0,
      bevelEnabled: true,
      bevelThickness: 0.7,
      bevelSize: 0.7,
      bevelSegments: 1,
      material: 0,
      extrudeMaterial: 1
    };

    var geometry1 = new THREE.ExtrudeGeometry(shapes, extrusionSettings);
    var materials = [materialFront, materialSide];

    var planeGeom = new THREE.ShapeGeometry(shapes);

    var plane = new THREE.Mesh(planeGeom, new THREE.MeshBasicMaterial({
      color: 0xff0000,
      side: THREE.DoubleSide,
      transparent: true
    }));

    for (var i = 0; i < shapes.length; i++) {

      var pointsGeom = shapes[i].createPointsGeometry();
      var border = new THREE.Line(pointsGeom, new THREE.LineBasicMaterial({
        linewidth: 3,
        color: 0x000000
      }));
      var holes = shapes[i].holes;
      for (var j = 0; j < holes.length; j++) {

        var pointsGeom2 = holes[j].createPointsGeometry();
        var border2 = new THREE.Line(pointsGeom2, new THREE.LineBasicMaterial({
          linewidth: 3,
          color: 0x000000
        }));

        model.add(border2);
      }

      model.add(border);
    }



    // var line = new THREE.Line( planeGeom, new THREE.LineBasicMaterial({
    //          linewidth: 2,
    //          color: 0x0000ff
    //       } ));
    // model.add( line );
    // var pointsGeom = planeGeom.createPointsGeometry();
    //   var border = new THREE.Line(pointsGeom, new THREE.LineBasicMaterial({
    //      linewidth: 2,
    //      color: 0x0000ff
    //   }));
    THREE.GeometryUtils.center(plane.geometry);
    model.add(plane);


    // model.add(border);

    var material = new THREE.MeshFaceMaterial(materials);

    var mesh = new THREE.Mesh(geometry1, material);



    function center(geometry) {

      geometry.computeBoundingBox();

      var bb = geometry.boundingBox;

      var offset = new THREE.Vector3();

      offset.addVectors(bb.min, bb.max);
      offset.multiplyScalar(-0.5);

      geometry.applyMatrix(new THREE.Matrix4().makeTranslation(offset.x, offset.y, 0));
      geometry.computeBoundingBox();
      return offset;
    };

    mesh.position.set(0, 0, 0);

    THREE.GeometryUtils.center(mesh.geometry);
    mesh.geometry.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI / 2));

    mesh.name = "Shape";



    model.add(mesh);
   }
};

OA.log = OA.Utils.log;

