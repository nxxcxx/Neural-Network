

(function main() {

	if (!Detector.webgl) Detector.addGetWebGLMessage();
	
	var Vec3 = THREE.Vector3;

	var container, stats, controls;
	var scene, light, camera, renderer;

	// scene
	container = document.getElementById('canvas-container');
	scene = new THREE.Scene();

	// camera
	camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 2000);
	// camera orbit control
	cameraCtrl = new THREE.OrbitControls(camera, container);
	cameraCtrl.object.position.y = 150;
	cameraCtrl.update();

	// renderer
	renderer = new THREE.WebGLRenderer({antialias: true , alpha: false});
	renderer.setSize(window.innerWidth, window.innerHeight);
	container.appendChild(renderer.domElement);

	stats = new Stats();
	container.appendChild( stats.domElement );

	// grid helper
	// var grid = new THREE.GridHelper(600, 50);
	// grid.setColors(0x00bbff, 0xffffff);
	// grid.material.opacity = 0.1;
	// grid.material.transparent = true;
	// grid.position.y = -300;
	// scene.add(grid);

	// Lights
		// top right
		// light = new THREE.DirectionalLight(0xE6EDF2, 0.8);
		// light.position.set(50, 150, 100).normalize();
		// scene.add(light);

		// // hemi
		// light = new THREE.HemisphereLight(0xE6EDF2, 0x000000, 1);
		// scene.add(light);

		// light = new THREE.AmbientLight(0x404040);
		// scene.add(light);


	// ------------------------------------------------------------------- Neuron --------------------------------------------------------------
	
	function Neuron(x, y, z) {
		THREE.Vector3.call(this, x, y, z);
		this.connection = [];
		this.recievedSignal = false;
		this.lastSignalRelease = 0;
		this.releaseDelay = 0;
		this.fired = false;
		this.firedCount = 0;
		this.prevReleaseAxon = null;
	}

	Neuron.prototype = Object.create(THREE.Vector3.prototype);

	Neuron.prototype.connectNeuronTo = function (neuronB) {
		var neuronA = this;
		var axon = new Axon(neuronA, neuronB);
		var connA = new Connection(axon, 'A');
		var connB = new Connection(axon, 'B');
		neuronA.connection.push(connA);
		neuronB.connection.push(connB);
		return axon;
	};

	Neuron.prototype.createSignal = function (particlePool, minSpeed, maxSpeed) {

		this.firedCount += 1;

		this.recievedSignal = false;

		var signals = [];

		//* create to all axons
		for (var i=0; i<this.connection.length; i++) {
			if (this.connection[i].axon !== this.prevReleaseAxon) {
				var c = new Signal(particlePool, minSpeed, maxSpeed);
				c.setConnection(this.connection[i]);
				signals.push(c);
			}
		}

		return signals;
	};
	
	// -------------------------------------------------------------------- Signal -------------------------------------------------------------

	var spriteTextureSignal = THREE.ImageUtils.loadTexture( "sprites/electric.png" );

	function Signal(particlePool, minSpeed, maxSpeed) {
		THREE.Vector3.call(this);
		this.minSpeed = minSpeed;
		this.maxSpeed = maxSpeed;
		this.speed = THREE.Math.randFloat(this.minSpeed, this.maxSpeed);
		this.alive = true;
		this.t = null;
		this.startingPoint = null;
		this.axon = null;
		this.particle = particlePool.getParticle();
	}

	Signal.prototype = Object.create(THREE.Vector3.prototype);

	Signal.prototype.setConnection = function (Connection) {
		this.startingPoint = Connection.startingPoint;
		this.axon = Connection.axon;
		if (this.startingPoint === 'A') this.t = 0;
		else if (this.startingPoint === 'B') this.t = 1;
	};

	Signal.prototype.travel = function () {
		var pos;
		if (this.startingPoint === 'A') {
			this.t += this.speed;
			if (this.t>=1) {
				this.t = 1;
				this.alive = false;
				this.axon.neuronB.recievedSignal = true;
				this.axon.neuronB.prevReleaseAxon = this.axon;
			}

		} else if (this.startingPoint === 'B') {
			this.t -= this.speed;
			if (this.t<=0) {
				this.t = 0;
				this.alive = false;
				this.axon.neuronA.recievedSignal = true;
				this.axon.neuronA.prevReleaseAxon = this.axon;
			}
		}

		pos = this.axon.getPoint(this.t);
		// pos = this.axon.getPointAt(this.t);	// uniform speed but slower calculation
		this.particle.set(pos.x, pos.y, pos.z);
	};


	// ------------------------------------------ Particle Pool -------------------------------------------------------

	function ParticlePool(poolSize) {

		this.poolSize = poolSize;
		this.pGeom = new THREE.Geometry();
		this.particles = this.pGeom.vertices;

		this.offScreenPos = new Vec3(9999, 9999, 9999);

		this.pColor = 0x0077ff;
		this.pSize = 0.6;

		for (var ii=0; ii<this.poolSize; ii++) {
			this.particles[ii] = new Particle(this);
		}

		this.pMat = new THREE.ParticleSystemMaterial({ 
			map: spriteTextureSignal, 
			size: this.pSize,
			color: this.pColor,
			blending: THREE.AdditiveBlending,
			depthTest: false,
			transparent: true
		});

		this.pMesh = new THREE.ParticleSystem(this.pGeom, this.pMat);

		scene.add(this.pMesh);


		// outer particle glow
		this.pMat_outer = new THREE.ParticleSystemMaterial({ 
			map: spriteTextureSignal, 
			size: this.pSize*10,
			color: this.pColor,
			blending: THREE.AdditiveBlending,
			depthTest: false,
			transparent: true,
			opacity: 0.025
		});

		this.pMesh_outer = new THREE.ParticleSystem(this.pGeom, this.pMat_outer);

		scene.add(this.pMesh_outer);

	}

	ParticlePool.prototype.getParticle = function () {
		for (var ii=0; ii<this.poolSize; ii++) {
			var p = this.particles[ii];
			if (p.available) {
				p.available = false;
				return p;
			}
		}
		return null;
	};

	ParticlePool.prototype.update = function () {
		this.pGeom.verticesNeedUpdate = true;
	};

	ParticlePool.prototype.updateSettings = function () {
		this.pMat.color.setHex(this.pColor);
		this.pMat.size = this.pSize;

		this.pMat_outer.color.setHex(this.pColor);
		this.pMat_outer.size = this.pSize*10;
	};


	//------------------------------------------ Particle -------------------------------------------------------
	// Private class for particle pool

	function Particle(particlePool) {
		THREE.Vector3.call(this, particlePool.offScreenPos.x, particlePool.offScreenPos.y, particlePool.offScreenPos.z);
		this.particlePool = particlePool;
		this.available = true;
	}

	Particle.prototype = Object.create(THREE.Vector3.prototype);

	Particle.prototype.free = function () {
		this.available = true;
		this.set(this.particlePool.offScreenPos.x, this.particlePool.offScreenPos.y, this.particlePool.offScreenPos.z);
	};



	// -------------------------------------------------------------------- Axon -------------------------------------------------------------

	function Axon(neuronA, neuronB) {
		this.bezierSubdivision = 12;
		this.neuronA = neuronA;
		this.neuronB = neuronB;
		this.cpLength = neuronA.distanceTo(neuronB) / 3.0;
		this.controlPointA = this.getControlPoint(neuronA, neuronB);
		this.controlPointB = this.getControlPoint(neuronB, neuronA);
		THREE.CubicBezierCurve3.call(this, this.neuronA, this.controlPointA, this.controlPointB, this.neuronB);
		this.geom = new THREE.Geometry();
		this.geom.vertices = this.calculateVertices();
	}

	Axon.prototype = Object.create(THREE.CubicBezierCurve3.prototype);

	Axon.prototype.calculateVertices = function () {
		return this.getSpacedPoints(this.bezierSubdivision);
	};

	// generate uniformly distribute vector within x-theta cone from arbitrary vector v1, v2
	Axon.prototype.getControlPoint = function (v1, v2) {

		var dirVec = new Vec3().copy(v2).sub(v1).normalize();
		var northPole = new Vec3(0, 0, 1);	// this is original axis where point get sampled
		var axis = new Vec3().crossVectors(northPole, dirVec).normalize();	// get axis of rotation forn original axis to dirVec
		var axisTheta = dirVec.angleTo(northPole);	// get angle
		var rotMat = new THREE.Matrix4().makeRotationAxis(axis, axisTheta);	// build rotation matrix

		var minz = Math.cos( THREE.Math.degToRad(45) );	// cone spread in degrees
		var z = THREE.Math.randFloat(minz, 1);
		var theta = THREE.Math.randFloat(0, Math.PI*2);
		var r = Math.sqrt(1-z*z);
		var cpPos = new Vec3( r * Math.cos(theta), r * Math.sin(theta), z );
		cpPos.multiplyScalar(this.cpLength);	// length of cpPoint
		cpPos.applyMatrix4(rotMat);	// rotate to dirVec
		cpPos.add(v1);	// translate to v1
		return cpPos;

	};

	// -------------------------------------------------------------------- Connection -------------------------------------------------------------
	function Connection(axon, startingPoint) {
		this.axon = axon;
		this.startingPoint = startingPoint;
	}

	// -------------------------------------------------------------------- Neural Network -------------------------------------------------------------

	function NeuralNetwork() {

		this.initialized = false;

		// settings
		this.verticesSkipStep = 2;	//2
		this.maxAxonDist = 8;	//8
		this.maxConnectionPerNeuron = 6;	//6

		this.currentMaxSignals = 8000;
		this.limitSignals = 12000;
		this.particlePool = new ParticlePool(this.limitSignals);	// *************** ParticlePool must bigger than limit Signal ************

		this.signalMinSpeed = 0.035;
		this.signalMaxSpeed = 0.065;

		// NN component containers
		this.allNeurons = [];
		this.allSignals = [];
		this.allAxons = [];

		// axon 
		this.axonOpacity = 0.09;
		this.axonColor = 0xaaddff;
		this.axonGeom = new THREE.BufferGeometry();
		this.axonMat = new THREE.LineBasicMaterial( { 
			color: this.axonColor, 
			linewidth: 1, 
			opacity: this.axonOpacity, 
			transparent: true,
			blending: THREE.AdditiveBlending
		} );
		this.axonPositions = [];
		this.axonIndices = [];
		this.axonNextPositionsIndex = 0;

		// neuron
		this.neuronSize = 0.7;
		this.spriteTextureNeuron = THREE.ImageUtils.loadTexture( "sprites/electric.png" );
		this.neuronColor = 0x0088ff;
		this.neuronOpacity = 1.0;
		this.neuronsGeom = new THREE.Geometry();
		this.neuronMaterial = new THREE.ParticleSystemMaterial({ 
			map: this.spriteTextureNeuron, 
			size: this.neuronSize, 
			color: this.neuronColor,
			blending: THREE.AdditiveBlending,
			depthTest: false,
			transparent: true,
			opacity: this.neuronOpacity
		});

		// info api
		this.numNeurons = 0;
		this.numAxons = 0;
		this.numSignals = 0;

		// initialize NN
		this.init();

	}

	NeuralNetwork.prototype.init = function () {

		// obj loader
		var self = this;
		var loadedMesh, loadedMeshVertices;
		var loader = new THREE.OBJLoader();

		loader.load('models/brain_low.obj', function (loadedObject) {

			loadedMesh = loadedObject.children[0];
			loadedMeshVertices = loadedMesh.geometry.vertices;

			// render loadedMesh
			// loadedMesh.material = new THREE.MeshBasicMaterial({ 
			// 	transparent: true, 
			// 	opacity: 0.05, 
			// 	depthTest: false,
			// 	color: 0x0088ff,
			// 	blending: THREE.AdditiveBlending
			// });
			// scene.add(loadedObject);

			//------ init neurons

			for (var i=0; i<loadedMeshVertices.length; i+=self.verticesSkipStep) {
				var pos = loadedMeshVertices[i];
				var n = new Neuron(pos.x, pos.y, pos.z);
				self.allNeurons.push(n);
				self.neuronsGeom.vertices.push(n);
			}

			// neuron mesh
			self.neuronParticles = new THREE.ParticleSystem(self.neuronsGeom, self.neuronMaterial);
			scene.add(self.neuronParticles);

			//------ init axons

			var allNeuronsLength = self.allNeurons.length;
			for (var j=0; j<allNeuronsLength; j++) {
				var n1 = self.allNeurons[j];
				for (var k=j+1; k<allNeuronsLength; k++) {
					var n2 = self.allNeurons[k];
					// connect neuron if distance ... and limit connection per neuron to not more than x
					if (n1 !== n2 && n1.distanceTo(n2) < self.maxAxonDist &&
						n1.connection.length < self.maxConnectionPerNeuron && 
						n2.connection.length < self.maxConnectionPerNeuron) 
					{
						var connectedAxon = n1.connectNeuronTo(n2);
						self.addAxonToBuffer(connectedAxon);
					}
				}
			}

			// *** attirbute size must bigger than its content ***

			// axons buffer attributes
			var AxonBufferIndicesAttr = new THREE.Uint32Attribute(self.axonIndices.length, 1);
			AxonBufferIndicesAttr.set(self.axonIndices);

			var AxonPositionAttr = new THREE.Float32Attribute(self.axonPositions.length, 3);
			AxonPositionAttr.set(self.axonPositions);

			self.axonGeom.addAttribute('index', AxonBufferIndicesAttr);
			self.axonGeom.addAttribute('position', AxonPositionAttr);

			// axons mesh
			self.axonMesh = new THREE.Line(self.axonGeom, self.axonMat, THREE.LinePieces);
			scene.add(self.axonMesh);

			// ------ end init axons

			self.initialized = true;

		});

	};

	NeuralNetwork.prototype.update = function () {

		if (!this.initialized) return;

		// update neurons state and release signal
		var n, ii;
		var currentTime = Date.now();

		for (ii=0; ii<this.allNeurons.length; ii++) {
			n = this.allNeurons[ii];

			if (this.allSignals.length < this.currentMaxSignals-this.maxConnectionPerNeuron) {		// currentMaxSignals - maxConnectionPerNeuron because allSignals can not bigger than particlePool size

				if (n.recievedSignal && n.firedCount < 8)  {	// Traversal mode
				// if (n.recievedSignal && (currentTime - n.lastSignalRelease > n.releaseDelay) && n.firedCount < 8)  {	// Random mode
				// if (n.recievedSignal && !n.fired )  {	// Single propagation mode

					n.fired = true;
					n.lastSignalRelease = currentTime;
					n.releaseDelay = THREE.Math.randInt(100, 1000);

					this.releaseSignalAt(n);

				}
			}

			n.recievedSignal = false;	// if neuron recieved signal but still in delay reset it
		}

		// reset all neurons and when there is x signal
		if (this.allSignals.length === 0) {

			for (ii=0; ii<this.allNeurons.length; ii++) {	// reset all neuron state
				n = this.allNeurons[ii];
				n.releaseDelay = 0;
				n.fired = false;
				n.recievedSignal = false;
				n.firedCount = 0;
			}
			this.releaseSignalAt(this.allNeurons[THREE.Math.randInt(0, this.allNeurons.length)]);

		}

		// update and remove signals
		for (var j=this.allSignals.length-1; j>=0; j--) {
			var s = this.allSignals[j];
			s.travel();

			if (!s.alive) {
				s.particle.free();
				for (var k=this.allSignals.length-1; k>=0; k--) {
					if (s === this.allSignals[k]) {
						this.allSignals.splice(k, 1);
						break;
					}
				}
			}

		}

		// update particle pool vertices
		this.particlePool.update();

		// update info for GUI
		this.updateInfo();
		
	};

	NeuralNetwork.prototype.addAxonToBuffer = function (axon) {		// add vertices to arrayBuffer and generate indexBuffer
		this.allAxons.push(axon);
		var vertices = axon.geom.vertices;
		var numVerts = vertices.length;

		for (var i=0; i<numVerts; i++) {
			this.axonPositions.push(vertices[i].x, vertices[i].y, vertices[i].z);
			if ( i < numVerts-1 ) {
				var idx = this.axonNextPositionsIndex;
				this.axonIndices.push(idx, idx+1);
			}
			this.axonNextPositionsIndex += 1;
		}
	};

	NeuralNetwork.prototype.releaseSignalAt = function (neuron) {
		var signals = neuron.createSignal(this.particlePool, this.signalMinSpeed, this.signalMaxSpeed);
		for (var ii=0; ii<signals.length; ii++) {
			var s = signals[ii];
			this.allSignals.push(s);
		}
	};

	NeuralNetwork.prototype.updateInfo = function () {
		this.numNeurons = this.allNeurons.length;
		this.numAxons = this.allAxons.length;
		this.numSignals = this.allSignals.length;
	};

	NeuralNetwork.prototype.updateSettings = function () {
		this.axonMat.opacity = this.axonOpacity;
		this.axonMat.color.setHex(this.axonColor);
		this.neuronMaterial.opacity = this.neuronOpacity;
		this.neuronMaterial.color.setHex(this.neuronColor);
		this.neuronMaterial.size = this.neuronSize;
		this.particlePool.updateSettings();
	};

	// --- End of Class NeuralNetwork -------------------------------------------------------------


	// --- Main

	var scene_settings = {
		pause: false,
		bgColor: 0x111113
	};


	var neuralNet = new NeuralNetwork();
	console.log(neuralNet);


	// ---------- GUI ----------

		var gui = new dat.GUI();
		gui.width = 300;

		var gui_info = gui.addFolder('Info');
		gui_info.add(neuralNet, 'numNeurons').name('Neurons');
		gui_info.add(neuralNet, 'numAxons').name('Axons');
		gui_info.add(neuralNet, 'numSignals', 0, neuralNet.limitSignals).name('Signals');
		gui_info.autoListen = false;

		var gui_settings = gui.addFolder('Settings');
		gui_settings.add(neuralNet, 'currentMaxSignals', 0, neuralNet.limitSignals).name('Max Signals');
		gui_settings.add(neuralNet.particlePool, 'pSize', 0.2, 2).name('Signal Size');
		gui_settings.add(neuralNet, 'signalMinSpeed', 0.01, 0.1, 0.01).name('Signal Min Speed');
		gui_settings.add(neuralNet, 'signalMaxSpeed', 0.01, 0.1, 0.01).name('Signal Max Speed');
		gui_settings.add(neuralNet, 'neuronSize', 0, 2).name('Neuron Size');
		gui_settings.add(neuralNet, 'neuronOpacity', 0, 1.0).name('Neuron Opacity');
		gui_settings.add(neuralNet, 'axonOpacity', 0, 0.5).name('Axon Opacity');
		gui_settings.addColor(neuralNet.particlePool, 'pColor').name('Signal Color');
		gui_settings.addColor(neuralNet, 'neuronColor').name('Neuron Color');
		gui_settings.addColor(neuralNet, 'axonColor').name('Axon Color');
		gui_settings.addColor(scene_settings, 'bgColor').name('Background');

		gui_info.open();
		gui_settings.open();

		function updateNeuralNetworkSettings() {
			neuralNet.updateSettings();
		}

		for (var i in gui_settings.__controllers) {
			gui_settings.__controllers[i].onChange(updateNeuralNetworkSettings);
		}

		function updateGuiInfo() {
			for (var i in gui_info.__controllers) {
				gui_info.__controllers[i].updateDisplay(); 
			}
		}


	// ---------- end GUI ----------



	(function run() {

		requestAnimationFrame(run);
		renderer.setClearColor(scene_settings.bgColor, 1);

		if (!scene_settings.pause) {

			neuralNet.update();
			updateGuiInfo();

		}

		renderer.render(scene, camera);
		stats.update();

	})();


	window.addEventListener('keypress', function (event) {
		if (event.keyCode === 32) {	// if spacebar is pressed
			event.preventDefault();
			scene_settings.pause = !scene_settings.pause;
		}
	});

	window.addEventListener('resize', onWindowResize, false);

	function onWindowResize() {
		var w = window.innerWidth;
		var h = window.innerHeight;
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
		renderer.setSize(w, h);
	}

	// utility functions

	function getRandomVector() {
		var v = new Vec3(THREE.Math.randFloatSpread(2), THREE.Math.randFloatSpread(2), THREE.Math.randFloatSpread(2));
		return v.normalize();
	}

}());
