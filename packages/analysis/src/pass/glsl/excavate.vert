precision mediump float;
attribute vec3 aPosition;
uniform mat4 projViewMatrix;
uniform mat4 modelMatrix;
uniform mat4 projViewModelMatrix;
uniform vec4 extent;
uniform sampler2D extentMap;
varying vec4 vWorldPosition;
void main() {
    vWorldPosition = modelMatrix * vec4(aPosition, 1.0);
    float width = extent.z - extent.x;
    float height = extent.y - extent.w;
    vec2 uvInExtent = vec2((vWorldPosition.x - extent.x) / width, 1.0 - (vWorldPosition.y - extent.w) / height);
    vec4 extentColor = texture2D(extentMap, uvInExtent);
    if (extentColor.r > 0.0) {
        vec4 wPosition = vec4(vWorldPosition.x, vWorldPosition.y, 0.0, vWorldPosition.w);
        gl_Position = projViewMatrix * wPosition;
    } else {
        gl_Position = projViewModelMatrix * vec4(aPosition, 1.0);
    }
}
