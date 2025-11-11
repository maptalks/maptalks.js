const vert = /* wgsl */`
// 矩阵求逆函数
fn invert_matrix(matrix: mat4x4f) -> mat4x4f {
    let vector1 = matrix[0];
    let vector2 = matrix[1];
    let vector3 = matrix[2];
    let vector4 = matrix[3];

    let a00 = vector1.x;
    let a01 = vector1.y;
    let a02 = vector1.z;
    let a03 = vector1.w;

    let a10 = vector2.x;
    let a11 = vector2.y;
    let a12 = vector2.z;
    let a13 = vector2.w;

    let a20 = vector3.x;
    let a21 = vector3.y;
    let a22 = vector3.z;
    let a23 = vector3.w;

    let a30 = vector4.x;
    let a31 = vector4.y;
    let a32 = vector4.z;
    let a33 = vector4.w;

    let b00 = a00 * a11 - a01 * a10;
    let b01 = a00 * a12 - a02 * a10;
    let b02 = a00 * a13 - a03 * a10;
    let b03 = a01 * a12 - a02 * a11;
    let b04 = a01 * a13 - a03 * a11;
    let b05 = a02 * a13 - a03 * a12;
    let b06 = a20 * a31 - a21 * a30;
    let b07 = a20 * a32 - a22 * a30;
    let b08 = a20 * a33 - a23 * a30;
    let b09 = a21 * a32 - a22 * a31;
    let b10 = a21 * a33 - a23 * a31;
    let b11 = a22 * a33 - a23 * a32;

    // 计算行列式
    var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    det = 1.0 / det;

    let m = mat4x4f(
        (a11 * b11 - a12 * b10 + a13 * b09) * det,
        (a02 * b10 - a01 * b11 - a03 * b09) * det,
        (a31 * b05 - a32 * b04 + a33 * b03) * det,
        (a22 * b04 - a21 * b05 - a23 * b03) * det,
        (a12 * b08 - a10 * b11 - a13 * b07) * det,
        (a00 * b11 - a02 * b08 + a03 * b07) * det,
        (a32 * b02 - a30 * b05 - a33 * b01) * det,
        (a20 * b05 - a22 * b02 + a23 * b01) * det,
        (a10 * b10 - a11 * b08 + a13 * b06) * det,
        (a01 * b08 - a00 * b10 - a03 * b06) * det,
        (a30 * b04 - a31 * b02 + a33 * b00) * det,
        (a21 * b02 - a20 * b04 - a23 * b00) * det,
        (a11 * b07 - a10 * b09 - a12 * b06) * det,
        (a00 * b09 - a01 * b07 + a02 * b06) * det,
        (a31 * b01 - a30 * b03 - a32 * b00) * det,
        (a20 * b03 - a21 * b01 + a22 * b00) * det
    );

    return m;
}

// 矩阵转置函数
fn transpose_matrix(matrix: mat4x4f) -> mat4x4f {
    let vector1 = matrix[0];
    let vector2 = matrix[1];
    let vector3 = matrix[2];
    let vector4 = matrix[3];

    let a01 = vector1.y;
    let a02 = vector1.z;
    let a03 = vector1.w;

    let a12 = vector2.z;
    let a13 = vector2.w;

    let a23 = vector3.w;

    let m = mat4x4f(
        vector1.x,
        vector2.x,
        vector3.x,
        vector4.x,
        a01,
        vector2.y,
        vector3.y,
        vector4.y,
        a02,
        a12,
        vector3.z,
        vector4.z,
        a03,
        a13,
        a23,
        vector4.w
    );

    return m;
}
`;

const frag = vert;

export default {
    vert, frag
};
