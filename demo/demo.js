// const fusion = require('./../src/init');
// const glCanvas = new fusion.gl.GLCanvas('mapCanvas');
// const gl = glCanvas.getContext('webgl');
const gl = document.getElementById('mapCanvas').getContext('webgl');
//
const camera = new fusion.gl.PerspectiveCamera(60, 800 / 600, 1, 2000);
camera.position = [0, 0, 3];
const renderer = new fusion.gl.Renderer({ gl: gl });
const light = new fusion.gl.PointLight();
light.setPosition([0, 0, 4]);
const water = new fusion.gl.Water();
renderer.render(camera, water, light);
const animate = function (detla) {
  renderer.render(camera, water, light);
  setTimeout(animate,16);
}
setTimeout(animate,16);

// glCanvas.linkToCanvas(document.getElementById('mapCanvas'));


