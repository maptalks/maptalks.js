const vert = /* wgsl */`
@group(0) @binding($b) var<uniform> terrainAltitudeScale: f32;

// 获取实例属性矩阵函数
fn instance_getAttributeMatrix(
    input: VertexInput
) -> mat4x4f {
    let vectorA = input.instance_vectorA;
    let vectorB = input.instance_vectorB;
    let vectorC = input.instance_vectorC;
    var mat = mat4x4f(
        vectorA.x, vectorB.x, vectorC.x, 0.0,
        vectorA.y, vectorB.y, vectorC.y, 0.0,
        vectorA.z, vectorB.z, vectorC.z, 0.0,
        vectorA.w, vectorB.w, vectorC.w, 1.0
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
