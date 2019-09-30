#include <invert_matrix>
#ifdef HAS_INSTANCE
    #include <instance_vert>
    varying vec4 vInstanceColor;
#endif

#ifdef HAS_SKIN
    uniform int skinAnimation;
    #include <skin_vert>
#endif

#ifdef HAS_MORPH
    attribute vec3 POSITION_0;
    attribute vec3 POSITION_1;
    attribute vec3 POSITION_2;
    attribute vec3 POSITION_3;
    #ifdef HAS_MORPHNORMALS
        attribute vec3 NORMAL_0;
        attribute vec3 NORMAL_1;
        attribute vec3 NORMAL_2;
        attribute vec3 NORMAL_3;
    #endif
    uniform vec4 weights;
#endif

struct FrameUniforms {
    mat4 modelMatrix;
    mat4 normalMatrix;
} frameUniforms;

mat4 getModelMatrix() {
    #ifdef HAS_INSTANCE
        vInstanceColor = instance_getInstanceColor();
        mat4 attributeMatrix = instance_getAttributeMatrix();
        #ifdef HAS_SKIN
            mat4 worldMatrix;
            if (skinAnimation == 1) {
                worldMatrix = attributeMatrix * skin_getSkinMatrix();
            } else {
                worldMatrix = attributeMatrix;
            }
        #else
            mat4 worldMatrix = attributeMatrix;
        #endif
    #else
        #ifdef HAS_SKIN
            mat4 worldMatrix;
            if (skinAnimation == 1) {
                worldMatrix = modelMatrix * skin_getSkinMatrix();
            } else {
                worldMatrix = modelMatrix;
            }
        #else
            mat4 worldMatrix = modelMatrix;
        #endif
    #endif
    return worldMatrix;
}

vec4 getPosition(vec3 aPosition) {
    #ifdef HAS_MORPH
        vec4 POSITION = vec4(aPosition + weights.x * POSITION_0 + weights.y * POSITION_1 + weights.z * POSITION_2 + weights.w * POSITION_3, 1.0);
   #else
        vec4 POSITION = vec4(aPosition, 1.0);
    #endif
    return POSITION;
}

mat4 getNormalMatrix(mat4 worldMatrix) {
    mat4 inverseMat = invert_matrix(worldMatrix);
    mat4 normalMat = transpose_matrix(inverseMat);
    return normalMat;
}

vec4 getNormal(vec3 NORMAL) {
    #ifdef HAS_MORPHNORMALS
        vec4 normal = vec4(NORMAL + weights.x * NORMAL_0 + weights.y * NORMAL_1 + weights.z * NORMAL_2 + weights.w * NORMAL_3, 1.0);
    #else
        vec4 normal = vec4(NORMAL, 1.0);
    #endif
    return normal;
}
