attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec3 aColor;

uniform mat4 projViewModelMatrix; //
uniform mat4 modelMatrix;
uniform mat3 normalMatrix; //法线矩阵

varying vec3 vNormal;
varying vec3 vFragPos;
varying vec3 vColor;

#ifdef USE_EXTRUSION_OPACITY
    attribute float aExtrusionOpacity;
    varying float vExtrusionOpacity;
#endif

void main()
{
    vec4 pos = vec4(aPosition, 1.0);
    gl_Position = projViewModelMatrix * pos;
    vNormal = normalMatrix * aNormal;
    vFragPos = vec3(modelMatrix * pos);
    vColor = aColor / 255.0;

    #ifdef USE_EXTRUSION_OPACITY
        vExtrusionOpacity = aExtrusionOpacity;
    #endif
}
