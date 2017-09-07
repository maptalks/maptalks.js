/// <reference path="karma/lib/three.js" />
/// <reference path="karma/lib/bundle.js" />
/// <reference path="karma/lib/twgl.js" />
/// <reference path="karma/lib/xeogl.js" />
/// <reference path="karma/lib/playcanvas.js" />

const canvas = document.getElementById('cvs');
canvas.width = 800;
canvas.height = 600;
const glCanvas =new Fusion.gl.GLCanvas(canvas);
//playcanvas
var app = new pc.Application(glCanvas, { });
app.start();

app.resizeCanvas(800, 600);

// fill the available space at full resolution
app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
app.setCanvasResolution(pc.RESOLUTION_AUTO);

// ensure canvas is resized when window changes size
window.addEventListener('resize', function() {
    app.resizeCanvas();
});

// create box entity
var cube = new pc.Entity('cube');
cube.addComponent('model', {
    type: 'box'
});

// create camera entity
var camera = new pc.Entity('camera');
camera.addComponent('camera', {
    clearColor: new pc.Color(0.1, 0.1, 0.1)
});

// create directional light entity
var light = new pc.Entity('light');
light.addComponent('light');

// add to hierarchy
app.root.addChild(cube);
app.root.addChild(camera);
app.root.addChild(light);

// set up initial positions and orientations
camera.setPosition(0, 0, 3);
light.setEulerAngles(45, 0, 0);

// register a global update event
app.on('update', function (deltaTime) {
    cube.rotate(10 * deltaTime, 20 * deltaTime, 30 * deltaTime);
});
