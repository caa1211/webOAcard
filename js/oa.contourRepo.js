OA.ContourRepo = function(userSetting) {
    Array.call(this);
    var repo = this;
    var curr = 0;
    var counter = 0;
    var init = function() {
        return repo;
    };

    this.setIndex = function(p3ds){
        if (p3ds.cid != null) {
            curr = p3ds.cid;
        }
    }
    this.push = function(p3ds) {
        var original = Array.prototype.push;
        if (p3ds.cid != null) {
            return;
        }
        original.apply(this, arguments);
        curr = repo.length;
        p3ds.cid = curr;
    };

    this.getBefore = function() {
        if (curr > 0) {
            curr = curr -1;
            var res = repo[curr];
            if (res) {
                return res;
            } else {
                curr = 0;
                return null;
            }
        }else{
            return repo[0];
        }
    };

    this.getAfter = function() {
        if (curr <  repo.length-1) {
            curr = curr +1;
            var res = repo[curr];
            if (res) {
                return res;
            } else {
                curr = repo.length-1;
                return null;
            }
        }else{
            return repo[repo.length-1];
        }

        // var res = repo[curr + 1];
        // if (res) {
        //     return res;
        // } else {
        //     curr = repo.length - 1;
        //     return null;
        // }
    };


    return init();
};


OA.ContourRepo.prototype = Object.create(Array.prototype);