const canvas = document.getElementById('cvs');
canvas.width = 800;
canvas.height = 600;
const glCanvas = new Fusion.gl.GLCanvas(canvas);


scene = new THREE.Scene(),
camera = new THREE.PerspectiveCamera(45, 800 / 600, 0.1, 1000),
renderer = new THREE.WebGLRenderer({ canvas: glCanvas });
//
renderer.setSize(800, 600);
const geometry = new THREE.BoxGeometry(1, 1, 1),
material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
cube = new THREE.Mesh(geometry, material);
//
scene.add(cube);
camera.position.z = 5;
cube.position.set(1.5,-1,0);
renderer.render(scene, camera);

const animate = function () {
requestAnimationFrame(animate);
cube.rotation.x += 0.1;
cube.rotation.y += 0.1;
renderer.render(scene, camera);
};

animate();



const vs = `precision mediump float;
uniform mat4 u_worldViewProjection;
uniform vec3 u_lightWorldPos;
uniform mat4 u_world;
uniform mat4 u_viewInverse;
uniform mat4 u_worldInverseTranspose;
attribute vec4 position;
attribute vec3 normal;
attribute vec2 texcoord;
varying vec4 v_position;
varying vec2 v_texCoord;
varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;
void main() {
v_texCoord = texcoord;
v_position = u_worldViewProjection * position;
v_normal = (u_worldInverseTranspose * vec4(normal, 0)).xyz;
v_surfaceToLight = u_lightWorldPos - (u_world * position).xyz;
v_surfaceToView = (u_viewInverse[3] - (u_world * position)).xyz;
gl_Position = v_position;
}`;

const fs = `precision mediump float;
varying vec4 v_position;
varying vec2 v_texCoord;
varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;

uniform vec4 u_lightColor;
uniform vec4 u_ambient;
uniform sampler2D u_diffuse;
uniform vec4 u_specular;
uniform float u_shininess;
uniform float u_specularFactor;
vec4 lit(float l ,float h, float m) {
return vec4(1.0,
max(l, 0.0),
(l > 0.0) ? pow(max(0.0, h), m) : 0.0,
1.0);
}
void main() {
vec4 diffuseColor = texture2D(u_diffuse, v_texCoord);
vec3 a_normal = normalize(v_normal);
vec3 surfaceToLight = normalize(v_surfaceToLight);
vec3 surfaceToView = normalize(v_surfaceToView);
vec3 halfVector = normalize(surfaceToLight + surfaceToView);
vec4 litR = lit(dot(a_normal, surfaceToLight),
dot(a_normal, halfVector), u_shininess);
vec4 outColor = vec4((
u_lightColor * (diffuseColor * litR.y + diffuseColor * u_ambient +
u_specular * litR.z * u_specularFactor)).rgb,
diffuseColor.a);
gl_FragColor = outColor;
}`;

const glCanvas2 = new Fusion.gl.GLCanvas(canvas);
    gl = glCanvas2.getContext('webgl'),
    m4 = twgl.m4,
    programInfo = twgl.createProgramInfo(gl, [vs, fs]);

const arrays = {
    position: [1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1],
    normal: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1],
    texcoord: [1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
    indices: [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23],
  };
  const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
  const tex = twgl.createTexture(gl, {
    min: gl.NEAREST,
    mag: gl.NEAREST,
    src: [
      255, 255, 255, 255,
      192, 192, 192, 255,
      192, 192, 192, 255,
      255, 255, 255, 255,
    ],
  });
  
  const uniforms = {
    u_lightWorldPos: [1, 8, -10],
    u_lightColor: [1, 0.8, 0.8, 1],
    u_ambient: [0, 0, 0, 1],
    u_specular: [1, 1, 1, 1],
    u_shininess: 50,
    u_specularFactor: 1,
    u_diffuse: tex,
  };
  
  twgl.resizeCanvasToDisplaySize(gl.canvas);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  
  const render = function(time) {
    time = time * 0.001;
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
    const fov = 30 * Math.PI / 180;
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.5;
    const zFar = 10;
    const projection = m4.perspective(fov, aspect, zNear, zFar);
    const eye = [1, 4, -6];
    const target = [0, 0, 0];
    const up = [0, 1, 0];
  
    const camera = m4.lookAt(eye, target, up);
    const view = m4.inverse(camera);
    const viewProjection = m4.multiply(projection, view);
    const world = m4.rotationY(time);
  
    uniforms.u_viewInverse = camera;
    uniforms.u_world = world;
    uniforms.u_worldInverseTranspose = m4.transpose(m4.inverse(world));
    uniforms.u_worldViewProjection = m4.multiply(viewProjection, world);
  
    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    twgl.setUniforms(programInfo, uniforms);
    gl.drawElements(gl.TRIANGLES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
