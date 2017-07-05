precision highp float;

attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;
varying vec2 vTextureCoord;
void main(void){
    gl_Position = vec4(aVertexPosition, 0.0, 1.0);
    vTextureCoord = aTextureCoord;
}
