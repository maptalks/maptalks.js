#define SHADER_NAME CUBEMAP
precision highp float;

uniform samplerCube cubeMap;
varying vec3 vWorldPos;

void main()
{
    vec4 glFragColor = textureCube(cubeMap, vWorldPos);
    #if __VERSION__ == 100
        gl_FragColor = glFragColor;
    #endif

}
