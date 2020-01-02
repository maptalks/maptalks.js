attribute vec4 WEIGHTS_0;
attribute vec4 JOINTS_0;

uniform sampler2D jointTexture;
uniform vec2 jointTextureSize;
uniform float numJoints;

//将skin的变换矩阵放到jointTexture中，jointTexture每行有4个像素，每个像素有rbga4个值，用来存放一个4x4的矩阵，ROW用来指示采样点坐标
#define ROW0_U ((0.5 + 0.0) / 4.)
#define ROW1_U ((0.5 + 1.0) / 4.)
#define ROW2_U ((0.5 + 2.0) / 4.)
#define ROW3_U ((0.5 + 3.0) / 4.)

mat4 skin_getBoneMatrix(float jointNdx) {
    float v = (jointNdx + 0.5) / numJoints;
    return mat4(
        texture2D(jointTexture, vec2(ROW0_U, v)),
        texture2D(jointTexture, vec2(ROW1_U, v)),
        texture2D(jointTexture, vec2(ROW2_U, v)),
        texture2D(jointTexture, vec2(ROW3_U, v)));
}

mat4 skin_getSkinMatrix() {
        mat4 skinMatrix = skin_getBoneMatrix(JOINTS_0[0]) * WEIGHTS_0[0] +
                        skin_getBoneMatrix(JOINTS_0[1]) * WEIGHTS_0[1] +
                        skin_getBoneMatrix(JOINTS_0[2]) * WEIGHTS_0[2] +
                        skin_getBoneMatrix(JOINTS_0[3]) * WEIGHTS_0[3];
        return skinMatrix;
}
