attribute vec3 aPosition;
#ifdef USE_BASECOLORTEXTURE
    attribute vec2 TEXCOORD_0;
    varying vec2 vTexCoords;
#endif
attribute vec3 NORMAL;

varying vec4 vFragPos;
varying vec3 vNormal;
uniform mat4 projViewModelMatrix;
uniform mat4 projViewMatrix;
uniform mat4 normalMatrix;
uniform mat4 modelMatrix;

#ifdef USE_INSTANCE
    #include <instance_vert>
    varying vec4 vInstanceColor;
#endif

void main()
{
    #ifdef USE_INSTANCE
        mat4 attributeMatrix = instance_getAttributeMatrix();
        vFragPos = attributeMatrix * vec4(aPosition, 1.0);
        mat4 inverseMat = instance_invert(attributeMatrix);
        mat4 normalMat = instance_transpose(inverseMat);
        vNormal = normalize(vec3(normalMat * vec4(NORMAL, 1.0)));
        gl_Position = instance_drawInstance(aPosition, projViewMatrix);
        vInstanceColor = instance_getInstanceColor();
    #else
        vFragPos = modelMatrix * vec4(aPosition, 1.0);
        vNormal = normalize(vec3(normalMatrix * vec4(NORMAL, 1.0)));
        gl_Position = projViewModelMatrix * vec4(aPosition, 1.0);
    #endif
    #ifdef USE_BASECOLORTEXTURE
        vTexCoords = TEXCOORD_0;
    #endif
}
