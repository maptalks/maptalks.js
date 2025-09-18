#ifdef HAS_KHR_TEXTURE_TRANSFORM
    uniform vec2 khr_offset;
    uniform float khr_rotation;
    uniform vec2 khr_scale;
    vec2 khr_tex_transformTexCoord(vec2 texCoords, vec2 offset, float rotation, vec2 scale) {
        rotation = -rotation;
        mat3 transform = mat3(
        cos(rotation) * scale.x, sin(rotation) * scale.x, 0.0, -sin(rotation) * scale.y, cos(rotation) * scale.y, 0.0, offset.x, offset.y, 1.0);
        vec2 transformedTexCoords = (transform * vec3(fract(texCoords), 1.0)).xy;
        return transformedTexCoords;
    }
#endif
varying highp vec2 vTexCoord;

#ifdef HAS_I3S_UVREGION
    varying vec4 vUvRegion;
#endif

vec2 computeTexCoord(vec2 texCoord) {
    #ifdef HAS_I3S_UVREGION
        vec2 atlasScale = vUvRegion.zw - vUvRegion.xy;
        vec2 uvAtlas = fract(texCoord) * atlasScale + vUvRegion.xy;
        return uvAtlas;
    #elif defined(HAS_KHR_TEXTURE_TRANSFORM)
        return khr_tex_transformTexCoord(texCoord, khr_offset, khr_rotation, khr_scale);
    #else
        return texCoord;
    #endif
}
