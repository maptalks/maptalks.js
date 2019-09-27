attribute vec4 instance_vectorA;
attribute vec4 instance_vectorB;
attribute vec4 instance_vectorC;
attribute vec4 instance_vectorD;
attribute vec4 instance_color;

mat4 instance_getAttributeMatrix() {
    mat4 mat = mat4(
        instance_vectorA.x, instance_vectorA.y, instance_vectorA.z, instance_vectorA.w,
        instance_vectorB.x, instance_vectorB.y, instance_vectorB.z, instance_vectorB.w,
        instance_vectorC.x, instance_vectorC.y, instance_vectorC.z, instance_vectorC.w,
        instance_vectorD.x, instance_vectorD.y, instance_vectorD.z, instance_vectorD.w
    );
    return mat;
}

vec4 instance_getInstanceColor() {
    return instance_color;
}