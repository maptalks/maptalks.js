//NUM_OF_DIR_LIGHTS is a pre-defined constant as count of directional lights

uniform mat4 lightProjView[NUM_OF_DIR_LIGHTS];

varying vec3 vLightSpacePos[NUM_OF_DIR_LIGHTS];

//worldPos = model * position
void computeShadowPars(vec4 worldPos) {
    for (int i = 0; i < NUM_OF_DIR_LIGHTS; i++) {
        vLightSpacePos[i] = lightProjView[i] * worldPos;
    }
}
