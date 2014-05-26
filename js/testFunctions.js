

//preview
var _aspectResize = function(srcUrl, dstW, dstH, callback) {
    // to compute the width/height while keeping aspect
    var cpuScaleAspect = function(maxW, maxH, curW, curH) {
            var ratio = curH / curW;
            if (curW >= maxW && ratio <= 1) {
                curW = maxW;
                curH = maxW * ratio;
            } else if (curH >= maxH) {
                curH = maxH;
                curW = maxH / ratio;
            }
            return {
                width: curW,
                height: curH
            };
        }
        // callback once the image is loaded
    var __bind = function(fn, me) {
        return function() {
            return fn.apply(me, arguments);
        };
    };
    var onLoad = __bind(function() {
        // init the canvas
        var canvas = document.createElement('canvas');
        canvas.width = dstW;
        canvas.height = dstH;
        var ctx = canvas.getContext('2d');

        // TODO is this needed
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // scale the image while preserving the aspect
        var scaled = cpuScaleAspect(canvas.width, canvas.height, image.width, image.height);

        // actually draw the image on canvas
        var offsetX = (canvas.width - scaled.width) / 2;
        var offsetY = (canvas.height - scaled.height) / 2;
        ctx.drawImage(image, offsetX, offsetY, scaled.width, scaled.height);

        // dump the canvas to an URL        
        var mimetype = "image/png";
        var newDataUrl = canvas.toDataURL(mimetype);
        // notify the url to the caller
        callback && callback(newDataUrl)
    }, this);

    // Create new Image object
    var image = new Image();
    image.onload = onLoad;
    image.src = srcUrl;
}

