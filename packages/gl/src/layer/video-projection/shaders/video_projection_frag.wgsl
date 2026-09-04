// 视频投影全屏合成片元着色器（WebGPU/WGSL 版本）
// 对应 GLSL video-projection.frag：
// 由主相机深度重建 NDC -> 投影到投影相机空间 -> 深度遮挡剔除 -> 叠加视频颜色
// sceneDepthTex 为主场景深度纹理（可能为 MSAA 深度纹理，需 textureLoad）
struct VideoProjectionUniforms {
    projectorClipMatrix: mat4x4f,
    opacity: f32,
    intensity: f32,
    projBias: f32,
    edgeFeather: f32,
    cropRect: vec4f,
    quadHomography: mat3x3f,
    frustumColor: vec4f,
    textureSize: vec2f,
};

@group(0) @binding($b) var<uniform> uniforms: VideoProjectionUniforms;
@group(0) @binding($b) var sceneMap: texture_2d<f32>;
@group(0) @binding($b) var sceneMapSampler: sampler;
#ifdef HAS_MULTISAMPLED
@group(0) @binding($b) var sceneDepthTex: texture_depth_multisampled_2d;
#else
@group(0) @binding($b) var sceneDepthTex: texture_depth_2d;
#endif
@group(0) @binding($b) var sceneDepthTexSampler: sampler;
@group(0) @binding($b) var projectorDepthMap: texture_2d<f32>;
@group(0) @binding($b) var projectorDepthMapSampler: sampler;
@group(0) @binding($b) var videoTexture: texture_2d<f32>;
@group(0) @binding($b) var videoTextureSampler: sampler;

const UnpackDownscale: f32 = 255.0 / 256.0;
const PackFactors: vec3f = vec3f(256.0 * 256.0 * 256.0, 256.0 * 256.0, 256.0);
const UnpackFactors: vec4f = vec4f(UnpackDownscale / PackFactors, UnpackDownscale);

fn unpackRGBAToDepth(v: vec4f) -> f32 {
    return dot(v, UnpackFactors);
}

@fragment
fn main(vertexOutput: VertexOutput) -> @location(0) vec4f {
    let uv: vec2f = vertexOutput.vTexCoord;
    // WebGPU 渲染目标的纹理行 0 对应屏幕顶部（WebGL 中对应屏幕底部），
    // 因此采样 sceneMap/主场景深度时需翻转 v，使画面方向与屏幕一致；
    // clipPos 重建仍用 uv（NDC 语义，vTexCoord (0,0) = NDC 左下角）
    let texUV: vec2f = vec2f(uv.x, 1.0 - uv.y);
    let sceneColor: vec4f = textureSample(sceneMap, sceneMapSampler, texUV);
    #ifdef HAS_MULTISAMPLED
        let depth: f32 = textureLoad(sceneDepthTex, vec2i(texUV * uniforms.textureSize), 0);
    #else
        let depth: f32 = textureSample(sceneDepthTex, sceneDepthTexSampler, texUV);
    #endif

    // 默认透传场景颜色，保证投影区域外不被修改
    var outColor: vec4f = sceneColor;

    // 由屏幕深度重建 NDC 坐标，并投影到投影相机裁剪空间。
    // WebGPU 下 map.projMatrix 为 mat4.perspectiveZO（clip z ∈ [0,1]），
    // 场景深度纹理的值即 [0,1] 深度，直接作为 clipPos.z；
    // （WebGL 下 map.projMatrix 为 [-1,1] 约定，GLSL 版才需要 depth*2-1 还原）
    let clipPos: vec4f = vec4f(uv * 2.0 - 1.0, depth, 1.0);
    let projPos: vec4f = uniforms.projectorClipMatrix * clipPos;

    // WGSL 要求 textureSample/textureLoad 只能从 uniform control flow 调用，
    // 因此所有纹理采样必须提前到顶层（无条件）执行，坐标钳制到合法范围，
    // 采样结果仅在下方条件分支满足时被使用
    var projUV: vec2f = vec2f(0.5);
    if (projPos.w != 0.0) {
        projUV = projPos.xy / projPos.w * 0.5 + 0.5;
    }
    let projUVClamped: vec2f = clamp(projUV, vec2f(0.0), vec2f(1.0));
    // 投影深度贴图同样是 WebGPU 渲染目标（纹理行 0 = 投影相机视口顶部），
    // 采样时需翻转 v
    let depthMapUV: vec2f = vec2f(projUVClamped.x, 1.0 - projUVClamped.y);
    let depthFromMap: f32 = unpackRGBAToDepth(textureSample(projectorDepthMap, projectorDepthMapSampler, depthMapUV));
    let hw: vec3f = uniforms.quadHomography * vec3f(projUVClamped, 1.0);
    let hwz: f32 = select(hw.z, 1.0, hw.z == 0.0);
    // DOM 视频/图片源为 top-left 像素原点，WebGL 纹理 v 轴与屏幕 y 反向，
    // 翻转 v 使投影画面上下方向与视频源一致（避免画面上下颠倒）；
    // WebGPU 视频纹理 v=0 同样对应图片顶部，翻转约定与 GLSL 保持一致
    let videoUV: vec2f = vec2f(hw.x / hwz, 1.0 - hw.y / hwz);
    let videoUVClamped: vec2f = clamp(videoUV, vec2f(0.0), vec2f(1.0));
    let videoColor: vec3f = textureSample(videoTexture, videoTextureSampler, videoUVClamped).rgb;

    if (projPos.w > 0.0) {
        let ndc: vec3f = projPos.xyz / projPos.w;
        if (projUV.x >= 0.0 && projUV.x <= 1.0 && projUV.y >= 0.0 && projUV.y <= 1.0) {
            // 深度遮挡剔除
            let projDepth: f32 = ndc.z * 0.5 + 0.5;
            if (projDepth <= depthFromMap + uniforms.projBias) {
                if (videoUV.x >= uniforms.cropRect.x && videoUV.x <= uniforms.cropRect.z && videoUV.y >= uniforms.cropRect.y && videoUV.y <= uniforms.cropRect.w) {
                    // 边缘羽化
                    let distX: f32 = min(videoUV.x - uniforms.cropRect.x, uniforms.cropRect.z - videoUV.x);
                    let distY: f32 = min(videoUV.y - uniforms.cropRect.y, uniforms.cropRect.w - videoUV.y);
                    let minDist: f32 = min(distX, distY);
                    var edgeFactor: f32 = 1.0;
                    if (uniforms.edgeFeather > 0.0) {
                        edgeFactor = smoothstep(0.0, uniforms.edgeFeather, minDist);
                    }
                    var mixedColor: vec4f = vec4f(mix(sceneColor.rgb, videoColor.rgb * uniforms.intensity, uniforms.opacity * edgeFactor), sceneColor.a);
                    // 视锥体线框像素保留，避免被视频画面遮挡
                    // 不用 lessThan：部分 WGSL 编译器（naga）对 lessThan 的 vec3f 重载解析有兼容性问题
                    let frustumDiff: vec3f = abs(sceneColor.rgb - uniforms.frustumColor.rgb);
                    if (frustumDiff.x < 0.02 && frustumDiff.y < 0.02 && frustumDiff.z < 0.02) {
                        mixedColor = sceneColor;
                    }
                    outColor = mixedColor;
                }
            }
        }
    }
    return outColor;
}
