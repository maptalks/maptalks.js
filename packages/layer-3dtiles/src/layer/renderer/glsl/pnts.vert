#include <gl2_vert>
const float SHIFT_RIGHT_11 = 1.0 / 2048.0;
const float SHIFT_RIGHT_5 = 1.0 / 32.0;
const float SHIFT_LEFT_11 = 2048.0;
const float SHIFT_LEFT_5 = 32.0;
const float NORMALIZE_6 = 1.0 / 64.0;
const float NORMALIZE_5 = 1.0 / 32.0;

#ifdef HAS_POSITION
    attribute vec3 POSITION;
#endif

#if defined(HAS_RGB)
    attribute vec3 RGB;
#elif defined(HAS_RGBA)
    attribute vec4 RGBA;
#elif defined(HAS_RGB565)
    attribute float RGB565;
#endif

uniform vec4 pointColor;
uniform float pointSize;

uniform mat4 projViewModelMatrix;
uniform float pointOpacity;

varying vec4 vColor;

#ifdef HAS_NORMAL
    #ifdef HAS_NORMAL_OCT16P
        attribute vec2 NORMAL_OCT16P;
        float signNotZero(float value) {
            return value >= 0.0 ? 1.0 : -1.0;
        }
        vec2 signNotZero(vec2 value) {
            return vec2(signNotZero(value.x), signNotZero(value.y));
        }
        vec3 octDecode(vec2 encoded, float range) {
            if (encoded.x == 0.0 && encoded.y == 0.0) {
                return vec3(0.0, 0.0, 0.0);
            }
            encoded = encoded / range * 2.0 - 1.0;
            vec3 v = vec3(encoded.x, encoded.y, 1.0 - abs(encoded.x) - abs(encoded.y));
            if (v.z < 0.0) {
                v.xy = (1.0 - abs(v.yx)) * signNotZero(v.xy);
            }
            return normalize(v);
        }
        vec3 octDecode(vec2 encoded) {
            return octDecode(encoded, 255.0);
        }
    #else
        attribute vec3 NORMAL;
    #endif
    uniform vec3 lightDir;
    uniform mat3 modelNormalMatrix;
    uniform mat4 positionMatrix;
    float getLambertDiffuse(vec3 lightDir, vec3 normal) {
        return max(dot(-lightDir, normal), 0.0);
    }
#endif
#ifdef PICKING_MODE
    #include <fbo_picking_vert>
#endif
#include <draco_decode_vert>
void main() {
    #ifdef HAS_POSITION
        vec3 localPos = decode_getPosition(POSITION);
    #endif
    gl_Position = projViewModelMatrix * vec4(localPos, 1.0);
    gl_PointSize = pointSize;

    #ifdef PICKING_MODE
        fbo_picking_setData(gl_Position.w, true);
    #else
        #if defined(HAS_RGB)
            vColor = vec4(RGB / 255.0, 1.0) * pointOpacity;
        #elif defined(HAS_RGBA)
            vColor = RGBA / 255.0 * pointOpacity;
        #elif defined(HAS_RGB565)
            // from Cesium PointCloud.js
            // MIT License
            float compressed = RGB565;
            float r = floor(compressed * SHIFT_RIGHT_11);
            compressed -= r * SHIFT_LEFT_11;
            float g = floor(compressed * SHIFT_RIGHT_5);
            compressed -= g * SHIFT_LEFT_5;
            float b = compressed;
            vec3 rgb = vec3(r * NORMALIZE_5, g * NORMALIZE_6, b * NORMALIZE_5);
            vColor = vec4(rgb, 1.0);
        #else
            vColor = pointColor;
        #endif

        #ifdef HAS_NORMAL
            mat3 positionNormalMatrix = mat3(positionMatrix);
            mat3 normalMatrix = modelNormalMatrix * positionNormalMatrix;
            #ifdef HAS_NORMAL_OCT16P
                vec3 localNormal = octDecode(NORMAL_OCT16P);
            #else
                vec3 localNormal = NORMAL;
            #endif
            vec3 normal = normalize(normalMatrix * localNormal);
            float colorStrength = getLambertDiffuse(lightDir, normal);
            colorStrength = max(colorStrength, 0.5);
            vColor *= colorStrength;
        #endif
    #endif




}
