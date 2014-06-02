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
    var holeList = [];
    var pullList = [];
    var cardW = _setting.cardW,
        cardH = _setting.cardH;
    var faceCreateModeType = {"faces":0, "hole":1, "pull": 2};
    var clipScale = OA.clipScale;
    var createFace = OA.Utils.createFace;
    var modifyFloatPoint = OA.Utils.modifyFloatPoint;
    var totalCardArea=[{X:0,Y:-cardH},{X:cardW,Y:-cardH},{X:cardW,Y:cardH},{X:0,Y:cardH}];
    var forceClipList = [];
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
        if (!subjPoly || !clipPoly ||
            (subjPoly && subjPoly.length===0) && (clipPoly && clipPoly.length===0) ) {
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

        // if (upper.mergeUppers != undefined && upper.mergeUppers.length > 0) {
        //     var mergeUppers = upper.mergeUppers;
        //     var resPolys = [];
        //     $.each(mergeUppers, function(i, up) {
        //         var res = getConnectedPoly(up, polys);
        //         if (res && res.length > 0) {

        //              $.each(res, function(j, poly){
        //                   var tChecked = $.inArray(poly, resPolys);
        //                   if (tChecked > -1) {
        //                     return true;
        //                   }
        //                   resPolys.push(poly);
        //              });
        //         }
        //     });
        //     return resPolys;
        // } else {

            var resPolys = [];
            var p1x = modifyFloatPoint(upper[0].X);
            var p2x = modifyFloatPoint(upper[1].X);
            var upperY = modifyFloatPoint(upper[0].Y);
            var upperMaxX = p1x > p2x ? p1x : p2x;
            var upperMinX = p1x < p2x ? p1x : p2x;
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
            return resPolys;
        //}
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

        // var up = {
        //     points: [{
        //         X: 30,
        //         Y: 10
        //     }, {
        //         X: 50,
        //         Y: 10
        //     }],
        //     t: 30
        // }
        // var hf = fakeHface(up, 20);
        // res_list.push(hf);

        $.each(upper_list, function(i, upper) {
            var ut = upper.t;
            ut = modifyFloatPoint(ut);
            var hFace;

            if (upper.inHole) {

                var fakeY = upper.points[0].Y;
                var fakeUpper = {
                    points: [{
                        X: 0,
                        Y: fakeY
                    }, {
                        X: cardW,
                        Y: fakeY
                    }],
                    t: upper.t
                };
                hFace = fakeHface(fakeUpper);
            } else {
                hFace = fakeHface(upper);
            }

            //OA.log("ut--" + ut, 2);
            $.each(vface_list, function(j, f) {
                ft = f.getT();
                ft = modifyFloatPoint(ft);
                var contourType = f.oaInfo.contours.type;

                if (ft >= ut) {
                    clippedPoly = polyBoolean(
                        hFace.getExPolygons(),
                        f.getExPolygons(),
                        clipType.ctDifference
                    );
                    if (ft == ut) {
                        cntPoly = getConnectedPoly(upper.points, clippedPoly);
                        if (cntPoly) {
                            hFace.rebuild(cntPoly);
                            return true;
                        }
                    } else {
                        hFace.rebuild(clippedPoly);
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
                        cntPoly = getConnectedPoly(upper.points, clipedHPoly);
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
       
       var new_faceList = $.grep(faceList, function(f, i) {
            var subj = f.getExPolygons();
            if(!subj || (subj&& subj.length ===0)){
                //remove from list
                return false;
            }

            for (var j = i + 1; j < faceList.length; j++) {
                var ff = faceList[j];
                var clip = ff.getExPolygons();
                if (!clip || (clip && clip.length === 0)) {
                    continue;
                }
                var resPoly = polyBoolean(subj, clip, 2);
                if (resPoly && resPoly.length >0) {
                    subj = resPoly;
                }else{
                    //remove from list
                    return false;
                }
            }
            f.rebuild(subj);
            return true;
        });
       return new_faceList;
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

        //clip force clip list: for example: exploygon from text input
        // if (forceClipList.length > 0) {

        //     var forceClipAllPoly = unionList(forceClipList);
    
        //     $.each(vface_list, function(i, f) {
        //         var subj = f.getExPolygons();
        //         var clip = forceClipAllPoly;
        //         var resPoly = polyBoolean(subj, clip, 2);
        //         if (resPoly) {
        //             subj = resPoly;
        //         }
        //         f.rebuild(subj);
        //     });
        //     $.each(hface_list, function(i, f) {
        //         var subj = f.getExPolygons();
        //         var clip = forceClipAllPoly;
        //         var resPoly = polyBoolean(subj, clip, 2);
        //         if (resPoly) {
        //             subj = resPoly;
        //         }
        //         f.rebuild(subj);
        //     });
        // }

        if (forceClipList.length > 0) {

            $.each(forceClipList, function(i, fc) {
                var lower2Ds = fc.getLower2Ds();
                var lower2DY = lower2Ds && lower2Ds[0] &&  lower2Ds[0][0] &&  lower2Ds[0][0].Y;
               //debugger;
                var fct = fc.getT();
                var fctPoly = fc.getExPolygons();
                $.each(vface_list, function(i, f) {
                    var ft = f.getT();
                    if(ft > fct){
                        return true;
                    }
                    var subj = f.getExPolygons();
                    var clip = fctPoly;
                    var resPoly = polyBoolean(subj, clip, 2);
                    if (resPoly) {
                        subj = resPoly;
                    }
                    f.rebuild(subj);
                });
                $.each(hface_list, function(i, f) {
                    var ft = f.getT();
                    if (ft > fct) {
                        return true;
                    }
                    var subj = f.getExPolygons();
                    var clip = fctPoly;
                    var resPoly = polyBoolean(subj, clip, 2);
                    if (resPoly) {
                        subj = resPoly;
                    }
                    f.rebuild(subj);
                });
            });
        }


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

                //garbage pieces remove 
                // var baseConnectLine;
                // if (f.name == "baseVFace") {
                //     baseConnectLine = f.getUpper2Ds()[0];
                //     subj = getConnectedPoly({
                //         points: baseConnectLine
                //     }, subj);
                // } else {
                //     baseConnectLine = f.getLower2Ds()[0];
                //     subj = getConnectedPoly({
                //         points: baseConnectLine
                //     }, subj);
                // }
                f.rebuild(subj);
            });
        }else{

        }
        //clip vfaces by min->big sequence
        if (vface_list && vface_list.length > 0) {
            vface_list = clipAbove(vface_list);
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
            hface_list = clipAbove(hface_list);
        }

    }

    function doMergeUppers(sameYary, upper, upperY) {
        var maxX = 0;
        var minX = 99999;
        var newUpper = $.extend({}, upper)
        var m = OA.Utils.maxMinFns;
        $.each(sameYary, function(i, u) {
            var minP = m.minP(u);
            minX = minP.X < minX ? minP.X : minX;
            var maxP = m.maxP(u);
            maxX = maxP.X > maxX ? maxP.X : maxX;
        });
        newUpper[0] = {X: maxX, Y: upperY},
        newUpper[1] = {X: minX, Y: upperY};
        newUpper.mergeUppers = sameYary;
        return newUpper;
    }

    var init = function() {
        makeModel();
        return clipper;
    };


    var makeModel = function() {
        clipBoundary(faces);
        //##step 1 create vface_list (sort by t big->small) 
        //vface_list = faces.slice(0); //not deep copy
        var allModeList = OA.Utils.facesCloneAllMode(faces, faceCreateModeType.hole);
        vface_list = allModeList[faceCreateModeType.faces];
        pullList = allModeList[faceCreateModeType.pull];
        vface_list = tryMergeFaces(vface_list);
        holeList = allModeList[faceCreateModeType.hole];

        //vfaces list clip holes
        $.each(holeList, function(i, hole) {
            if (hole.oaInfo.contours.type == "expolygons") {
                forceClipList.push(hole);
                return true;
            }
            var t = hole.getT();
            var new_vface_list = $.grep(vface_list, function(f, i) {
                if (f.getT() <= t) {
                    var subj = f.getExPolygons();
                    var clip = hole.getExPolygons();
                    var resPoly = polyBoolean(subj, clip, 2);
                    if (resPoly && resPoly.length > 0) {
                        f.rebuild(resPoly);
                        return true;
                    } else {
                        return false;
                    }
                }
                return true;
            });
            vface_list = new_vface_list;
        });
        //pull list clip holes
        $.each(holeList, function(i, hole) {
            if (hole.oaInfo.contours.type == "expolygons") {
                forceClipList.push(hole);
                return true;
            }
            var t = hole.getT();
            var new_pullList = $.grep(pullList, function(f, i) {
                if (f.getT() <= t) {
                    var subj = f.getExPolygons();
                    var clip = hole.getExPolygons();
                    var resPoly = polyBoolean(subj, clip, 2);
                    if (resPoly && resPoly.length > 0) {
                        f.rebuild(resPoly);
                        return true;
                    } else {
                        return false;
                    }
                }
                return true;
            });
            pullList = new_pullList;
        });    

        //find upper
        vface_list.sort(compareFaceT);
        //debugger;
        //todo: find vlist by marged list
        //##step 2 create upper_list (sort by 2D z)
        //find upper from vface list
        $.each(vface_list, function(i, f) {
            var upper2Ds = f.getUpper2Ds();
            if (upper2Ds) {

                //var checkedYAry = [];

                $.each(upper2Ds, function(j, upper) {
                    var inHole = upper.inHole === true ? true : false;
                    //do not need to merge inHole upper
                    upper_list.push({
                        points: upper,
                        t: f.getT(),
                        inHole: inHole
                    });

                    // // //merge upper====
                    // var uy = upper[0].Y;
                    // var uPolyIndex = upper.polyIndex;

                    // var yChecked = $.inArray(j, checkedYAry);
                    // if (yChecked > -1) {
                    //     return true;
                    // }
                   
                    // var sameYuppers = $.grep(upper2Ds, function(u, k) {   
                    //     var res = false;
                    //     if(u[0].Y == uy && !u.inHole && u.polyIndex === uPolyIndex){
                    //         res = true;
                    //         checkedYAry.push(k);
                    //     }
                    //     return res;
                    // });


                    // if (sameYuppers.length > 1) {
                    //     upper = doMergeUppers(sameYuppers, upper, uy);
                    // }
                    // //merge upper
                    // //=====

                });
            }
        });


        //find upper from pull (but outer upper is invaild)
        $.each(pullList, function(i, f) {
            var upper2Ds = f.getUpper2Ds();
            if (upper2Ds) {
                $.each(upper2Ds, function(j, upper) {
                    var inHole = upper.inHole === true ? true : false;
                    if (upper.inOuter) {
                        return true;
                    }
                    upper_list.push({
                        points: upper,
                        t: f.getT(),
                        inHole: inHole
                    });
                });
            }
        });
        upper_list.sort(compareUpperY);
        
        //merge vface list and pull list
        vface_list = tryMergeFaces($.merge(vface_list, pullList));

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