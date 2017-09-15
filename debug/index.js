/// <reference path="karma/lib/three.js" />
/// <reference path="karma/lib/bundle.js" />
/// <reference path="karma/lib/twgl.js" />
/// <reference path="karma/lib/xeogl.js" />
/// <reference path="karma/lib/playcanvas.js" />
/// <reference path="karma/lib/qtek.js" />


const canvas = document.getElementById('cvs');
canvas.width = 800;
canvas.height = 600;
const glCanvas = new Fusion.gl.GLCanvas(canvas);

var Shader = qtek.Shader;
var Material = qtek.Material;
var Mesh = qtek.Mesh;
var Cube = qtek.geometry.Cube;
var meshUtil = qtek.util.mesh;
var shaderLibrary = qtek.shader.library;
var animation = new qtek.animation.Animation;
animation.start();

var renderer = new qtek.Renderer({
    canvas: glCanvas,
    devicePixelRatio: 1.0
});

renderer.resize(window.innerWidth, window.innerHeight);
var scene = new qtek.Scene;
var camera = new qtek.camera.Perspective({
    aspect: renderer.getViewportAspect(),
    far: 500
});

var cube = new Cube();
cube.generateTangents();
var shader = shaderLibrary.get('qtek.standard', 'diffuseMap', 'normalMap');
var material = new Material({
    shader: shader
});
material.set('glossiness', 0.4);
var diffuse = new qtek.Texture2D;
diffuse.load("assets/textures/crate.gif");
var normal = new qtek.Texture2D;
normal.load("assets/textures/normal_map.jpg");
material.set('diffuseMap', diffuse);
material.set('normalMap', normal);

var root = new qtek.Node({
    name: 'ROOT'
});
scene.add(root);
for (var i = 0; i < 20; i++) {
    for (var j = 0; j < 10; j++) {
        for (var k = 0; k < 50; k++) {
            var mesh = new qtek.Mesh({
                geometry: cube,
                material: material
            });
            mesh.position.set(50 - Math.random() * 100, 50 - Math.random() * 100, 50 - Math.random() * 100);
            root.add(mesh);
        }
    }
}
var light = new qtek.light.Point({
    range: 200
});
scene.add(light);
scene.add(new qtek.light.Ambient({
    intensity: 0.4
}))

camera.position.set(0, 0, 10);

animation.on('frame', function (deltaTime) {
    var start = new Date().getTime();
    var drawInfo = renderer.render(scene, camera);
    var renderTime = new Date().getTime() - start;
    root.rotation.rotateY(Math.PI / 500);
});
