uniform sampler2D texture;
uniform float opacity;

varying vec3 vColor;

void main() {

	gl_FragColor = vec4( vColor , opacity );
	gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );

}
