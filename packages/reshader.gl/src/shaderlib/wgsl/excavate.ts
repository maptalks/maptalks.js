const vert = /*wgsl*/`
#ifdef HAS_EXCAVATE_ANALYSIS
struct ExcavateUniforms {
    excavateExtent: vec4f
};

@group(0) @binding($b) var<uniform> excavateUniforms: ExcavateUniforms;

struct VertexAttributes {
    @location(0) aPosition: vec3f
};

struct VertexOutput {
    @builtin(position) position: vec4f,
    vCoordinateTexcoord: vec2f,
    vHeight: f32
};

fn getWorldHeight(vertex: VertexInput) -> f32 {
    let wPosition = uniforms.modelMatrix * getPosition(vertex.aPosition);
    return wPosition.z;
}

fn getCoordinateTexcoord(vertex: VertexInput) -> vec2f {
    let localPositionMatrix = getPositionMatrix();
    let wPosition = uniforms.modelMatrix * localPositionMatrix * getPosition(vertex.aPosition);
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

    if (vertexOutput.vHeight > validHeight) {
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
            name: 'vHeight',
            type: 'f32'
        }
    ]
}
