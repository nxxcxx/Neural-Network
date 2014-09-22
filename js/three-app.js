

(function main() { "use strict";

	// Neuron ----------------------------------------------------------------

		function Neuron(x, y, z) {

			this.connection = [];
			this.recievedSignal = false;
			this.lastSignalRelease = 0;
			this.releaseDelay = 0;
			this.fired = false;
			this.firedCount = 0;
			this.prevReleaseAxon = null;
			THREE.Vector3.call(this, x, y, z);

		}

		Neuron.prototype = Object.create(THREE.Vector3.prototype);

		Neuron.prototype.connectNeuronTo = function (neuronB) {

			var neuronA = this;
			// create axon and establish connection
			var axon = new Axon(neuronA, neuronB);
			neuronA.connection.push( new Connection(axon, 'A') );
			neuronB.connection.push( new Connection(axon, 'B') );
			return axon;

		};

		Neuron.prototype.createSignal = function (particlePool, minSpeed, maxSpeed) {

			this.firedCount += 1;
			this.recievedSignal = false;

			var signals = [];
			// create signal to all connected axons
			for (var i=0; i<this.connection.length; i++) {
				if (this.connection[i].axon !== this.prevReleaseAxon) {
					var c = new Signal(particlePool, minSpeed, maxSpeed);
					c.setConnection(this.connection[i]);
					signals.push(c);
				}
			}
			return signals;

		};

	// Signal ----------------------------------------------------------------

		function Signal(particlePool, minSpeed, maxSpeed) {

			this.minSpeed = minSpeed;
			this.maxSpeed = maxSpeed;
			this.speed = THREE.Math.randFloat(this.minSpeed, this.maxSpeed);
			this.alive = true;
			this.t = null;
			this.startingPoint = null;
			this.axon = null;
			this.particle = particlePool.getParticle();
			THREE.Vector3.call(this);

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
			// pos = this.axon.getPointAt(this.t);	// uniform point distribution but slower calculation

			this.particle.set(pos.x, pos.y, pos.z);

		};

	// Particle Pool ---------------------------------------------------------

		function ParticlePool(poolSize) {

			this.spriteTextureSignal = THREE.ImageUtils.loadTexture( "sprites/electric.png" );

			this.poolSize = poolSize;
			this.pGeom = new THREE.Geometry();
			this.particles = this.pGeom.vertices;

			this.offScreenPos = new THREE.Vector3(9999, 9999, 9999);	// #CM0A r68 PointCloud default frustumCull = true(extended from Object3D), so need to set to 'false' for this to work with oppScreenPos, else particles will dissappear

			this.pColor = 0xff4400;
			this.pSize = 0.6;

			for (var ii=0; ii<this.poolSize; ii++) {
				this.particles[ii] = new Particle(this);
			}

			// inner particle
			this.pMat = new THREE.PointCloudMaterial({
				map: this.spriteTextureSignal,
				size: this.pSize,
				color: this.pColor,
				blending: THREE.AdditiveBlending,
				depthTest: false,
				transparent: true
			});

			this.pMesh = new THREE.PointCloud(this.pGeom, this.pMat);
			this.pMesh.frustumCulled = false; // ref: #CM0A

			scene.add(this.pMesh);


			// outer particle glow
			this.pMat_outer = new THREE.PointCloudMaterial({
				map: this.spriteTextureSignal,
				size: this.pSize*10,
				color: this.pColor,
				blending: THREE.AdditiveBlending,
				depthTest: false,
				transparent: true,
				opacity: 0.025
			});

			this.pMesh_outer = new THREE.PointCloud(this.pGeom, this.pMat_outer);
			this.pMesh_outer.frustumCulled = false; // ref:#CM0A

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

			// inner particle
			this.pMat.color.setHex(this.pColor);
			this.pMat.size = this.pSize;
			// outer particle
			this.pMat_outer.color.setHex(this.pColor);
			this.pMat_outer.size = this.pSize*10;

		};

	// Particle --------------------------------------------------------------
		// Private class for particle pool

		function Particle(particlePool) {

			this.particlePool = particlePool;
			this.available = true;
			THREE.Vector3.call(this, particlePool.offScreenPos.x, particlePool.offScreenPos.y, particlePool.offScreenPos.z);

		}

		Particle.prototype = Object.create(THREE.Vector3.prototype);

		Particle.prototype.free = function () {

			this.available = true;
			this.set(this.particlePool.offScreenPos.x, this.particlePool.offScreenPos.y, this.particlePool.offScreenPos.z);

		};

	// Axon ------------------------------------------------------------------

		function Axon(neuronA, neuronB) {

			this.bezierSubdivision = 8;
			this.neuronA = neuronA;
			this.neuronB = neuronB;
			this.cpLength = neuronA.distanceTo(neuronB) / THREE.Math.randFloat(1.5, 4.0);
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

			var dirVec = new THREE.Vector3().copy(v2).sub(v1).normalize();
			var northPole = new THREE.Vector3(0, 0, 1);	// this is original axis where point get sampled
			var axis = new THREE.Vector3().crossVectors(northPole, dirVec).normalize();	// get axis of rotation from original axis to dirVec
			var axisTheta = dirVec.angleTo(northPole);	// get angle
			var rotMat = new THREE.Matrix4().makeRotationAxis(axis, axisTheta);	// build rotation matrix

			var minz = Math.cos( THREE.Math.degToRad(45) );	// cone spread in degrees
			var z = THREE.Math.randFloat(minz, 1);
			var theta = THREE.Math.randFloat(0, Math.PI*2);
			var r = Math.sqrt(1-z*z);
			var cpPos = new THREE.Vector3( r * Math.cos(theta), r * Math.sin(theta), z );
			cpPos.multiplyScalar(this.cpLength);	// length of cpPoint
			cpPos.applyMatrix4(rotMat);	// rotate to dirVec
			cpPos.add(v1);	// translate to v1
			return cpPos;

		};

	// Connection ------------------------------------------------------------
		function Connection(axon, startingPoint) {
			this.axon = axon;
			this.startingPoint = startingPoint;
		}

	// Neural Network --------------------------------------------------------

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
			this.axonOpacityMultiplier = 1.0;
			this.axonColor = 0x0099ff;
			this.axonGeom = new THREE.BufferGeometry();
			this.axonPositions = [];
			this.axonIndices = [];
			this.axonNextPositionsIndex = 0;

			this.shaderUniforms = {
				color:             { type: 'c', value: new THREE.Color( this.axonColor ) },
				opacityMultiplier: { type: 'f', value: 1.0 }
			};

			this.shaderAttributes = {
				opacityAttr:       { type: 'f', value: [] }
			};

			// neuron
			this.neuronSize = 0.7;
			this.spriteTextureNeuron = THREE.ImageUtils.loadTexture( "sprites/electric.png" );
			this.neuronColor = 0x00ffff;
			this.neuronOpacity = 1.0;
			this.neuronsGeom = new THREE.Geometry();
			this.neuronMaterial = new THREE.PointCloudMaterial({
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
			this.initNeuralNetwork();

		}

		NeuralNetwork.prototype.initNeuralNetwork = function () {

			// obj loader
			var self = this;
			var loadedMesh, loadedMeshVertices;
			var loader = new THREE.OBJLoader();

			loader.load('models/brain_vertex_low.obj', function constructNeuralNetwork(loadedObject) {

				loadedMesh = loadedObject.children[0];
				loadedMeshVertices = loadedMesh.geometry.vertices;

				self.initNeurons(loadedMeshVertices);
				self.initAxons();

				self.initialized = true;

				console.log('Neural Network initialized');
				document.getElementById('loading').style.display = 'none';	// hide loading animation when finish loading model

			}); // end of loader

		};

		NeuralNetwork.prototype.initNeurons = function (inputVertices) {

			for (var i=0; i<inputVertices.length; i+=this.verticesSkipStep) {
				var pos = inputVertices[i];
				var n = new Neuron(pos.x, pos.y, pos.z);
				this.allNeurons.push(n);
				this.neuronsGeom.vertices.push(n);
			}

			// neuron mesh
			this.neuronParticles = new THREE.PointCloud(this.neuronsGeom, this.neuronMaterial);
			scene.add(this.neuronParticles);

		};

		NeuralNetwork.prototype.initAxons = function () {

			var allNeuronsLength = this.allNeurons.length;
			for (var j=0; j<allNeuronsLength; j++) {
				var n1 = this.allNeurons[j];
				for (var k=j+1; k<allNeuronsLength; k++) {
					var n2 = this.allNeurons[k];
					// connect neuron if distance ... and limit connection per neuron to not more than x
					if (n1 !== n2 && n1.distanceTo(n2) < this.maxAxonDist &&
						n1.connection.length < this.maxConnectionPerNeuron &&
						n2.connection.length < this.maxConnectionPerNeuron)
					{
						var connectedAxon = n1.connectNeuronTo(n2);
						this.constructAxonArrayBuffer(connectedAxon);
					}
				}
			}

			// *** attirbute size must bigger than its content ***
			var axonIndices = new Uint32Array(this.axonIndices.length);
			var axonPositions = new Float32Array(this.axonPositions.length);
			var axonOpacities = new Float32Array(this.shaderAttributes.opacityAttr.value.length);

			// transfer temp-array to arrayBuffer
			transferToArrayBuffer(this.axonIndices, axonIndices);
			transferToArrayBuffer(this.axonPositions, axonPositions);
			transferToArrayBuffer(this.shaderAttributes.opacityAttr.value, axonOpacities);

			function transferToArrayBuffer(fromArr, toArr) {
				for (i=0; i<toArr.length; i++) {
					toArr[i] = fromArr[i];
				}
			}

			this.axonGeom.addAttribute( 'index', new THREE.BufferAttribute(axonIndices, 1) );
			this.axonGeom.addAttribute( 'position', new THREE.BufferAttribute(axonPositions, 3) );
			this.axonGeom.addAttribute( 'opacityAttr', new THREE.BufferAttribute(axonOpacities, 1) );


			// axons mesh
			this.shaderMaterial = new THREE.ShaderMaterial( {
				uniforms:       this.shaderUniforms,
				attributes:     this.shaderAttributes,
				vertexShader:   document.getElementById('vertexshader-axon').textContent,
				fragmentShader: document.getElementById('fragmentshader-axon').textContent,
				blending:       THREE.AdditiveBlending,
				// depthTest:      false,
				transparent:    true
			});

			this.axonMesh = new THREE.Line(this.axonGeom, this.shaderMaterial, THREE.LinePieces);

			scene.add(this.axonMesh);

		};

		NeuralNetwork.prototype.update = function () {

			if (!this.initialized) return;

			
			var n, ii;
			var currentTime = Date.now();

			// update neurons state and release signal
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

			// reset all neurons and when there is X signal
			if (this.allSignals.length <= 0) {

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

		// add vertices to temp-arrayBuffer, generate temp-indexBuffer and temp-opacityArrayBuffer 
		NeuralNetwork.prototype.constructAxonArrayBuffer = function (axon) {
			this.allAxons.push(axon);
			var vertices = axon.geom.vertices;
			var numVerts = vertices.length;

			// &&&&&&&&&&&&&&&&&&&&&^^^^^^^^^^^^^^^^^^^^^
			// var opacity = THREE.Math.randFloat(0.001, 0.1);

			for (var i=0; i<numVerts; i++) {

				this.axonPositions.push(vertices[i].x, vertices[i].y, vertices[i].z);

				if ( i < numVerts-1 ) {
					var idx = this.axonNextPositionsIndex;
					this.axonIndices.push(idx, idx+1);

					var opacity = THREE.Math.randFloat(0.002, 0.2);
					this.shaderAttributes.opacityAttr.value.push(opacity, opacity);

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

			this.neuronMaterial.opacity = this.neuronOpacity;
			this.neuronMaterial.color.setHex(this.neuronColor);
			this.neuronMaterial.size = this.neuronSize;

			this.shaderUniforms.color.value.set(this.axonColor);
			this.shaderUniforms.opacityMultiplier.value = this.axonOpacityMultiplier;

			this.particlePool.updateSettings();
		};

	// Main ------------------------------------------------------------------

		if (!Detector.webgl) {
			Detector.addGetWebGLMessage();
			document.getElementById('loading').style.display = 'none';	// hide loading animation when finish loading model
		}

		var container, stats;
		var scene, camera, cameraCtrl, renderer;

		// ---- scene
		container = document.getElementById('canvas-container');
		scene = new THREE.Scene();

		// ---- camera
		camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 2000);
		// camera orbit control
		cameraCtrl = new THREE.OrbitControls(camera, container);
		cameraCtrl.object.position.y = 150;
		cameraCtrl.update();

		// ---- renderer
		renderer = new THREE.WebGLRenderer({antialias: true , alpha: false});
		renderer.setSize(window.innerWidth, window.innerHeight);
		container.appendChild(renderer.domElement);

		// ---- stats
		stats = new Stats();
		container.appendChild( stats.domElement );

		// ---- scene settings
		var scene_settings = {
			pause: false,
			bgColor: 0x0d0d0f
		};

		// Neural Net
		var neuralNet = window.neuralNet = new NeuralNetwork();


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
		gui_settings.add(neuralNet, 'axonOpacityMultiplier', 0.0, 5.0).name('Axon Opacity Mult');
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

	window.addEventListener('resize', function onWindowResize() {
		var w = window.innerWidth;
		var h = window.innerHeight;
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
		renderer.setSize(w, h);
	}, false);

}());
