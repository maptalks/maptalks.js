#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;

in vec4 a_color;
// A matrix to transform the positions by
uniform mat4 u_matrix;

// a varying to pass the color to the fragment shader
out vec4 v_color;

// all shaders have a main function
void main() {
  // Multiply the position by the matrix.
  gl_Position = u_matrix * a_position;
  // Pass the color to the fragment shader.
  v_color = a_color;
}