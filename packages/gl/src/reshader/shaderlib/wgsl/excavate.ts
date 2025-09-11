const vert = /*wgsl*/`
#ifdef HAS_EXCAVATE_ANALYSIS
struct ExcavateUniforms {
    excavateExtent: vec4f
};

@group(0) @binding($b) var<uniform> excavateUniforms: ExcavateUniforms;

fn getWorldHeight(localPosition: vec4f, modelMatrix: mat4x4f) -> f32 {
    let wPosition = uniforms.modelMatrix * localPosition;
    return wPosition.z;
}

fn getCoordinateTexcoord(localPosition: vec4f, modelMatrix: mat4x4f) -> vec2f {
    let wPosition = modelMatrix * localPositionMatrix;
    let x = (wPosition.x - excavateUniforms.excavateExtent.x) /
           (excavateUniforms.excavateExtent.z - excavateUniforms.excavateExtent.x);
    let y = (wPosition.y - excavateUniforms.excavateExtent.y) /
           (excavateUniforms.excavateExtent.w - excavateUniforms.excavateExtent.y);
    return vec2f(x, y);
}

#endif
`;

const frag = /*wgsl*/`
#ifdef HAS_EXCAVATE_ANALYSIS
struct ExcavateUniforms {
    excavateHeight: f32,
    heightRange: vec2f  // Replaces the const range
};

@group(0) @binding($b) var<uniform> excavateUniforms: ExcavateUniforms;
@group(0) @binding($b) var heightmap: texture_2d<f32>;
@group(0) @binding($b) var heightmapSampler: sampler;


fn decodeHeight(pack: vec4f) -> f32 {
    return pack.r + pack.g / 255.0;
}

fn excavateColor(fragColor: vec4f, vertexOutput: VertexOutput) -> vec4f {
    let samplerHeight = decodeHeight(textureSample(heightmap, heightmapSampler, vertexOutput.vCoordinateTexcoord));
    let realHeight = samplerHeight * (excavateUniforms.heightRange.y - excavateUniforms.heightRange.x) + excavateUniforms.heightRange.x;

    let validHeight = select(
        0.0,
        realHeight,
        realHeight >= excavateUniforms.heightRange.x && realHeight <= excavateUniforms.heightRange.y
    );

    if (vertexOutput.vExcavateHeight > validHeight) {
        discard;
    }
    return fragColor;
}
#endif
`;

export default {
    defines: ['HAS_EXCAVATE_ANALYSIS'],
    vert,
    frag,
    varyings: [
        {
            name: 'vCoordinateTexcoord',
            type: 'vec2f'
        },
        {
            name: 'vExcavateHeight',
            type: 'f32'
        }
    ]
}
