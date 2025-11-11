mat4 invert_matrix(mat4 matrix) {
    #if __VERSION__ == 300
        return inverse(matrix);
    #else
        vec4 vector1 = matrix[0], vector2 = matrix[1], vector3 = matrix[2], vector4 = matrix[3];
        float a00 = vector1.x, a01 = vector1.y, a02 = vector1.z, a03 = vector1.w;
        float a10 = vector2.x, a11 = vector2.y, a12 = vector2.z, a13 = vector2.w;
        float a20 = vector3.x, a21 = vector3.y, a22 = vector3.z, a23 = vector3.w;
        float a30 = vector4.x, a31 = vector4.y, a32 = vector4.z, a33 = vector4.w;

        float b00 = a00 * a11 - a01 * a10;
        float b01 = a00 * a12 - a02 * a10;
        float b02 = a00 * a13 - a03 * a10;
        float b03 = a01 * a12 - a02 * a11;
        float b04 = a01 * a13 - a03 * a11;
        float b05 = a02 * a13 - a03 * a12;
        float b06 = a20 * a31 - a21 * a30;
        float b07 = a20 * a32 - a22 * a30;
        float b08 = a20 * a33 - a23 * a30;
        float b09 = a21 * a32 - a22 * a31;
        float b10 = a21 * a33 - a23 * a31;
        float b11 = a22 * a33 - a23 * a32;
        // Calculate the determinant
        float det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
        det = 1.0 / det;
        mat4 m = mat4(
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
    #endif
}

mat4 transpose_matrix(mat4 matrix) {
    #if __VERSION__ == 300
        return transpose(matrix);
    #else
        vec4 vector1 = matrix[0], vector2 = matrix[1], vector3 = matrix[2], vector4 = matrix[3];
        float a01 = vector1.y, a02 = vector1.z, a03 = vector1.w;
        float a12 = vector2.z, a13 = vector2.w;
        float a23 = vector3.w;
        mat4 m = mat4(
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
    #endif
}
