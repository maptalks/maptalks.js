/// <reference path="../lib/three.js" />
/// <reference path="../bundle.js" />
/// <reference path="../lib/xeogl.js" />

var canvas = document.getElementById('cvs');
canvas.width = 800;
canvas.heigh = 600;
var glCanvas = new Fusion.gl.GLCanvas(canvas);

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(45, 800 / 600, 0.1, 1000);

var renderer = new THREE.WebGLRenderer({
    //canvas:canvas
    canvas: glCanvas
});
renderer.setSize(800, 600);

var geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
var cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5;
renderer.render(scene, camera);

var animate = function () {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.1;
    cube.rotation.y += 0.1;
    renderer.render(scene, camera);
};

animate();

//var canvas2 = document.getElementById('cvs2');
//canvas2.width = 800;
//canvas2.heigh = 600;
var glCanvas2 = new Fusion.gl.GLCanvas(canvas);

xeogl.scene = new xeogl.Scene({
    canvas: glCanvas2,
    webgl2: false
});
new xeogl.Entity({
    geometry: new xeogl.BoxGeometry(),
    material: new xeogl.PhongMaterial({
        diffuseMap: new xeogl.Texture({
            src: "asset/uvgrid.jpg"
        })
    })
});
xeogl.scene.camera.view.eye = [0, 0, -5];
xeogl.scene.on("tick", function () {
    this.camera.view.rotateEyeY(0.2);
    this.camera.view.rotateEyeX(-0.1);
});
new xeogl.CameraControl();


const glCanvas3 = new Fusion.gl.GLCanvas(canvas);

const gl = glCanvas3.getContext('webgl');
const m4 = twgl.m4;
const programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

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

function render(time) {
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
