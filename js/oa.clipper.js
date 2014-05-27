OA.Clipper = function(userSetting) {
    Array.call(this);
    //private
    var _def = {
        baseFaces: [],
        faces: [],
        angle: 0,
        cardH: 0,
        cardW: 0
    };
    var _setting = $.extend({}, _def, userSetting);
    var clipper = this;
    var baseFaces = OA.Utils.facesClone(_setting.baseFaces);
    var faces = _setting.faces;
    var angle = _setting.angle;
    var vface_list = [];
    var mf = OA.Utils.mf;
    var hface_list = [];
    var upper_list = [];
    var cardW = _setting.cardW,
        cardH = _setting.cardH;
    var clipScale = OA.clipScale;
    var createFace = OA.Utils.createFace;
    var modifyFloatPoint = OA.Utils.modifyFloatPoint;
    var totalCardArea=[{X:0,Y:-cardH},{X:cardW,Y:-cardH},{X:cardW,Y:cardH},{X:0,Y:cardH}]
    //OA clip Algorithm
    //### Create hface_list ###
    //1. create vface_list (sort by t big->small) 
    //  1.1 clip vface whick out of card boundary
    //2. create upper_list (sort by 2D z)
    //2. for each uppper in upper_list
    //3. create HFACE
    //  3.1 create baseHFace from upper
    //  3.2 for any vface in vface_list
    //  3.3 create small fakeHFace from upper to vface
    //  3.4 create tempvface (vface diff small fakeHFace)
    //  3.5 HFace = baseHFace - tempvface
    //  3.6 if baseHFace is become 2 pieces (check connection)
    //      3.6.1 baseHFace  = the piece which connect with upper

    //###Add to model###
    //1. add each vface in reverse vface_list to model ()
    //2. add each hface in hface_list to model


    function compareFaceT(faceA, faceB) {
        //big -> small
        return faceB.getT() - faceA.getT();
    }

    function compareUpperY(upper1, upper2) {
        //big -> small
        return upper1.points[0].Y - upper2.points[0].Y;
    }

    // console.error("==vface_list=======")
    // $.each(vface_list, function(i, t) {
    //     console.error("t: " + t.getT());
    // });

    // console.error("==vface_list reverse=======")
    // vface_list.reverse(compareT);
    // $.each(vface_list, function(i, t) {
    //     console.error("t: " + t.getT());
    // });

    var clipType = {
        ctIntersection: 0,
        ctUnion: 1,
        ctDifference: 2,
        ctXor: 3
    };

    function polyBoolean(subjPoly, clipPoly, clipType) {
        if (!subjPoly || !clipPoly) {
            return null;
        }

        var success = null;
        try {

            //Number ClipType {ctIntersection: 0, ctUnion: 1, ctDifference: 2, ctXor: 3};
            var subj_paths = ClipperLib.JS.ExPolygonsToPaths(subjPoly);
            var clip_paths = ClipperLib.JS.ExPolygonsToPaths(clipPoly);
            var solution_paths = new ClipperLib.PolyTree();
            subj_paths = ClipperLib.JS.Clone(subj_paths);
            clip_paths = ClipperLib.JS.Clone(clip_paths);
            ClipperLib.JS.ScaleUpPaths(subj_paths, clipScale);
            ClipperLib.JS.ScaleUpPaths(clip_paths, clipScale);

            var cpr = new ClipperLib.Clipper();
            cpr.StrictlySimple = true;
            cpr.AddPaths(subj_paths, 0, true); // true means closed path
            cpr.AddPaths(clip_paths, 1, true);
            success = cpr.Execute(clipType, solution_paths, 1, 1);
        } catch (e) {
            debugger;
            console.error("clip failed !");

        }

        //ClipperLib.JS.ScaleDownPaths(subj_paths, clipScale);
        //ClipperLib.JS.ScaleDownPaths(clip_paths, clipScale);

        if (success) {
            var expolygons = ClipperLib.JS.PolyTreeToExPolygons(solution_paths);
            if (OA.tunePath) {
                OA.Utils.exPolygonsClean(expolygons, 1 / clipScale);
            }
            OA.Utils.scaleDownExPolygon(expolygons, clipScale);
            return expolygons;
        } else {
      debugger;
            console.error("polygon boolean failed !");
            return null;
        }

    }

    function clipBoundary(faceAry) {
        $.each(faceAry, function(i, f) {
            var faceSetting = f.oaInfo;
            if (f.oaInfo.isBoundaryClipped) {
                //vface_list.push(f.clone());
                return true;
            }
            var t = f.getT();
            var subj = f.getExPolygons();
            var path=[{X:0,Y:t},{X:cardW,Y:t},{X:cardW,Y:cardH},{X:0,Y:cardH}];
            var clip = OA.Utils.simplePathToPoly(path);
            var resPoly = polyBoolean(subj, clip, 2);
            if (resPoly) {
                clip = OA.Utils.simplePathToPoly(totalCardArea);
                resPoly = polyBoolean(resPoly, clip, 0);
                if (resPoly) {
                    f.rebuild(resPoly);
                    f.oaInfo.isBoundaryClipped = true;
                }
            }
        });
    }

    function fakeHface(upper, len) {
        if (!len) {
            len = upper.t;
        }
        var p2ds = [
            upper.points[0],
            upper.points[1], {
                X: upper.points[1].X,
                Y: upper.points[1].Y - len
            }, {
                X: upper.points[0].X,
                Y: upper.points[1].Y - len
            }
        ];

        var ut = upper.t;
        var ht = ut - upper.points[1].Y;
        var fakeHFace = createFace(p2ds, "HFACE", ht);
        return fakeHFace;
    }


    function getConnectedPoly(upper, polys) {
        var resPolys = [];
        var upperMaxX = modifyFloatPoint(upper.points[0].X);
        var upperMinX = modifyFloatPoint(upper.points[1].X);
        var upperY = modifyFloatPoint(upper.points[0].Y);

        $.each(polys, function(i, poly) {
            var vaildPoly = null;
            $.each(poly && poly.outer, function(j, p2d) {
                if (p2d.Y === upperY && p2d.X <= upperMaxX && p2d.X >= upperMinX) {
                    vaildPoly = poly;
                }
            });
            if (vaildPoly) {
                resPolys.push(vaildPoly);
            }
        });

        // if (resPolys.length === 0) {
        //     OA.log("no remain hface !", 2);
        //     resPolys = null;
        // }
        return resPolys;
    }

    function getPolyHeight(poly) {
        var paths = ClipperLib.JS.ExPolygonsToPaths(poly);
        var bounds = ClipperLib.Clipper.GetBounds(paths);
        var polyHeight = Math.abs(bounds.top - bounds.bottom);
        polyHeight = modifyFloatPoint(polyHeight);
        console.error("polyHeight--" + polyHeight);
        return polyHeight;
    }

    function createHFaces(upper_list, vface_list) {

        var res_list = [];
        var ut, p2ds, hFace, ft, smallFakeHface;
        var resPoly, cntPoly, clippedPoly;
        $.each(upper_list, function(i, upper) {
            var ut = upper.t;

            ut = modifyFloatPoint(ut);
            var hFace = fakeHface(upper);

            //OA.log("ut--" + ut, 2);
            $.each(vface_list, function(j, f) {
                ft = f.getT();
                ft = modifyFloatPoint(ft);
                if (ft >= ut) {
                    clippedPoly = polyBoolean(
                        hFace.getExPolygons(),
                        f.getExPolygons(),
                        clipType.ctDifference
                    );
                    cntPoly = getConnectedPoly(upper, clippedPoly);
                    if (cntPoly /*&& getPolyHeight(cntPoly) >=ut*/ ) {
                        hFace.rebuild(cntPoly);
                        return true;
                    }
                }
                if (ft < ut) {
                    //create smallFakeHface from upper to pervious vface
                    var smallFakeHface = fakeHface(upper, ut - ft);

                    //create clipedVpoly which is the vface diff smallFakeHface
                    var clipedVpoly = polyBoolean(
                        f.getExPolygons(),
                        smallFakeHface.getExPolygons(),
                        clipType.ctDifference
                    );
                    // hface diff clipedVpoly
                    var clipedHPoly = polyBoolean(
                        hFace.getExPolygons(),
                        clipedVpoly,
                        clipType.ctDifference
                    );

                    if (clipedHPoly) {
                        //clipedHPoly may be several pieces, 
                        //but only need connected poly for hface
                        cntPoly = getConnectedPoly(upper, clipedHPoly);
                        if (cntPoly) {
                            hFace.rebuild(cntPoly);
                        } else {
                            hFace = null;
                        }
                    }
                }
            });
            if (hFace != null) {
                res_list.push(hFace);
            }
        });
        return res_list;
    }

    function clipAbove(faceList) {
        $.each(faceList, function(i, f) {
            var subj = f.getExPolygons();

            if(!subj || (subj&& subj.length ===0)){
                
                //remove f from facelist
                sub=null;
                f.rebuild(subj);
                return true;
            }

            for (var j = i + 1; j < faceList.length; j++) {
                var ff = faceList[j];
                var clip = ff.getExPolygons();

                if (!clip || (clip && clip.length === 0)) {
                    break;
                }

                var resPoly = polyBoolean(subj, clip, 2);
                if (resPoly && resPoly.length >0) {
                    subj = resPoly;
                }else{
                    //debugger;
                    subj = null;
                    //remove from faceList
                    break;
                }
            }

            f.rebuild(subj);
        });
    }

    function unionList(faceList) {
        if(faceList.length ===0){
            return;
        }
        var fff = faceList[0]
        var unionPolys = fff.getExPolygons();
        for (var j = 1; j < faceList.length; j++) {
            var clip = faceList[j].getExPolygons();
            unionRes = polyBoolean(unionPolys, clip, 1);
            if (unionRes) {
                unionPolys = unionRes;
            }
        }
        return unionPolys;
    }
    

    function doMergeFaces(face, faces){ 
        var unionPoly = unionList(faces);
        face.rebuild(unionPoly, true);
        return face;
    };

    function tryMergeFaces(faceList, face) {
        var newFaceList = [];
        var tCheckedAry = [];
        $.each(faceList, function(i, f) {

            var t = f.getT();
            // var olen = faceList.length;
            var tChecked = $.inArray(t, tCheckedAry);
            if (tChecked > -1) {
                //have checked
                return true;
            }
            var sameTfaces = $.grep(faceList, function(f) {
                return f.getT() == t;
            });

            if (sameTfaces.length > 1) {
                var f = doMergeFaces(f, sameTfaces);
                newFaceList.push(f);
            } else {
                newFaceList.push(f);
            }
            tCheckedAry.push(t);

        });
        return newFaceList;
    }

    function pushModel() {

        //create unionAllPoly by union all polygons
        var vfaceAllPoly = unionList(vface_list);
        var hfaceAllPoly = unionList(hface_list);
        var unionAllPoly = null;
        if(vfaceAllPoly && hfaceAllPoly){
          unionAllPoly = polyBoolean(vfaceAllPoly, hfaceAllPoly, clipType.ctUnion);
        }else if(vfaceAllPoly && ! hfaceAllPoly){
          unionAllPoly = vfaceAllPoly;
        }else if(hfaceAllPoly && ! vfaceAllPoly){
          unionAllPoly = hfaceAllPoly;
        }

        if (unionAllPoly) {
            //basefaces clip all polygons
            $.each(baseFaces, function(i, f) {
                var subj = f.getExPolygons();
                var clip = unionAllPoly;

                var resPoly = polyBoolean(subj, clip, 2);
                if (resPoly) {
                    subj = resPoly;
                } else {
                    console.error("failed !");
                }
                f.rebuild(subj);
            });
        }else{

        }
        //clip vfaces by min->big sequence
        if (vface_list && vface_list.length > 0) {
            clipAbove(vface_list);
        }

        if (hface_list && hface_list.length > 0) {
            $.each(vface_list, function(i, f) {
                var subj = f.getExPolygons();
                var clip = hfaceAllPoly;
                var resPoly = polyBoolean(subj, clip, 2);
                if (resPoly) {
                    subj = resPoly;
                }
                f.rebuild(subj);
            });
            //clip hfaces by min->big sequence
            clipAbove(hface_list);
        }
    }

    var init = function() {
        makeModel();
        return clipper;
    };


    var makeModel = function() {
        clipBoundary(faces);
        //##step 1 create vface_list (sort by t big->small) 
        //vface_list = faces.slice(0); //not deep copy
        vface_list = OA.Utils.facesClone(faces);
        vface_list = tryMergeFaces(vface_list);

        vface_list.sort(compareFaceT);
        //todo: find vlist by marged list
        //##step 2 create upper_list (sort by 2D z)
        $.each(vface_list, function(i, f) {
            var upper2Ds = f.getUpper2Ds();
            if (upper2Ds) {
                $.each(upper2Ds, function(j, upper) {
                    upper_list.push({
                        points: upper,
                        t: f.getT()
                    });
                });
            }
        });
        upper_list.sort(compareUpperY);

        //##step 3 create HFACE
        hface_list = createHFaces(upper_list, vface_list);
        hface_list = tryMergeFaces(hface_list);
        //vface_list = tryMergeFaces(vface_list);

        vface_list.sort(compareFaceT);
        vface_list.reverse(); //small -> big
        hface_list.sort(compareFaceT); //t big -> small
        hface_list.reverse(); //t small -> big

        //##step 4 push all faces to card model
        pushModel();
    }

    this.addFace = function(newFace){
        //tryMergeFaces(vface_list)
        faces.push(newFace);
        makeModel();
    }

    this.doClip = function(cardAngle) {
        //return clipped faces
        for (var i = 0; i < baseFaces.length; i++) {
            baseFaces[i].setAngle(cardAngle);
            clipper.push(baseFaces[i]);
        }

        for (var i = 0; i < vface_list.length; i++) {
            vface_list[i].setAngle(cardAngle);
            clipper.push(vface_list[i]);
        }


        for (var i = 0; i < hface_list.length; i++) {
            hface_list[i].setAngle(cardAngle);
            clipper.push(hface_list[i]);
        }
       
        return clipper.length>0;
        
    };


    return init();
};

OA.Clipper.prototype = Object.create(Array.prototype);