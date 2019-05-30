// the distance over which the line edge fades out.
// Retina devices need a smaller distance to avoid aliasing.
#define DEVICE_PIXEL_RATIO 1.0
#define ANTIALIASING 1.0 / DEVICE_PIXEL_RATIO / 2.0

// floor(127 / 2) == 63.0
// the maximum allowed miter limit is 2.0 at the moment. the extrude normal is
// stored in a byte (-128..127). we scale regular normals up to length 63, but
// there are also "special" normals that have a bigger length (of up to 126 in
// this case).
// #define scale 63.0
// EXTRUDE_SCALE = 1 / 127.0
#define EXTRUDE_SCALE 63.0;//0.0078740157

attribute vec3 aPosition;
attribute float aNormal;
attribute vec2 aExtrude;
attribute float aLinesofar;

uniform float cameraToCenterDistance;
uniform float lineGapWidth;
uniform float lineWidth;
uniform mat4 projViewModelMatrix;
uniform float tileResolution;
uniform float resolution;
uniform float tileRatio; //EXTENT / tileSize
uniform float lineDx;
uniform float lineDy;
uniform vec2 canvasSize;

varying vec2 vNormal;
varying vec2 vWidth;
varying float vGammaScale;
varying highp float vLinesofar;

#ifdef HAS_PATTERN
    attribute vec2 aPrevExtrude;

    varying float vZoomScale;
    varying vec2 vExtrudeOffset;
    varying float vDirection;
#endif

void main() {
    float gapwidth = lineGapWidth / 2.0;
    float halfwidth = lineWidth / 2.0;
    // offset = -1.0 * offset;

    float inset = gapwidth + sign(gapwidth) * ANTIALIASING;
    float outset = gapwidth + halfwidth + sign(halfwidth) * ANTIALIASING;

    vec2 extrude = aExtrude;
    // Scale the extrusion vector down to a normal and then up by the line width
    // of this vertex.
    vec2 dist = outset * extrude / EXTRUDE_SCALE;

    float scale = tileResolution / resolution;
    gl_Position = projViewModelMatrix * vec4(aPosition + vec3(dist, 0.0) * tileRatio / scale, 1.0);

    float distance = gl_Position.w;
    gl_Position.xy += vec2(lineDx, lineDy) * 2.0 / canvasSize * distance;

    // x is 1 if it's a round cap, 0 otherwise
    // y is 1 if the normal points up, and -1 if it points down
    float direction =  float(int(aNormal) / 4);
    float round = float(int(mod(aNormal, 4.0)) / 2);
    float up = mod(aNormal, 2.0);
    vNormal = vec2(round, sign(up - 0.1));
    // vNormal = aNormal;
    vWidth = vec2(outset, inset);
    vGammaScale = distance / cameraToCenterDistance;
    vLinesofar = aLinesofar / tileRatio;

    #ifdef HAS_PATTERN
        vZoomScale = scale;
        vExtrudeOffset = (aPrevExtrude - extrude) / EXTRUDE_SCALE;
        vDirection = direction - 2.0;
    #endif
}
