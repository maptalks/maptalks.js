const text = `precision mediump float;

const float PI = 3.1415926539;

uniform samplerCube environmentMap;
varying vec3 FragPosition;

void main(){
    vec3 envColor = textureCube(environmentMap, FragPosition).rgb;
    envColor = envColor / (envColor + vec3(1.0));
    envColor = pow(envColor, vec3(1.0/2.2)); 
    gl_FragColor = vec4(envColor, 1.0);
}`;

module.exports = text;