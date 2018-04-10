const text = `
attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec2 a_texCoord;

uniform mat4 u_projectionMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_modelMatrix;

varying vec3 Normal;
varying vec3 FragPosition;
varying vec2 TexCoord;

void main(){
    gl_Position = u_projectionMatrix*u_viewMatrix*u_modelMatrix*vec4(a_position,1.0);
    FragPosition = vec3(u_modelMatrix*vec4(a_position,1.0));
    Normal = a_normal;
    TexCoord = a_texCoord;
}`;

module.exports = text;