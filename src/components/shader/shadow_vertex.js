const text =`

attribute vec3 a_position;

uniform mat4 u_projectionMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_modelMatrix;

void main(){
    gl_Position = u_projectionMatrix*u_viewMatrix*u_modelMatrix*vec4(a_position, 1.0);
}`;

module.exports = text;