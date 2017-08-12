/// <reference path="three.js" />
/// <reference path="twgl.js" />
/// <reference path="pixi.min.js" />
/// <reference path="bundle.js" />

var canvas = document.getElementById('cvs');

//const glCanvas = new Fusion.gl.GLCanvas(canvas);

//const gl = glCanvas.getContext('webgl');

//const m4 = twgl.m4;
//const programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

//const arrays = {
//    position: [1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1],
//    normal: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1],
//    texcoord: [1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
//    indices: [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23],
//};
//const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

//const tex = twgl.createTexture(gl, {
//    min: gl.NEAREST,
//    mag: gl.NEAREST,
//    src: [
//      255, 255, 255, 255,
//      192, 192, 192, 255,
//      192, 192, 192, 255,
//      255, 255, 255, 255,
//    ],
//});

//const uniforms = {
//    u_lightWorldPos: [1, 8, -10],
//    u_lightColor: [1, 0.8, 0.8, 1],
//    u_ambient: [0, 0, 0, 1],
//    u_specular: [1, 1, 1, 1],
//    u_shininess: 50,
//    u_specularFactor: 1,
//    u_diffuse: tex,
//};

//twgl.resizeCanvasToDisplaySize(gl.canvas);
//gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

//function render(time) {
//    time = time * 0.001;
//    gl.enable(gl.DEPTH_TEST);
//    gl.enable(gl.CULL_FACE);
//    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

//    const fov = 30 * Math.PI / 180;
//    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
//    const zNear = 0.5;
//    const zFar = 10;
//    const projection = m4.perspective(fov, aspect, zNear, zFar);
//    const eye = [1, 4, -6];
//    const target = [0, 0, 0];
//    const up = [0, 1, 0];

//    const camera = m4.lookAt(eye, target, up);
//    const view = m4.inverse(camera);
//    const viewProjection = m4.multiply(projection, view);
//    const world = m4.rotationY(time);

//    uniforms.u_viewInverse = camera;
//    uniforms.u_world = world;
//    uniforms.u_worldInverseTranspose = m4.transpose(m4.inverse(world));
//    uniforms.u_worldViewProjection = m4.multiply(viewProjection, world);

//    gl.useProgram(programInfo.program);
//    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
//    twgl.setUniforms(programInfo, uniforms);
//    gl.drawElements(gl.TRIANGLES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
//    requestAnimationFrame(render);
//}
//requestAnimationFrame(render);
var scene, camera1;
init();
function init() {
    scene = new THREE.Scene();
    camera1 = new THREE.PerspectiveCamera(75, 800 / 600, 1, 10000);
    camera1.position.z = 1000;
    geometry = new THREE.BoxGeometry(900, 900, 900);
    material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    const glCanvas1 = new Fusion.gl.GLCanvas(canvas);
    renderer = new THREE.WebGLRenderer({
        canvas: glCanvas1,
        context: glCanvas1.getContext('webgl')
    });
    renderer.setSize(800, 600);
}

animate();

function animate() {
    requestAnimationFrame(animate);
    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.02;
    renderer.render(scene, camera1);
}



// The application will create a renderer using WebGL, if possible,
// with a fallback to a canvas render. It will also setup the ticker
// and the root stage PIXI.Container.
var app = new PIXI.Application({
    view:new Fusion.gl.GLCanvas(canvas),
});



// load the texture we need
PIXI.loader.add('bunny', 'bunny.png').load(function (loader, resources) {

    // This creates a texture from a 'bunny.png' image.
    var bunny = new PIXI.Sprite(resources.bunny.texture);

    // Setup the position of the bunny
    //bunny.x = app.renderer.width / 2;
    //bunny.y = app.renderer.height / 2;
    bunny.x = 20;
    bunny.y = 20;
    // Rotate around the center
    bunny.anchor.x = 0.5;
    bunny.anchor.y = 0.5;

    // Add the bunny to the scene we are building.
    app.stage.addChild(bunny);

    // Listen for frame updates
    app.ticker.add(function () {
        // each frame we spin the bunny around a bit
        bunny.rotation += 0.01;
    });
});

