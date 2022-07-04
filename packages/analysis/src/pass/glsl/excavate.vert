precision mediump float;
attribute vec3 aPosition;
attribute vec2 aTexCoord;
uniform mat4 projViewMatrix;
uniform mat4 modelMatrix;
uniform mat4 projViewModelMatrix;
uniform vec4 extent;
uniform sampler2D extentMap;
uniform float height;
varying vec4 vWorldPosition;
varying vec2 v_texCoord;
void main() {
    vWorldPosition = modelMatrix * vec4(aPosition, 1.0);
    float w = extent.z - extent.x;
    float h = extent.y - extent.w;
    vec2 uvInExtent = vec2((vWorldPosition.x - extent.x) / w, 1.0 - (vWorldPosition.y - extent.w) / h);
    vec4 extentColor = texture2D(extentMap, uvInExtent);
    if (extentColor.r > 0.0) {
        vec4 wPosition = vec4(vWorldPosition.x, vWorldPosition.y, height, vWorldPosition.w);
        gl_Position = projViewMatrix * wPosition;
    } else {
        gl_Position = projViewModelMatrix * vec4(aPosition, 1.0);
    }
    v_texCoord = aTexCoord;
}
