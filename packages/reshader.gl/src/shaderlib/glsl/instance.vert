attribute vec4 instance_vectorA;
attribute vec4 instance_vectorB;
attribute vec4 instance_vectorC;
attribute vec4 instance_vectorD;
attribute vec4 instance_color;

mat4 instance_getAttributeMatrix() {
    mat4 mat = mat4(
        instance_vectorA,
        instance_vectorB,
        instance_vectorC,
        instance_vectorD
    );
    return mat;
}

vec4 instance_getInstanceColor() {
    return instance_color;
}
