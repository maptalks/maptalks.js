precision mediump float;
uniform vec4 extent;
uniform vec4 extentPolygon;
uniform sampler2D extentMap;
uniform sampler2D groundTexture;
varying vec4 vWorldPosition;
void main() {
    float width = extent.z - extent.x;
    float height = extent.y - extent.w;
    vec2 uvInExtent = vec2((vWorldPosition.x - extent.x) / width, 1.0 - (vWorldPosition.y - extent.w) / height);
    vec4 extentColor = texture2D(extentMap, uvInExtent);

    float widthPolygon = extentPolygon.z - extentPolygon.x;
    float heightPolygon = extentPolygon.y - extentPolygon.w;
    vec2 uvInExtentPolygon = vec2((vWorldPosition.x - extentPolygon.x) / widthPolygon, 1.0 - (vWorldPosition.y - extentPolygon.w) / heightPolygon);
    vec4 groundColor = texture2D(groundTexture, uvInExtentPolygon);
    if (extentColor.r > 0.0) {
        gl_FragColor = groundColor;
        // discard;
    } else {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
}
