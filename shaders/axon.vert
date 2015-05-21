uniform float opacityMultiplier;

attribute float opacity;

varying float vOpacity;

void main() {

	vOpacity = opacity * opacityMultiplier;

	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0 );

}
