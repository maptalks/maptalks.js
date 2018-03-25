const std_vs =`
//顶点坐标
attribute vec3 a_position;
//法线
attribute vec3 a_normal;
//纹理坐标
attribute vec2 a_texCoord;
//投影矩阵
uniform mat4 u_projectionMatrix;
//视图矩阵
uniform mat4 u_viewMatrix;
//模型矩阵
uniform mat4 u_modelMatrix;
//传递法线
varying vec3 Normal;
//frag计算
varying vec3 FragPosition;
//模型坐标
varying vec2 TexCoord;

void main(){
    gl_Position = u_projectionMatrix*u_viewMatrix*u_modelMatrix*vec4(a_position,1.0);
    FragPosition = vec3(u_modelMatrix*vec4(a_position,1.0));
    Normal = a_normal;
    TexCoord = a_texCoord;
}`;

module.exports = std_vs;