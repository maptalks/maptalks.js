import { mat4 } from 'gl-matrix';
import MeshShader from '../../reshader/shader/MeshShader.js';
import { getWGSLSource } from '../../reshader/gpu/WGSLSources';

const tempMat4 = mat4.create();

/**
 * 投影视锥体线框着色器（纯色）
 * 通过 aNext/aSide 在 clip 空间展开线段，支持任意线宽（WebGL lineWidth 通常仅支持 1px）
 */
class VideoProjectionFrustumShader extends MeshShader {
    constructor(extraCommandProps = {}) {
        super({
            name: 'video-projection-frustum',
            wgslVert: getWGSLSource('gl_video_projection_frustum_vert'),
            wgslFrag: getWGSLSource('gl_video_projection_frustum_frag'),
            vert: `
attribute vec3 aPosition;
attribute vec3 aNext;
attribute float aSide;
uniform mat4 projViewModelMatrix;
uniform float uLineWidth;
uniform float uViewportHeight;
void main() {
    vec4 clip0 = projViewModelMatrix * vec4(aPosition, 1.0);
    vec4 clip1 = projViewModelMatrix * vec4(aNext, 1.0);
    vec2 ndc0 = clip0.xy / clip0.w;
    vec2 ndc1 = clip1.xy / clip1.w;
    vec2 dir = ndc1 - ndc0;
    float len = length(dir);
    // 屏幕空间垂直线段方向的法线
    vec2 normal = len > 0.000001 ? vec2(-dir.y, dir.x) / len : vec2(1.0, 0.0);
    // 线宽像素数 -> NDC 偏移（以画布高度为基准），再乘 clip0.w 转回 clip 空间
    float ndcOffset = uLineWidth * 0.5 * (2.0 / uViewportHeight);
    vec2 clipOffset = normal * aSide * ndcOffset * clip0.w;
    gl_Position = vec4(clip0.xy + clipOffset, clip0.zw);
}`,
            frag: `
precision highp float;
uniform vec4 uColor;
void main() {
    gl_FragColor = uColor;
}`,
            uniforms: [{
                name: 'projViewModelMatrix',
                type: 'function',
                fn: (context, props) => {
                    return mat4.multiply(tempMat4, props['projViewMatrix'], props['modelMatrix']);
                }
            }],
            extraCommandProps
        });
    }
}

export default VideoProjectionFrustumShader;
