/**
 * default canvas area
 */
const full_vertex = `
    precision mediump float;

    attribute vec2 a_position;
    varying vec2 v_coordinates;

    void main(){
        v_coordinates = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
    }`;
/**
 * ocean vertex
 */
const ocean_vertex = `
    precision mediump float;
    
    attribute vec3 a_position;
    attribute vec2 a_coordinates;
    varying vec3 v_position;
    varying vec2 v_coordinates;
    uniform mat4 u_projectionMatrix;
    uniform mat4 u_viewMatrix;
    uniform float u_size;
    uniform float u_geometrySize;
    uniform sampler2D u_displacementMap;

    void main(){
        vec3 position = a_position + texture2D(u_displacementMap, a_coordinates).rgb * (u_geometrySize / u_size);
        v_position = position;
        v_coordinates = a_coordinates;
        gl_Position = u_projectionMatrix * u_viewMatrix * vec4(position, 1.0);
        gl_Position = u_projectionMatrix * u_viewMatrix * vec4(a_position, 1.0);
    }`;

module.exports = {
    full_vertex,
    ocean_vertex
};