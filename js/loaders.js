// Loaders --------------------------------------------------------

var loadingManager = new THREE.LoadingManager();
loadingManager.onLoad = function () {

	document.getElementById( 'loading' ).style.display = 'none'; // hide loading animation when finish loading model
	console.log( 'Done.' );

	main();

};


loadingManager.onProgress = function ( item, loaded, total ) {

	console.log( loaded + '/' + total, item );

};


var shaderLoader = new THREE.XHRLoader( loadingManager );
shaderLoader.setResponseType( 'text' );
shaderLoader.showStatus = true;

shaderLoader.loadMultiple = function ( shaderContainer, urlObj ) {

	_.each( urlObj, function ( value, key ) {

		shaderLoader.load( value, function ( shader ) {

			shaderContainer[ key ] = shader;

		} );

	} );

};

var shaderContainer = {};
shaderLoader.loadMultiple( shaderContainer, {

	neuronVert: 'shaders/neuron.vert',
	neuronFrag: 'shaders/neuron.frag',

	axonVert: 'shaders/axon.vert',
	axonFrag: 'shaders/axon.frag'

} );



var OBJ = {};
var OBJloader = new THREE.OBJLoader( loadingManager );

OBJloader.load( 'models/brain_vertex_low.obj', function ( model ) {

	mesh = model.children[ 0 ];
	OBJ.brain = mesh;

} ); // end of loader
