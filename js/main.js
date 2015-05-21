// Main --------------------------------------------------------
/* exported main, updateGuiInfo */

var gui, gui_info, gui_settings;

function main() {

	var neuralNet = window.neuralNet = new NeuralNetwork();
	scene.add( neuralNet.meshComponents );

	initGui();

	run();

}
