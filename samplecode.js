debugger;
$.each(shape.vertices, function(i, p){
  if(p.z!=1){
    return true;
  }
  var pp ={X: p.x, Y: p.y};
  path.push(pp);

  var p2d = new THREE.Vector2(p.x, p.y);
  p2dPath.push(p2d);
});

//path.push({X: shape.vertices[0].x, Y: shape.vertices[0].y} )
OA.Utils.modifyPathOrientation(path, false);
var subj_paths = [path];
var clip_paths = [[]];
var scale = 1;
ClipperLib.JS.ScaleUpPaths(subj_paths, scale);
 ClipperLib.JS.ScaleUpPaths(clip_paths, scale);
var cpr = new ClipperLib.Clipper();

cpr.AddPaths(subj_paths, ClipperLib.PolyType.ptSubject, true);
cpr.AddPaths(clip_paths, ClipperLib.PolyType.ptClip, true);
var solution_polytree = new ClipperLib.PolyTree();
cpr.Execute(1, solution_polytree, 1, 1);

//solution_expolygons = new ClipperLib.ExPolygons();
 var expolygons = ClipperLib.JS.PolyTreeToExPolygons(solution_polytree);

baseVFace.rebuild(expolygons);


   




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

        


        $.each(sort_vface_list, function(i, f) {
           var f;
           var t = f.getT();
           var expolygons = f.getExPolygons();
           // if(expolygons)
           
           var subj_paths = ClipperLib.JS.ExPolygonsToPaths(expolygons);
           var clip_paths = [[  {X:0,Y:t}, {X:cardW,Y:t}, {X:cardW,Y:cardH}, {X:0,Y:cardH}    ]];
           //--
           var subj_paths_ex = [{
                 "outer": [  {X:0,Y:t}, {X:cardW,Y:t}, {X:cardW,Y:cardH}, {X:0,Y:cardH}    ],
                 "holes": [
                    /*[ ]*/
                 ]
            }];

           //clip_paths = ClipperLib.JS.ExPolygonsToPaths(subj_paths_ex);
           //---
            ClipperLib.JS.ScaleUpPaths(subj_paths, clipScale);
            ClipperLib.JS.ScaleUpPaths(clip_paths, clipScale);
            var solution_paths = new ClipperLib.PolyTree();
            //var solution_paths = new ClipperLib.Paths();
            var cpr = new ClipperLib.Clipper();
            cpr.StrictlySimple = true;

            cpr.AddPaths(subj_paths, 0, true); // true means closed path
            cpr.AddPaths(clip_paths, 1, true);
            var succeeded = cpr.Execute(2, solution_paths, 1, 1);
            var expolygons = ClipperLib.JS.PolyTreeToExPolygons(solution_paths);

            //OA.Utils.scaleDownExPolygon(expolygons, clipScale);
            if (0) {
                var cpr = new ClipperLib.Clipper();
                subj_paths = ClipperLib.JS.ExPolygonsToPaths(expolygons);
                cpr.AddPaths(subj_paths, 0, true); // true means closed path
                //$.each(baseFaces, function(j, bf) {
                //      return true;
                var bf = baseFaces[1];
                var basefacePoly = bf.getExPolygons();
                clip_paths = ClipperLib.JS.ExPolygonsToPaths(basefacePoly);
                ClipperLib.JS.ScaleUpPaths(clip_paths, clipScale);
                cpr.AddPaths(clip_paths, 1, true);

                //});
                solution_paths = new ClipperLib.PolyTree();
                succeeded = cpr.Execute(0, solution_paths, 1, 1);
            }

            // var hfacePoly = baseFaces[1].getExPolygons();

            // subj_paths = ClipperLib.JS.ExPolygonsToPaths(expolygons);
            // clip_paths = ClipperLib.JS.ExPolygonsToPaths(hfacePoly);
            // var cpr = new ClipperLib.Clipper();
            // cpr.AddPaths(subj_paths, ClipperLib.PolyType.ptSubject, true); // true means closed path
            // cpr.AddPaths(clip_paths, ClipperLib.PolyType.ptClip, true);

          
            OA.Utils.scaleDownExPolygon(expolygons, clipScale);
            f.redraw(expolygons);

        });
  








   if(!isReset){
        var resetAngle = face.angle;
        if(face.angle != undefined){
            applyAngle2(face, -resetAngle, true);
         }

        face.angle = angle; 
   }

   


//3d polygon
var geo = new THREE.Geometry();
            geo.vertices.push(new THREE.Vector3(30, 30, 5));
            geo.vertices.push(new THREE.Vector3(30, 40, 5));
            geo.vertices.push(new THREE.Vector3(40, 40, 5));
            geo.vertices.push(new THREE.Vector3(60, 35, 5));
            geo.vertices.push(new THREE.Vector3(40, 30, 5));                

            for (var face = 0 ; face < 5 - 2; face++) {
                // this makes a triangle fan, from the first +Y point around
                geo.faces.push(new THREE.Face3(0, face + 1, face + 2));
            }

            var mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff, opacity: 1,    side: THREE.DoubleSide}));
            geo.computeFaceNormals();

          //  layer.add(mesh);
         //   objects.push(mesh);

scene.add(mesh);
createFaceGrid


//martix
var finalMatrix = new THREE.Matrix4();
var rotationMatrix = new THREE.Matrix4();
var translationMatrix = new THREE.Matrix4();

rotationMatrix.makeRotationFromEuler( new THREE.Euler( Math.PI / 3, Math.PI, 10 ));
translationMatrix.makeTranslation(0,0,10);

finalMatrix.multiply(rotationMatrix);
finalMatrix.multiply(translationMatrix);

testFace.applyMatrix(finalMatrix);
scene.add(testFace);     











       function createFace(pointAry, depth, type, opacity, gridData) {
            
                if(opacity === undefined){
                    opacity = 1;
                }

                var params, hParams = {
                        color: 0xE9DABC,
                        pos: {
                            x: 0,
                            y: depth,
                            z: 0
                        },
                        rot: {
                            x: Math.PI / 2,
                            y: 0,
                            z: 0
                        }
                    },
                    vParams = {
                        color: 0xEADED2,
                        pos: {
                            x: 0,
                            y: 0,
                            z: depth
                        },
                        rot: {
                            x: 0,
                            y: 0,
                            z: 0
                        }
                    };

                if (type === "HFACE") {
                    params = hParams;
                } else if (type === "VFACE") {
                    params = vParams;
                } else {
                    console.error("need type!?");
                    return;
                }

                var shape = new THREE.Shape(pointAry);
                var planeGeom = new THREE.ShapeGeometry(shape);
                var face = new THREE.Object3D();
                var plane = new THREE.Mesh(planeGeom, new THREE.MeshBasicMaterial({
                    color: params.color,
                    side: THREE.DoubleSide,
                    opacity: opacity,
                    visible: opacity === 0? false: true,
                    transparent: true
                }));

                face.oaInfo = {
                      type: type,
                    depth: depth
                };

                face.add(plane);
                var pointsGeom = shape.createPointsGeometry();
                var border = new THREE.Line(pointsGeom, new THREE.LineBasicMaterial({
                    linewidth: 2,
                    color: 0x747E84
                }));

                face.rotation.set(params.rot.x, params.rot.y, params.rot.z);
                face.position.set(params.pos.x, params.pos.y, params.pos.z);

                face.add(border);

                if(gridData){
                    createFaceGrid(face, gridData);
                }

                return face;
        }













var testFace = createFace(pAry, 20, "HFACE");
//testFace.applyMatrix( new THREE.Matrix4().makeRotationFromEuler( new THREE.Euler( Math.PI / 2, Math.PI, 10 ) ) );
//testFace.applyMatrix( new THREE.Matrix4().makeRotationFromEuler( new THREE.Euler( Math.PI / 2, Math.PI, 10 ) ) );

var finalMatrix = new THREE.Matrix4();
var rotationMatrix = new THREE.Matrix4();
var translationMatrix = new THREE.Matrix4();

rotationMatrix.makeRotationFromEuler( new THREE.Euler( Math.PI / 3, Math.PI, 10 ));
translationMatrix.makeTranslation(0,0,10);

finalMatrix.multiply(rotationMatrix);
finalMatrix.multiply(translationMatrix);

testFace.applyMatrix(finalMatrix);








    var faceGeom = new THREE.Geometry();

     var   materials = [
               new THREE.MeshBasicMaterial({
                    color: 0xE9DABC,
                    side: THREE.DoubleSide
                }),
               new THREE.MeshBasicMaterial({
                    color: 0xf000000,
                    side: THREE.DoubleSide
                })
               ,
                new THREE.LineBasicMaterial({
                    linewidth: 10,
                    color: 0xf000000,
                    opacity: 0.5
                })
            ];


var line = new THREE.Line(points, new THREE.LineBasicMaterial({
        linewidth: 10,
        color: 0xf000000,
        opacity: 0.5
    }));
line.rotation.set(-30, 0, 0);
             line.position.set(0, 0, 89);

 //scene.add(line);
            
            THREE.GeometryUtils.merge(faceGeom, points, 2);
            // THREE.GeometryUtils.merge(faceGeom, geometry, 0);

            //  THREE.GeometryUtils.merge(faceGeom, new THREE.CircleGeometry(200, 32), 1);


            var faceMesh = new THREE.Mesh(faceGeom, new THREE.MeshFaceMaterial(materials));
             faceMesh.rotation.set(-30, 0, 0);
             faceMesh.position.set(0, 0, 89);
            scene.add(faceMesh);



//







function createFace(pointAry) {

    var shape = new THREE.Shape(pointAry);
    var planeGeom = new THREE.ShapeGeometry(shape);

    var face = new THREE.Object3D();

    var plane = new THREE.Mesh(planeGeom, new THREE.MeshBasicMaterial({
        color: 0xE9DABC,
        side: THREE.DoubleSide
    }));

     face.add(plane);

    var pointsGeom = shape.createPointsGeometry();
    var border = new THREE.Line(pointsGeom, new THREE.LineBasicMaterial({
        linewidth: 10,
        color: 0xf000000,
        opacity: 0.5
    }));

     
     face.add(border);
    
    

}


//-=========

        var mainGeomMesh = null;

        function drawSomething2() {
            if (mainGeomMesh != null) {
                scene.remove(mainGeomMesh);
                mainGeomMesh = null;
            }
            var mainGeom = new THREE.Geometry();
            var materials = [];

            for (var ii = 0; ii < 100; ii++) {
                // each added object requires a separate WebGL draw call
                //scene.clear();
                var mesh = createNewObject(materials);
                THREE.GeometryUtils.merge(mainGeom, mesh);
            }
            mainGeomMesh = new THREE.Mesh(mainGeom, new THREE.MeshFaceMaterial(materials));
            mainGeomMesh.matrixAutoUpdate = false;
            mainGeomMesh.updateMatrix();
            scene.add(mainGeomMesh);
        }





        //=======


        if(true){
 
    movePoint.add(circleFill);
    movePoint.add(circleBorder); 
    if (intersector.object && intersector.object.oa && intersector.object.oa.type === "HFACE") {
        movePoint.position.set(cx, cy + 0.2, cz);
        movePoint.rotation.x = -Math.PI / 2;
    } else {
        movePoint.position.set(cx, cy, cz + 0.2);
    }

    scene.add(movePoint);

}else{
            var circleFill = new THREE.CircleGeometry(innerR, 32);
            var mainGeom = new THREE.Geometry();
           

            THREE.GeometryUtils.merge(mainGeom, circleBorderGeom, 0);
            THREE.GeometryUtils.merge(mainGeom, circleFillGeom, 1);
            var mainGeomMesh = new THREE.Mesh(mainGeom, new THREE.MeshFaceMaterial(materials));
            mainGeomMesh.id = "movePoint";

            if (intersector.object && intersector.object.oa && intersector.object.oa.type === "HFACE") {
                mainGeomMesh.position.set(cx, cy + 0.2, cz);
                mainGeomMesh.rotation.x = -Math.PI / 2;
            } else {
                mainGeomMesh.position.set(cx, cy, cz + 0.2);
            }

            scene.add(mainGeomMesh);
            movePoint = mainGeomMesh
        }







             function createGrid(cardW, cardH, step) {
                // grid
                var geometry = new THREE.Geometry();

                for (var i = 0; i <= cardH; i += step) {
                    //xz lines
                    geometry.vertices.push(new THREE.Vector3(0, 0.1, i));
                    geometry.vertices.push(new THREE.Vector3(cardW, 0.1, i));
                    //xy lines
                    geometry.vertices.push(new THREE.Vector3(0, i, 0.1));
                    geometry.vertices.push(new THREE.Vector3(cardW, i, 0.1));
                }
                for (var i = 0; i <= cardW; i += step) {
                    //xz lines
                    geometry.vertices.push(new THREE.Vector3(i, 0.1, 0));
                    geometry.vertices.push(new THREE.Vector3(i, 0.1, cardH));
                    //xy grid
                    geometry.vertices.push(new THREE.Vector3(i, 0, 0.1));
                    geometry.vertices.push(new THREE.Vector3(i, cardH, 0.1));
                }
                var material = new THREE.LineBasicMaterial({
                    color: 0x000000,
                    opacity: 0.2,
                    transparent: true
                });
                var line = new THREE.Line(geometry, material);
                line.type = THREE.LinePieces;
                scene.add(line);
            }














            var PI2 = Math.PI * 2;

            var programFill = function ( context ) {

                context.beginPath();
                context.arc( 0, 0, 0.5, 0, PI2, true );
                context.fill();

            }
var programStroke = function ( context ) {

                context.lineWidth = 0.025;
                context.beginPath();
                context.arc( 0, 0, 0.5, 0, PI2, true );
                context.stroke();

            }
    
var particle = new THREE.Sprite( new THREE.SpriteCanvasMaterial( { color: Math.random() * 0x808080 + 0x808080, program: programFill } ) );
                    particle.position.x = Math.random() * 800 - 400;
                    particle.position.y = Math.random() * 800 - 400;
                    particle.position.z = Math.random() * 800 - 400;
                    particle.scale.x = particle.scale.y = Math.random() * 20 + 20;

                     parentGroup.add( particle );



