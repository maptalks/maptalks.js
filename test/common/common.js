const base_vs = `
attribute vec3 a_position;
attribute vec3 a_color;

void main(){
    gl_Position = vec4(a_position,1.0);
}`;

const base_fs = `void main() {
    gl_FragColor = vec4(1,0,0.5,1);
}`;

module.exports = {
    base_vs,
    base_fs
}