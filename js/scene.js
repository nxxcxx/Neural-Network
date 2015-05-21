// Scene --------------------------------------------------------
/* exported updateHelpers */

if ( !Detector.webgl ) {
	Detector.addGetWebGLMessage();
}

var container, stats;
var scene, light, camera, cameraCtrl, renderer;
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
var pixelRatio = window.devicePixelRatio || 1;
var screenRatio = WIDTH / HEIGHT;
var clock = new THREE.Clock();
var FRAME_COUNT = 0;

// ---- Settings
var sceneSettings = {

	pause: false,
	bgColor: 0x111113,
	enableGridHelper: false,
	enableAxisHelper: false

};

// ---- Scene
container = document.getElementById( 'canvas-container' );
scene = new THREE.Scene();

// ---- Camera
camera = new THREE.PerspectiveCamera( 75, screenRatio, 10, 5000 );
// camera orbit control
cameraCtrl = new THREE.OrbitControls( camera, container );
cameraCtrl.object.position.y = 150;
cameraCtrl.update();

// ---- Renderer
renderer = new THREE.WebGLRenderer( {
	antialias: true,
	alpha: true
} );
renderer.setSize( WIDTH, HEIGHT );
renderer.setPixelRatio( pixelRatio );
renderer.setClearColor( sceneSettings.bgColor, 1 );
renderer.autoClear = false;
container.appendChild( renderer.domElement );

// ---- Stats
stats = new Stats();
container.appendChild( stats.domElement );

// ---- grid & axis helper
var gridHelper = new THREE.GridHelper( 600, 50 );
gridHelper.setColors( 0x00bbff, 0xffffff );
gridHelper.material.opacity = 0.1;
gridHelper.material.transparent = true;
gridHelper.position.y = -300;
scene.add( gridHelper );

var axisHelper = new THREE.AxisHelper( 50 );
scene.add( axisHelper );

function updateHelpers() {
	axisHelper.visible = sceneSettings.enableAxisHelper;
	gridHelper.visible = sceneSettings.enableGridHelper;
}

/*
// ---- Lights
// back light
light = new THREE.DirectionalLight( 0xffffff, 0.8 );
light.position.set( 100, 230, -100 );
scene.add( light );

// hemi
light = new THREE.HemisphereLight( 0x00ffff, 0x29295e, 1 );
light.position.set( 370, 200, 20 );
scene.add( light );

// ambient
light = new THREE.AmbientLight( 0x111111 );
scene.add( light );
*/
