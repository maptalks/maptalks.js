//
const glCanvas = new fusion.gl.GLCanvas('mapCanvas');
const gl = glCanvas.getContext('webgl');
const camera = new fusion.gl.PerspectiveCamera(60, 800 / 600, 1, 2000);
camera.position = [0, 7, 18];
const renderer = new fusion.gl.Renderer({ gl: gl });

const light = new fusion.gl.PointLight();

OBJ.downloadMeshes({ "single": "./assets/MK2Drone/MK2DroneCore.obj" }, function (meshs) {
  const model = new fusion.gl.Model({
    vertices: meshs.single.vertices,
    indices: meshs.single.indices,
    textureCoords: meshs.single.textures,
    normals: meshs.single.vertexNormals
  });
  const animate = function () {
    renderer.render(camera, [model], light);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
});

glCanvas.linkToCanvas(document.getElementById('mapCanvas'));


