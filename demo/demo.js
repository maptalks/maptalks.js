
const glCanvas = new fusion.gl.GLCanvas('mapCanvas');
const gl = glCanvas.getContext('webgl');
const camera = new fusion.gl.PerspectiveCamera(60, 800 / 600, 1, 2000);
camera.position = [0, 0, 0.2];
const renderer = new fusion.gl.Renderer({ gl: gl });
//
const light = new fusion.gl.PointLight();

const skybox = new fusion.gl.Skybox('./assets/skybox/');

const animate = function () {
  renderer.render(camera, [skybox], light);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);


//
// const p = OBJ.downloadModels([{
//   name: "MK2DroneCore",
//   obj: "./assets/MK2Drone/MK2DroneCore.obj",
//   mtl: true,
//   downloadMtlTextures:true
// }]);
// //
// p.then(models => {
//   for ([name, mesh] of Object.entries(models)) {
//     const model = new fusion.gl.Model({
//       vertices: mesh.vertices,
//       indices: mesh.indices,
//       textureCoords: mesh.textures,
//       normals: mesh.vertexNormals,
//       image:mesh.materialsByIndex[0].mapDiffuse.texture
//     });
//     const animate = function () {
//       renderer.render(camera, [model], light);
//       requestAnimationFrame(animate);
//     }
//     requestAnimationFrame(animate);
//   }
// });
//
glCanvas.linkToCanvas(document.getElementById('mapCanvas'));


