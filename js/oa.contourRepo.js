OA.ContourRepo = function(userSetting) {
    Array.call(this);
    var repo = this;
    var curr = 0;
    var counter = 0;
    var init = function() {
        return repo;
    };

    this.push = function(p3ds) {
        var original = Array.prototype.push;
        if (p3ds.cid != null) {

            return;
        }
        original.apply(this, arguments);
        curr = repo.length - 1;
        p3ds.cid = curr;

    };

    this.getBefore = function() {

        var res = repo[curr];
        if (res) {
            if (curr > 0) {
                curr = curr - 1;
            }
            return res;
        } else {
            curr = 0;
            return null;
        }
    };

    this.getAfter = function() {
        var res = repo[curr + 1];
        if (res) {
            if (curr < repo.length - 2) {
                curr = curr + 1;
            }
            return res;
        } else {
            curr = repo.length - 1;
            return null;
        }
    };


    return init();
};


OA.ContourRepo.prototype = Object.create(Array.prototype);