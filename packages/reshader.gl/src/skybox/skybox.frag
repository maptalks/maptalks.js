precision mediump float;

varying vec3 worldPos;

uniform samplerCube cubeMap;

void main()
{
    vec3 envColor = textureCube(cubeMap, worldPos).rgb;

    #ifdef USE_HDR
    envColor = envColor / (envColor + vec3(1.0));
    envColor = pow(envColor, vec3(1.0/2.2));
    #endif

    gl_FragColor = vec4(envColor, 1.0);
}
