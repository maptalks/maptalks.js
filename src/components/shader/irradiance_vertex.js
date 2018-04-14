const text = `
attribute vec3 a_position;
varying vec3 FragPosition;

uniform mat4 u_projectionMatrix;
uniform mat4 u_viewMatrix;

void main(){
    FragPosition = a_position;
    gl_Position = u_projectionMatrix*u_viewMatrix*vec4(a_position,1.0);
}`;

module.exports = text;