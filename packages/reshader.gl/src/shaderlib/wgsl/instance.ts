const vert = /* wgsl */`
@group(0) @binding($b) var<uniform> terrainAltitudeScale: f32;

// 获取实例属性矩阵函数
fn instance_getAttributeMatrix(instance_vectorA: vec4f, instance_vectorB: vec4f, instance_vectorC: vec4f) -> mat4x4f {
    var mat = mat4x4f(
        instance_vectorA.x, instance_vectorB.x, instance_vectorC.x, 0.0,
        instance_vectorA.y, instance_vectorB.y, instance_vectorC.y, 0.0,
        instance_vectorA.z, instance_vectorB.z, instance_vectorC.z, 0.0,
        instance_vectorA.w, instance_vectorB.w, instance_vectorC.w, 1.0
    );

#ifdef HAS_INSTANCE_TERRAIN_ALTITUDE
    var terrainMat = mat4x4f(
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, aTerrainAltitude * terrainAltitudeScale, 1.0
    );
    mat = terrainMat * mat;
#endif

    return mat;
}

#ifdef HAS_INSTANCE_COLOR
// 获取实例颜色函数
fn instance_getInstanceColor(instance_color: vec4f) -> vec4f {
    var color = instance_color;
#ifdef HAS_INSTANCE_HIGHLIGHT
    color = instance_color * highlight_color;
#endif
    return color;
}
#endif
`;


const attributes = [
    {
        name: 'instance_vectorA',
        type: 'vec4f',
    },
    {
        name: 'instance_vectorB',
        type: 'vec4f',
    },
    {
        name: 'instance_vectorC',
        type: 'vec4f',
    },
    {
        defines: ['HAS_INSTANCE_TERRAIN_ALTITUDE'],
        name: 'aTerrainAltitude',
        type: 'f32'
    },
    {
        defines: ['HAS_INSTANCE_HIGHLIGHT'],
        name: 'highlight_color',
        type: 'vec4f'
    },
    {
        defines: ['HAS_INSTANCE_COLOR'],
        name: 'instance_color',
        type: 'vec4f'
    }
];

export default {
    vert, attributes,
    defines: ['HAS_INSTANCE']
};
