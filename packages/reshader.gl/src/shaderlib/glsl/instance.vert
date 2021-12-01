attribute vec4 instance_vectorA;
attribute vec4 instance_vectorB;
attribute vec4 instance_vectorC;

mat4 instance_getAttributeMatrix() {
    mat4 mat =  mat4(
        instance_vectorA.x, instance_vectorB.x, instance_vectorC.x, 0.0,
        instance_vectorA.y, instance_vectorB.y, instance_vectorC.y, 0.0,
        instance_vectorA.z, instance_vectorB.z, instance_vectorC.z, 0.0,
        instance_vectorA.w, instance_vectorB.w, instance_vectorC.w, 1.0
    );
    return mat;
}

#ifdef HAS_INSTANCE_COLOR
    attribute vec4 instance_color;
    vec4 instance_getInstanceColor() {
        return instance_color;
    }
#endif
