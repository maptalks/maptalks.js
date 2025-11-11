#if __VERSION__ == 100
  #ifdef GL_OES_standard_derivatives
    #extension GL_OES_standard_derivatives : enable
  #endif
#endif
precision mediump float;
#include <gl2_frag>
varying vec2 vTexCoord;
uniform float rippleRadius;
uniform float density;
uniform float time;

vec3 hash3( vec2 p ) {
    vec3 q = vec3( dot(p,vec2(127.1,311.7)),
				   dot(p,vec2(269.5,183.3)),
				   dot(p,vec2(419.2,371.9)) );
	return fract(sin(q)*43758.5453);
}

float noise( in vec2 x) {
    vec2 v = x * density / 4000.0;
    vec2 p = floor(v);
    vec2 f = fract(v);

	float va = 0.0;
    for( int j=-4; j<=4; j++ )
    for( int i=-4; i<=4; i++ )
    {
        vec2 g = vec2( float(i),float(j) );
		vec3 o = hash3( p + g );
		vec2 r = g - f + o.xy;
		float d = sqrt(dot(r,r));
	    float ripple = max(mix(smoothstep(0.99,0.999,max(cos(d - time * 2. + (o.x + o.y) * 5.0), 0.)), 0., d), 0.);
        va += ripple;
    }

    return va;
}

void main() {
    vec2 uv = vTexCoord;
    float radius = 24.0 / (rippleRadius * 0.01);
    float f = noise( radius * uv) * smoothstep(0.0, 0.4, sin(uv.x*3.151592) * sin(uv.y * 3.141592));
    vec3 normal = vec3(-dFdx(f), -dFdy(f), -dFdy(f));
    glFragColor = vec4(normal, 1.0 );
    #if __VERSION__ == 100
        gl_FragColor = glFragColor;
    #endif
}
