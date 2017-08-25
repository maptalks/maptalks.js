/// <reference path="../lib/three.js" />
/// <reference path="../bundle.js" />

var canvas = document.getElementById('cvs');

var glCanvas = new Fusion.gl.GLCanvas(canvas);
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(45, 800/600, 0.1, 1000);

var renderer = new THREE.WebGLRenderer({
    //canvas:canvas
    canvas: glCanvas,
    context:glCanvas.getContext('webgl')
});
renderer.setSize(800,600);

var geometry = new THREE.BoxGeometry(1, 1, 1);
var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
var cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5;

var animate = function () {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.1;
    cube.rotation.y += 0.1;
    renderer.render(scene, camera);
};

animate();


//var scene2 = new THREE.Scene();
//var camera2 = new THREE.PerspectiveCamera(45, 800 / 600, 0.1, 1000);

//var renderer2 = new THREE.WebGLRenderer({
//    canvas:document.getElementById('cvs2')
//});
//renderer2.setSize(800, 600);

//var geometry2 = new THREE.BoxGeometry(1, 1, 1);
//var material2 = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
//var cube2 = new THREE.Mesh(geometry2, material2);
//scene2.add(cube2);

//camera2.position.z = 5;

//var animate2 = function () {
//    requestAnimationFrame(animate2);
//    cube2.rotation.x += 0.1;
//    cube2.rotation.y += 0.1;
//    renderer2.render(scene2, camera2);
//};

//animate2();