precision highp float;
precision highp sampler2D;
const float PI = 3.141592653589793;
uniform mat4 projViewMatrix;
uniform mat4 modelMatrix;
attribute vec3 aPosition;

uniform vec2 tilePoint;
#ifdef IS_VT
    uniform float tileRatio;
    uniform float tileScale;
#else
    uniform float glScale;
#endif
uniform vec2 uvSize;
vec2 computeUV(vec2 vertex) {
    #ifdef IS_VT
        float u = vertex.x / uvSize.x;
        float v = vertex.y / uvSize.y;
        return vec2(u, v);
    #else
        //减去tilePoint是为了减小u和v的值，增加u和v的精度，以免在地图级别很大(scale很大)时，精度不足产生的纹理马赛克现象
        float u = (vertex.x - tilePoint.x) * glScale / uvSize.x;
        float v = (vertex.y - tilePoint.y) * glScale / uvSize.y;
        return vec2(u, -v);
    #endif
}

varying vec2 vuv;
varying vec3 vpos;
varying vec3 vnormal;
varying mat3 vtbnMatrix;
vec4 transformPosition(mat4 projViewMatrix, vec4 pos) {
    return projViewMatrix * pos;
}
vec3 getLocalUp(in vec3 pos, in vec3 origin) {
    return normalize(pos + origin);
}
mat3 getTBNMatrix(in vec3 n) {
    vec3 t = normalize(cross(n, vec3(0.0, 1.0, 0.0)));
    vec3 b = normalize(cross(n, t));
    return mat3(t, b, n);
}

#if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
    #include <vsm_shadow_vert>
#endif

const vec3 NORMAL = vec3(0., 0., 1.);

void main(void) {
    vec4 localVertex = vec4(aPosition, 1.);
    vec4 vertex = modelMatrix * localVertex;
    vpos = vertex.xyz;
    vtbnMatrix = getTBNMatrix(NORMAL);
    gl_Position = projViewMatrix * vertex;

    #ifdef IS_VT
        //瓦片左上角对应的纹理偏移量
        vec2 centerOffset = mod((tilePoint) * tileScale * vec2(1.0, 1.0) / uvSize, 1.0);
        // centerOffset.y = 1.0 - centerOffset.y;
        vuv = centerOffset + computeUV(aPosition.xy * tileScale / tileRatio);
    #else
        vuv = computeUV(vertex.xy);
    #endif

    #if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
        shadow_computeShadowPars(localVertex);
    #endif
}
