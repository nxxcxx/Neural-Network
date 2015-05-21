uniform vec3 color;

varying float vOpacity;

void main() {

	gl_FragColor = vec4(color, vOpacity);

}
