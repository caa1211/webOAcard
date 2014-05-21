OA.Clipper = function(userSetting) {
    Array.call(this);
    //private
    var _def = {
        baseFaces: [],
        faces: [],
        angle: 0
    };
    var _setting = $.extend({}, _def, userSetting);
    var clipper = this;
    var baseFaces = _setting.baseFaces;
    var faces = _setting.faces;
    var angle = _setting.angle;
    var sort_vface_list = [];
    var upper_list = [];
     //OA clip Algorithm
     //### Create hface_list ###
     //1. create sort_vface_list (sort by t big->small)
     //2. create upper_list (sort by 2D z)
     //2. for each uppper in upper_list
     //3. create HFACE
     //  3.1 create baseHFace from upper
     //  3.2 for any vface in sort_vface_list
     //  3.3 create tmpHFace from upper to vface
     //  3.4 create tempvface (tempHFace sub vface)
     //  3.5 baseHFace = baseHFace - tempvface
     //  3.6 if baseHFace is become 2 pieces 
     //      3.6.1 baseHFace  = the piece which connect with upper
     //      3.6.2 if baseHFace is null, break for loop; and else, continue to check next vface
     //4. store baseHFACE to hface_list

     //###Add to model###
     //1. add each vface in reverse sort_vface_list to model ()
     //2. add each hface in hface_list to model
     

   function compareFaceT(faceA, faceB) {
     //big -> small
     return faceB.getT() - faceA.getT();
   }

   function compareUpperY(upper1, upper2) {
     //big -> small
     return upper1.points[0].Y - upper2.points[0].Y;
   }

    // console.error("==sort_vface_list=======")
    // $.each(sort_vface_list, function(i, t) {
    //     console.error("t: " + t.getT());
    // });

    // console.error("==sort_vface_list reverse=======")
    // sort_vface_list.reverse(compareT);
    // $.each(sort_vface_list, function(i, t) {
    //     console.error("t: " + t.getT());
    // });

    var init = function(){
        //step 1
        sort_vface_list = faces.slice(0);
        sort_vface_list.sort(compareFaceT);

        // $.each(sort_vface_list, function(i, t) {
           
        // });


        // $.each(sort_vface_list, function(i, t) {
        //     console.error("t: " + t.getT());
        // });

        //step 2
        $.each(sort_vface_list, function(i, f){
            var upper2Ds = f.getUpper2Ds();
            if(upper2Ds){
                $.each(upper2Ds, function(j, upper){
                    upper_list.push({points: upper, t: f.getT()});
                });
            }
        });
        upper_list.sort(compareUpperY);
        // console.error("==upper_list=======")
        // $.each(upper_list, function(i, t) {
        //     console.error("t: " + t.points[0].Y);
        // });


        return clipper;
    };

    this.doClip = function(){
        for(var i=0; i< baseFaces.length; i++){
            baseFaces[i].setAngle(angle);
            clipper.push(baseFaces[i]);
        }

        for(var i=0; i< faces.length; i++){
            faces[i].setAngle(angle);
            clipper.push(faces[i]);
        }

        return true;
    };
    return init();
};

OA.Clipper.prototype = Object.create(Array.prototype);
