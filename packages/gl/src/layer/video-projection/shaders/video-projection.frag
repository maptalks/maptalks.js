precision highp float;
#include <gl2_frag>
varying vec2 vTexCoord;

uniform sampler2D sceneMap;
uniform sampler2D sceneDepthTex;
uniform sampler2D projectorDepthMap;
uniform sampler2D videoTexture;
uniform mat4 projectorClipMatrix;
uniform float opacity;
uniform float intensity;
uniform float projBias;
uniform float edgeFeather;
uniform vec4 cropRect;
uniform mat3 quadHomography;
uniform vec4 frustumColor;

const float UnpackDownscale = 255. / 256.;
const vec3 PackFactors = vec3(256. * 256. * 256., 256. * 256., 256.);
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1.);
float unpackRGBAToDepth(const in vec4 v) {
    return dot(v, UnpackFactors);
}

void main() {
    vec4 sceneColor = texture2D(sceneMap, vTexCoord);
    float depth = texture2D(sceneDepthTex, vTexCoord).r;

    // 默认透传场景颜色，保证投影区域外不被修改
    vec4 outColor = sceneColor;

    // 由屏幕深度重建 NDC 坐标，并投影到投影相机裁剪空间
    vec4 clipPos = vec4(vTexCoord * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
    vec4 projPos = projectorClipMatrix * clipPos;
    if (projPos.w > 0.0) {
        vec3 ndc = projPos.xyz / projPos.w;
        vec2 projUV = ndc.xy * 0.5 + 0.5;
        if (projUV.x >= 0.0 && projUV.x <= 1.0 && projUV.y >= 0.0 && projUV.y <= 1.0) {
            // 深度遮挡剔除
            float projDepth = ndc.z * 0.5 + 0.5;
            float depthFromMap = unpackRGBAToDepth(texture2D(projectorDepthMap, projUV));
            if (projDepth <= depthFromMap + projBias) {
                // 四角点变换（投影UV -> 视频纹理UV）
                vec3 hw = quadHomography * vec3(projUV, 1.0);
                vec2 videoUV = hw.xy / hw.z;
                // DOM 视频/图片源为 top-left 像素原点，WebGL 纹理 v 轴与屏幕 y 反向，
                // 翻转 v 使投影画面上下方向与视频源一致（避免画面上下颠倒）
                videoUV.y = 1.0 - videoUV.y;
                if (videoUV.x >= cropRect.x && videoUV.x <= cropRect.z && videoUV.y >= cropRect.y && videoUV.y <= cropRect.w) {
                    // 边缘羽化
                    float distX = min(videoUV.x - cropRect.x, cropRect.z - videoUV.x);
                    float distY = min(videoUV.y - cropRect.y, cropRect.w - videoUV.y);
                    float minDist = min(distX, distY);
                    float edgeFactor = edgeFeather > 0.0 ? smoothstep(0.0, edgeFeather, minDist) : 1.0;

                    vec3 videoColor = texture2D(videoTexture, videoUV).rgb;
                    vec4 mixedColor = vec4(mix(sceneColor.rgb, videoColor.rgb * intensity, opacity * edgeFactor), sceneColor.a);
                    // 视锥体线框像素保留，避免被视频画面遮挡
                    if (all(lessThan(abs(sceneColor.rgb - frustumColor.rgb), vec3(0.02)))) {
                        mixedColor = sceneColor;
                    }
                    outColor = mixedColor;
                }
            }
        }
    }
    glFragColor = outColor;
    #if __VERSION__ == 100
        gl_FragColor = glFragColor;
    #endif
}
