OA.Point = function(userSetting) {

    THREE.Object3D.call(this);
    var colorMap = [0x074CA6, 0xD02C55, 0x5F8A37, 0x498698];
    //private
    var _def = {
        "scale": 1,
        "border": {
            color: colorMap[0],
            opacity: 0.5,
            size: 1.8
        },
        "inner": {
            color: colorMap[0],
            opacity: 1,
            size: 1
        }
    };

    var _setting = $.extend({}, _def, userSetting);
    var point = this;
    var position3D = new THREE.Vector3( -1, -1, -1);
    var borderMaterial;
    var innerMaterial;
    var pointLight = null;
    var $point = $(this);
    var init = function() {
        var movePointSetting = _setting;
        var movePointTexture = OA.Utils.texture.getTexture().movePointTexture;
        var movePointFillTexture = OA.Utils.texture.getTexture().movePointFillTexture;
        var innerSettng = movePointSetting.inner;
        var borderSetting = movePointSetting.border;
        borderMaterial = new THREE.SpriteMaterial({
            map: movePointTexture,
            transparent: true,
            opacity: borderSetting.opacity,
            useScreenCoordinates: false,
            color: borderSetting.color,
            depthTest: false,
            depthWrite: false
        });

        var particle = new THREE.Particle(borderMaterial);
        particle.scale.x = particle.scale.y = particle.scale.z = _setting.scale * borderSetting.size;
        particle.name = "border";
        var particle2 = particle.clone();
        innerMaterial = new THREE.SpriteMaterial({
            map: movePointFillTexture,
            transparent: true,
            opacity: innerSettng.opacity,
            useScreenCoordinates: false,
            color: innerSettng.color,
            depthTest: false,
            depthWrite: false
        });
        particle2.material = innerMaterial;
        particle2.scale.x = particle2.scale.y = particle2.scale.z = _setting.scale * innerSettng.size;
        particle.name = "inner";

        var particles = new THREE.ParticleSystem();
        particles.add(particle);
        particles.add(particle2);
        point.add(particles);


        if (OA.pointLight) {
            pointLight = new THREE.PointLight(0x00ffff, 1, _setting.scale * 6);
            pointLight.position.x = 0;
            pointLight.position.y = _setting.scale;
            pointLight.position.z = _setting.scale;
            point.add(pointLight);
        }
        return point;
    };

    this.isEqualPosition = function(pos){
        if(position3D === undefined){
            return false;
        }
        if(position3D.x === pos.x && 
           position3D.y === pos.y &&
           position3D.z === pos.z){
            return true;
        }else{
            return false;
        }
    };

    this.setPosition3D = function(hoverPos) {
        position3D = hoverPos.clone();
        point.position = hoverPos.clone();
        point.position.z = point.position.z + 0.3;
        $point.trigger("positionChange", position3D);
    };

    this.getPosition3D = function(){
        return position3D;
    };

    this.getPosition2D = function(){
        return new THREE.Vector2(position3D.x, position3D.z - position3D.y);
    };

    this.getT = function(){
        return position3D.z;
    };

    this.setT = function(t){
        position3D.z = t;
        point.position.z = t + 0.3;
        $point.trigger("positionChange", position3D);
    };

    this.setBorderColor = function(color){
        borderMaterial.color.setHex( 0xff0000 );
    };

    this.setColorByIndex = function(index) {
        if (index < colorMap.length) {
            borderMaterial.color.setHex(colorMap[index]);
            innerMaterial.color.setHex(colorMap[index]);
            if(pointLight){
                 pointLight.color.setHex(colorMap[index]);
            }
        }
    };

    this.setColor = function(color) {
        if (color) {
            borderMaterial.color.setHex(color);
            innerMaterial.color.setHex(color);
            if (pointLight) {
                pointLight.color.setHex(color);
            }
        }
    };

    this.setVisible = function(isVisible){
        if (point.isVisible == undefined || point.isVisible != isVisible) {
            OA.Utils.setObject3DVisible(point, isVisible);
            if (pointLight) {
                pointLight.visible = isVisible;
            }
        }

        //debugger;
    };

    return init();
};

OA.Point.prototype = Object.create(THREE.Object3D.prototype);