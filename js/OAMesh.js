/**
 * @author mrdoob / http://mrdoob.com/
 * based on http://papervision3d.googlecode.com/svn/trunk/as3/trunk/src/org/papervision3d/objects/primitives/Plane.as
 */

THREE.OAMesh = function ( geometry, material ) {
    THREE.Mesh.call( this, geometry, material );
    this.oa = {
    	type: "",
    	depth: 0
    };
	return 0;
};

THREE.OAMesh.prototype = Object.create( THREE.Mesh.prototype );
