// the distance over which the line edge fades out.
// Retina devices need a smaller distance to avoid aliasing.
#define DEVICE_PIXEL_RATIO 1.0
#define ANTIALIASING 1.0 / DEVICE_PIXEL_RATIO / 2.0

#define EXTRUDE_SCALE 0.0078740157

attribute vec3 aPosition;
attribute float aNormal;
attribute vec2 aExtrude;
attribute float aLinesofar;

uniform float cameraToCenterDistance;
uniform float lineStrokeWidth;
uniform float lineWidth;
uniform mat4 projViewModelMatrix;
uniform float tileResolution;
uniform float resolution;
uniform float tileRatio; //EXTENT / tileSize

varying vec2 vNormal;
varying vec2 vWidth;

//uniforms needed by trail effect
uniform float currentTime;
uniform float trailLength;

varying float vTime;

void main() {
    float strokewidth = lineStrokeWidth / 2.0;
    float halfwidth = lineWidth / 2.0;
    // offset = -1.0 * offset;

    float inset = lineWidth + sign(lineWidth) * ANTIALIASING;
    float outset = halfwidth + strokewidth + sign(halfwidth) * ANTIALIASING;

    vec2 extrude = aExtrude;
    // Scale the extrusion vector down to a normal and then up by the line width
    // of this vertex.
    vec2 dist = outset * extrude * EXTRUDE_SCALE;

    float scale = tileResolution / resolution;
    gl_Position = projViewModelMatrix * vec4(aPosition + vec3(dist, 0.0) * tileRatio / scale, 1.0);

    float distance = gl_Position.w;
    // x is 1 if it's a round cap, 0 otherwise
    // y is 1 if the normal points up, and -1 if it points down
    float round = float(int(aNormal) / 2);
    float up = mod(aNormal, 2.0);
    vNormal = vec2(round, sign(up - 0.1));
    vWidth = vec2(outset, inset);

    vTime = 1.0 - (currentTime - aLinesofar / (tileRatio / scale)) / trailLength;
}
