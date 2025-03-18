const vert = /* wgsl */`
#ifdef HAS_MASK_EXTENT
struct MaskUniforms {
    mask_extent: vec4f,
    mask_maskMode: f32,
    mask_hasFlatOut: f32,
    viewMatrix: mat4x4f,
    mask_heightRatio: f32,
    mask_heightOffset: f32,
};

@group(0) @binding($b) var<uniform> maskUniforms: MaskUniforms;
@group(0) @binding($b) var mask_colorExtentSampler: sampler;
@group(0) @binding($b) var mask_colorExtent: texture_2d<f32>;
@group(0) @binding($b) var mask_modeExtentSampler: sampler;
@group(0) @binding($b) var mask_modeExtent: texture_2d<f32>;

const CLIPINSIDE_MODE: f32 = 0.2;
const FLATINSIDE_MODE: f32 = 0.3;
const FLATOUTSIDE_MODE: f32 = 0.4;
const ELEVATE_MODE: f32 = 0.7;

fn random(st: vec2f) -> f32 {
    return fract(sin(dot(st, vec2f(12.9898, 78.233))) * 43758.5453123) * 0.1;
}

fn isInExtent(color: vec4f) -> bool {
    return length(color.rgb) > 0.0;
}

fn getFlatHeight(maskMode: f32, flatHeight: f32, height: f32) -> f32 {
    if (maskMode <= ELEVATE_MODE && maskMode > 0.6) {
        return flatHeight + height;
    } else {
        return flatHeight;
    }
}

fn getNoErrorPosition(position: vec4f, wPosition: vec4f) -> vec4f {
    let realPos = uniforms.modelViewMatrix * position; // 未压平，采用 vm 矩阵的坐标
    let pos = maskUniforms.viewMatrix * wPosition; // 压平的坐标
    let tempPos = maskUniforms.viewMatrix * uniforms.modelMatrix * position; // 未压平而采用 v*m 矩阵的坐标
    let deltaX = realPos.x - tempPos.x;
    let deltaY = realPos.y - tempPos.y;
    let deltaZ = realPos.z - tempPos.z;
    pos.x = pos.x + deltaX;
    pos.y = pos.y + deltaY;
    pos.z = pos.z + deltaZ;
    return pos;
}

fn getMaskPosition(position: vec4f, modelMatrix: mat4x4f, vertexOutput: VertexOutput) -> vec4f {
    vertexOutput.vWorldPosition = modelMatrix * position;
    let w = maskUniforms.mask_extent.z - maskUniforms.mask_extent.x;
    let h = maskUniforms.mask_extent.y - maskUniforms.mask_extent.w;
    let uvInExtent = vec2f((vertexOutput.vWorldPosition.x - maskUniforms.mask_extent.x) / abs(w), 1.0 - (vertexOutput.vWorldPosition.y - maskUniforms.mask_extent.w) / h);
    let extentColor = textureSample(mask_colorExtent, mask_colorExtentSampler, uvInExtent);
    let maskOptionColor = textureSample(mask_modeExtent, mask_modeExtentSampler, uvInExtent).rgb;
    let maskMode = maskOptionColor.r;
    let flatHeight = maskOptionColor.g / maskUniforms.mask_heightRatio + maskUniforms.mask_heightOffset;
    let height = getFlatHeight(maskMode, flatHeight, vertexOutput.vWorldPosition.z);
    let wPosition = vec4f(vertexOutput.vWorldPosition.x, vertexOutput.vWorldPosition.y, height, vertexOutput.vWorldPosition.w);
    vertexOutput.vUVInExtent = uvInExtent;
    vertexOutput.vHeightRatio = maskUniforms.mask_heightRatio;
    vertexOutput.vHeightOffset = maskUniforms.mask_heightOffset;
    if (maskMode <= FLATOUTSIDE_MODE && maskMode > FLATINSIDE_MODE) {
        return uniforms.modelViewMatrix * position;
    } else if (maskUniforms.mask_hasFlatOut == 1.0) {
        return getNoErrorPosition(position, wPosition);
    }
    if (isInExtent(extentColor) && maskMode <= FLATINSIDE_MODE && maskMode > CLIPINSIDE_MODE) {
        return getNoErrorPosition(position, wPosition);
    }
    if (isInExtent(extentColor) && maskMode <= ELEVATE_MODE && maskMode > 0.6) {
        return getNoErrorPosition(position, wPosition);
    } else {
        return uniforms.modelViewMatrix * position;
    }
}
#endif
`;

const varyings = [
    {
        name: 'vWorldPosition',
        type: 'vec4f'
    },
    {
        name: 'vUVInExtent',
        type: 'vec2f'
    },
    {
        name: 'vHeightRatio',
        type: 'f32'
    },
    {
        name: 'vHeightOffset',
        type: 'f32'
    }
];

export default {
    defines: ['HAS_MASK_EXTENT'],
    vert,
    varyings
};
