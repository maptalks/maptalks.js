const frag = /*wgsl*/`
#ifdef HAS_TERRAIN_NORMAL
struct TerrainNormalUniforms {
    terrainHeightMapResolution: vec2f,
    terrainResolution: vec2f,
    terrainHeightScale: f32,
    terrainTileResolution: f32,
    terrainUnpackFactors: vec4f
};

@group(0) @binding($b) var<uniform> terrainNormalUniforms: TerrainNormalUniforms;
@group(0) @binding($b) var terrainHeightTexture: texture_2d<f32>;
@group(0) @binding($b) var terrainHeightSampler: sampler;

fn getHeight(uv: vec2f) -> f32 {
    let color = textureSample(terrainHeightTexture, terrainHeightSampler, uv) * 255.0;
    let colorWithAlpha = vec4f(color.rgb, -1.0);
    return dot(colorWithAlpha, terrainNormalUniforms.terrainUnpackFactors) / 4.0;
}

fn convertTerrainHeightToNormalMap(uv: vec2f) -> vec3f {
    let flippedUV = vec2f(uv.x, 1.0 - uv.y);
    let epsilon = 1.0 / terrainNormalUniforms.terrainHeightMapResolution;

    let a = getHeight(flippedUV + vec2f(-epsilon.x, -epsilon.y));
    let b = getHeight(flippedUV + vec2f(0.0, -epsilon.y));
    let c = getHeight(flippedUV + vec2f(epsilon.x, -epsilon.y));
    let d = getHeight(flippedUV + vec2f(-epsilon.x, 0.0));
    let e = getHeight(flippedUV + vec2f(epsilon.x, 0.0));
    let f = getHeight(flippedUV + vec2f(-epsilon.x, epsilon.y));
    let g = getHeight(flippedUV + vec2f(0.0, epsilon.y));
    let h = getHeight(flippedUV + vec2f(epsilon.x, epsilon.y));

    let dxy = vec2f(
        (c + e + e + h) - (a + d + d + f),
        (f + g + g + h) - (a + b + b + c)
    );
    return normalize(vec3f(dxy / epsilon, terrainNormalUniforms.terrainResolution.x));
}
#endif
`;

export default {
    defines: ['HAS_TERRAIN_NORMAL'],
    frag
};
