// Axon extends THREE.CubicBezierCurve3 ------------------------------------------------------------------
/* exported Axon, Connection */

function Axon( neuronA, neuronB ) {

	this.bezierSubdivision = 8;
	this.neuronA = neuronA;
	this.neuronB = neuronB;
	this.cpLength = neuronA.distanceTo( neuronB ) / THREE.Math.randFloat( 1.5, 4.0 );
	this.controlPointA = this.getControlPoint( neuronA, neuronB );
	this.controlPointB = this.getControlPoint( neuronB, neuronA );
	THREE.CubicBezierCurve3.call( this, this.neuronA, this.controlPointA, this.controlPointB, this.neuronB );

	this.vertices = this.getSubdividedVertices();

}

Axon.prototype = Object.create( THREE.CubicBezierCurve3.prototype );

Axon.prototype.getSubdividedVertices = function () {
	return this.getSpacedPoints( this.bezierSubdivision );
};

// generate uniformly distribute vector within x-theta cone from arbitrary vector v1, v2
Axon.prototype.getControlPoint = function ( v1, v2 ) {

	var dirVec = new THREE.Vector3().copy( v2 ).sub( v1 ).normalize();
	var northPole = new THREE.Vector3( 0, 0, 1 ); // this is original axis where point get sampled
	var axis = new THREE.Vector3().crossVectors( northPole, dirVec ).normalize(); // get axis of rotation from original axis to dirVec
	var axisTheta = dirVec.angleTo( northPole ); // get angle
	var rotMat = new THREE.Matrix4().makeRotationAxis( axis, axisTheta ); // build rotation matrix

	var minz = Math.cos( THREE.Math.degToRad( 45 ) ); // cone spread in degrees
	var z = THREE.Math.randFloat( minz, 1 );
	var theta = THREE.Math.randFloat( 0, Math.PI * 2 );
	var r = Math.sqrt( 1 - z * z );
	var cpPos = new THREE.Vector3( r * Math.cos( theta ), r * Math.sin( theta ), z );
	cpPos.multiplyScalar( this.cpLength ); // length of cpPoint
	cpPos.applyMatrix4( rotMat ); // rotate to dirVec
	cpPos.add( v1 ); // translate to v1
	return cpPos;

};

// Connection ------------------------------------------------------------
function Connection( axon, startingPoint ) {
	this.axon = axon;
	this.startingPoint = startingPoint;
}
