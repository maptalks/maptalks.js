const vert = /*wgsl*/`
struct VTPUniforms {
    minAltitude: f32,
};

@group(0) @binding($b) var<uniform> vtUniforms: VTPUniforms;

#ifdef HAS_ALTITUDE
    fn unpackVTPosition(vertexInput: VertexInput) -> vec3f {
        var altitude: f32 = vertexInput.aAltitude;
        #ifdef HAS_TERRAIN_ALTITUDE
            // aTerrainAltitude的单位是米，在vt中需要转换为厘米
            altitude += vertexInput.aTerrainAltitude * 100.0;
        #endif
        altitude += vtUniforms.minAltitude * 100.0;
        return vec3f(vec2f(vertexInput.aPosition), altitude);
    }
#else
    // 16384 is pow(2.0, 14.0)
    const position_modValue: f32 = 16384.0;
    const position_delta: f32 = 0.00001;

    fn unpackVTPosition(vertexInput: VertexInput) -> vec3f {
        let aPosition: vec3f = vec3f(vertexInput.aPosition.xyz);
        let z: f32 = aPosition.z;
        let pos: vec2f = sign(aPosition.xy + position_delta) * (abs(aPosition.xy) % position_modValue);
        let highs: vec2f = floor(abs(aPosition.xy) / position_modValue);

        var altitude: f32 = sign(z + position_delta) * (highs.x * 2.0 + highs.y) * pow(2.0, 15.0) + z;
        #ifdef HAS_TERRAIN_ALTITUDE
            // aTerrainAltitude的单位是米，在vt中需要转换为厘米
            altitude += vertexInput.aTerrainAltitude * 100.0;
        #endif
        altitude += vtUniforms.minAltitude * 100.0;
        return vec3f(pos, altitude);
    }
#endif
`;

export default {
    vert,
    attributes: [
        {
            defines: ['HAS_TERRAIN_ALTITUDE'],
            name: 'aTerrainAltitude',
            type: 'f32'
        }
    ]
}
