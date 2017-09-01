/// <reference path="../lib/three.js" />
/// <reference path="../bundle.js" />

var canvas = document.getElementById('cvs');

var glCanvas = new Fusion.gl.GLCanvas(canvas);

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(45, 800 / 600, 0.1, 1000);

var renderer = new THREE.WebGLRenderer({
    //canvas:canvas
    canvas: glCanvas
});
renderer.setSize(800, 600);

var geometry = new THREE.BoxGeometry(1, 1, 1);
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

var glCanvas2 = new Fusion.gl.GLCanvas(canvas);



//var context = new Four.Context({
//    width : 800,
//    height :600,
//});
//context.canvas = glCanvas2;
//context.contextualise();cvs2
var context = new Four.Context({ selector:'#cvs2'});
var points = new Four.OBJMeshLoader({ path: 'asset/points.obj', indexed: true });
var bundle = new Four.Bundle({ items: [points] });

bundle.ready(function () {
    var program = new Four.Program({ selector: '.renderer' });
    var light = new Four.PointLight({ diffuse: 0xFFD1B2, location: [10, 15, 0] });
    var mesh = new Four.Mesh({ loader: points, usage: 'DYNAMIC_DRAW', primitive: 'LINES' });
    var cloth = new Four.Cloth({ mesh: mesh, stiffness: 10000, damping: 1, solver: 'SIMPLECTIC' });
    var view2 = new Four.Framebuffer();
    var camera2 = new Four.PerspectiveCamera({ location: [10, 5, 5], width: context.canvas.width, height: context.canvas.height });
    var scene2 = new Four.Scene();
    var particles = cloth.particles;
    for (var i = 0; i < 10; i++) particles[i].freeze();
    scene2.use(program);
    scene2.put(light);
    scene2.put(cloth);
    scene2.translation = [0, 5, 0];
    scene2.animate(view2, camera2);
    console.log(cloth);
    window.cloth = cloth;
});
