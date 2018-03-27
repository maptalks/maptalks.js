const text = `precision mediump float;

uniform samplerCube skybox;
varying vec3 TexCoords;

void main(){
    gl_FragColor=textureCube(skybox,TexCoords);
}`;

module.exports = text;