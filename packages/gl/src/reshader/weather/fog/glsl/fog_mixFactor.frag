
precision mediump float;
varying vec4 vWorldPosition;
uniform vec2 fogDist;
uniform vec3 cameraPosition;
uniform float rainDepth;

void main() {
    vec3 dir = vec3(
        vWorldPosition[0] - cameraPosition[0],
        vWorldPosition[1] - cameraPosition[1],
        vWorldPosition[2] - cameraPosition[2]
    );
    float dist = length(dir);
    float fogFactor = clamp(1.0 - (dist - fogDist.x) / (fogDist.y - fogDist.x), 0.0, 1.0);
    if (vWorldPosition[2] < rainDepth) {
        gl_FragColor = vec4(fogFactor, 0.0, 0.0, 1.0);
    } else {
        gl_FragColor = vec4(fogFactor, 1.0, 0.0, 1.0);
    }
    gl_FragColor = vWorldPosition;
}
