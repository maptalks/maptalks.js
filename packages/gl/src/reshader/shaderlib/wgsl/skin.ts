const vert = /* wgsl */`
// 定义 uniform 变量
struct JoinUniforms {
    numJoints: f32,                     // 关节数量
};

@group(0) @binding($b) var<uniform> joinUniforms: JoinUniforms;

// 定义采样器
@group(0) @binding($b) var jointTextureSampler: sampler;
@group(0) @binding($b) var jointTexture: texture_2df,      // 关节纹理

// 定义采样点坐标
#define ROW0_U ((0.5 + 0.0) / 4.)
#define ROW1_U ((0.5 + 1.0) / 4.)
#define ROW2_U ((0.5 + 2.0) / 4.)
#define ROW3_U ((0.5 + 3.0) / 4.)

// 获取骨骼矩阵函数
fn skin_getBoneMatrix(jointNdx: f32) -> mat4x4f {
    let v = (jointNdx + 0.5) / joinUniforms.numJoints;
    return mat4x4f(
        textureSample(jointTexture, jointTextureSampler, vec2f(ROW0_U, v)),
        textureSample(jointTexture, jointTextureSampler, vec2f(ROW1_U, v)),
        textureSample(jointTexture, jointTextureSampler, vec2f(ROW2_U, v)),
        textureSample(jointTexture, jointTextureSampler, vec2f(ROW3_U, v))
    );
}

// 获取皮肤矩阵函数
fn skin_getSkinMatrix(JOINTS_0: vec4f, WEIGHTS_0: vec4f) -> mat4x4f {
    var skinMatrix = skin_getBoneMatrix(JOINTS_0[0]) * WEIGHTS_0[0] +
                     skin_getBoneMatrix(JOINTS_0[1]) * WEIGHTS_0[1] +
                     skin_getBoneMatrix(JOINTS_0[2]) * WEIGHTS_0[2] +
                     skin_getBoneMatrix(JOINTS_0[3]) * WEIGHTS_0[3];
    return skinMatrix;
}
`;

const attributes = [
    {
        name: 'WEIGHTS_0',
        type: 'vec4f',
    },
    {
        name: 'JOINTS_0',
        type: 'vec4f',
    }
];

export default {
    vert,
    attributes,
    defines: ['HAS_SKIN']
};
