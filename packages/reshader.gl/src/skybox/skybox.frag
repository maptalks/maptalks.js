#define SHADER_NAME SKYBOX
#if __VERSION__ == 100
    #ifdef GL_EXT_shader_texture_lod
        #extension GL_EXT_shader_texture_lod : enable
        #define textureCubeLod(tex, uv, lod) textureCubeLodEXT(tex, uv, lod)
    #else
        #define textureCubeLod(tex, uv, lod) textureCube(tex, uv, lod)
    #endif
#else
     #define textureCubeLod(tex, uv, lod) textureLod(tex, uv, lod)
#endif
precision highp float;

#define saturate(x)        clamp(x, 0.0, 1.0)

#include <gl2_frag>

#include <hsv_frag>

uniform vec3 hsv;

varying vec3 vWorldPos;

#ifdef USE_AMBIENT
    uniform vec3 diffuseSPH[9];
#else
    uniform samplerCube cubeMap;
    uniform float bias;
    uniform float size;
#endif
uniform float environmentExposure;
uniform float backgroundIntensity;

vec4 textureCubeFixed(const in samplerCube tex, const in vec3 R, const in float size, const in float bias) {
    vec3 dir = R;
    // float scale = 1.0 - 1.0 / size;
    // vec3 absDir = abs(dir);
    // float M = max(max(absDir.x, absDir.y), absDir.z);
    // if (absDir.x != M) dir.x *= scale;
    // if (absDir.y != M) dir.y *= scale;
    // if (absDir.z != M) dir.z *= scale;
    return textureCubeLod(tex, dir, bias);
}

vec3 computeDiffuseSPH(const in vec3 normal, const in vec3 diffuseSPH[9]) {
    float x = normal.x;
    float y = normal.y;
    float z = normal.z;
    vec3 result = (
        diffuseSPH[0] +

        diffuseSPH[1] * x +
        diffuseSPH[2] * y +
        diffuseSPH[3] * z +

        diffuseSPH[4] * z * x +
        diffuseSPH[5] * y * z +
        diffuseSPH[6] * y * x +
        diffuseSPH[7] * (3.0 * z * z - 1.0) +
        diffuseSPH[8] * (x*x - y*y)
        );
    return max(result, vec3(0.0));
}

float pseudoRandom(const in vec2 fragCoord) {
    vec3 p3 = fract(vec3(fragCoord.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}


void main()
{
    vec4 envColor;
    #ifdef USE_AMBIENT
        vec3 normal = normalize(vWorldPos + mix(-0.5/255.0, 0.5/255.0, pseudoRandom(gl_FragCoord.xy))*2.0);
        envColor = vec4(computeDiffuseSPH(normal, diffuseSPH), 1.0);
        if (length(hsv) > 0.0) {
            envColor.rgb = hsv_apply(envColor.rgb, hsv);
        }
    #else
        envColor = textureCubeFixed(cubeMap, vWorldPos, size, bias);
    #endif
    envColor.rgb *= environmentExposure;
    envColor.rgb *= backgroundIntensity;

    glFragColor = envColor;
    if (length(hsv) > 0.0) {
        glFragColor.rgb = hsv_apply(clamp(glFragColor.rgb, 0.0, 1.0), hsv);
    }
    // #ifdef USE_HDR
    //     vec3 color = gl_FragColor.rgb;
    //     color = color / (color.rgb + vec3(1.0));
    //     color = pow(color, vec3(1.0/2.2));
    //     gl_FragColor.rgb = color;
    // #endif
    #if __VERSION__ == 100
        gl_FragColor = glFragColor;
    #endif

}
