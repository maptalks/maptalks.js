const frag = /* wgsl */`
#ifdef HAS_KHR_TEXTURE_TRANSFORM
    struct TextureTransformUniforms {
        offset: vec2f,
        rotation: f32,
        scale: vec2f,
    };

    @group(0) @binding($b) var<uniform> textureTransformUniforms: TextureTransformUniforms;

    fn khr_tex_transformTexCoord(texCoords: vec2f, offset: vec2f, rotation: f32, scale: vec2f) -> vec2f {
        rotation = -rotation;
        let transform = mat3x3f(
            cos(rotation) * scale.x, sin(rotation) * scale.x, 0.0,
            -sin(rotation) * scale.y, cos(rotation) * scale.y, 0.0,
            offset.x, offset.y, 1.0
        );
        let transformedTexCoords = (transform * vec3f(fract(texCoords), 1.0)).xy;
        return transformedTexCoords;
    }
#endif

fn computeTexCoord(vertexOutput: VertexOutput) -> vec2f {
    let texCoord = vertexOutput.vTexCoord;
    #ifdef HAS_I3S_UVREGION
        let atlasScale = vertexOutput.vUvRegion.zw - vertexOutput.vUvRegion.xy;
        let uvAtlas = fract(texCoord) * atlasScale + vertexOutput.vUvRegion.xy;
        return uvAtlas;
    #elif HAS_KHR_TEXTURE_TRANSFORM
        let uniforms = textureTransformUniforms;
        return khr_tex_transformTexCoord(texCoord, uniforms.offset, uniforms.rotation, uniforms.scale);
    #else
        return texCoord;
    #endif
}
`;

export default {
    defines: ['HAS_MAP'],
    frag
};
