precision highp float;
precision highp int;

varying vec2 vTexCoord;
uniform sampler2D maskTexture;
uniform vec2 texSize;
uniform vec3 visibleEdgeColor;
uniform float lineWidth;
void main() {
    vec2 invSize = (1.0 / texSize) * lineWidth;
    vec4 uvOffset = vec4(1.0, 0.0, 0.0, 1.0) * vec4(invSize.x, invSize.y, invSize.x, invSize.y);
    vec4 c1 = texture2D(maskTexture, vTexCoord + uvOffset.xy);
    vec4 c2 = texture2D(maskTexture, vTexCoord - uvOffset.xy);
    vec4 c3 = texture2D(maskTexture, vTexCoord + uvOffset.yw);
    vec4 c4 = texture2D(maskTexture, vTexCoord - uvOffset.yw);
    float diff1 = (c1.r - c2.r)*0.7;
    float diff2 = (c3.r - c4.r)*0.7;
    float d = length(vec2(diff1, diff2) );
    float a1 = min(c1.g, c2.g);
    float a2 = min(c3.g, c4.g);
    float visibilityFactor = min(a1, a2);
    gl_FragColor = 1.0 - visibilityFactor > 0.001 ? vec4(visibleEdgeColor, 1.0) * vec4(d) : vec4(0.0);
}