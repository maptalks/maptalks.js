const text = `
attribute vec3 a_position;
varying vec3 FragPosition;

uniform mat4 u_projectionMatrix;
uniform mat4 u_viewMatrix;

void main(){
    FragPosition = a_position;
    mat4 rotView = mat4(mat3(u_viewMatrix));
    vec4 clipPos = u_projectionMatrix * rotView * vec4(FragPosition, 1.0);
    gl_Position = clipPos.xyww;
}`;

module.exports = text;