#ifdef GL_ES
precision highp float;
#endif
uniform vec4 extent;
uniform sampler2D extentMap;
varying vec4 vWorldPosition;
void main() {
    float width = extent.z - extent.x;
    float height = extent.y - extent.w;
    vec2 uvInExtent = vec2((vWorldPosition.x - extent.x) / width, 1.0 - (vWorldPosition.y - extent.w) / height);
    vec4 extentColor = texture2D(extentMap, uvInExtent);
    if (extentColor.r > 0.0) {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    } else {
        gl_FragColor = vec4(0.0);
    }
}
