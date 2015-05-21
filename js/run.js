// Run --------------------------------------------------------

function update() {

	updateHelpers();

	if ( !sceneSettings.pause ) {

		neuralNet.update();

		// if ( FRAME_COUNT % 60 == 0 ) {
			// PROFILER.report();
		// }

		updateGuiInfo();

	}

}


// ----  draw loop
function run() {

	requestAnimationFrame( run );
	renderer.setClearColor( sceneSettings.bgColor, 1 );
	renderer.clear();
	update();
	renderer.render( scene, camera );
	stats.update();
	FRAME_COUNT ++;

}
