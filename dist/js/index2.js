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


//entity.scene.on("tick", function () {
//    entity.camera.view.rotateEyeY(0.2);
//    entity.camera.view.rotateEyeX(0.1);
//});
//new xeogl.CameraControl();

