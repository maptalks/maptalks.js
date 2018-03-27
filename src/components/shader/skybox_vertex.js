const text = `
attribute vec3 a_position;
uniform mat4 u_projectionMatrix;
uniform mat4 u_viewMatrix;

varying vec3 TexCoords;

void main(){
    gl_Position = u_projectionMatrix * u_viewMatrix * vec4(a_position, 1.0);
    TexCoords = a_position;
}`;

module.exports = text;