# fusion.gl
[![Build Status](https://travis-ci.org/axmand/fusion.gl.svg?branch=master)](https://travis-ci.org/axmand/fusion.gl)
[![npm version](https://badge.fury.io/js/fusion.gl.svg)](https://badge.fury.io/js/fusion.gl)
[![codecov](https://codecov.io/gh/axmand/fusion.gl/branch/master/graph/badge.svg)](https://codecov.io/gh/axmand/fusion.gl)
>a virtual webgl running context which can mix thirdly webgl library's gl commands togother,include [three.js](https://github.com/mrdoob/three.js),[claygl](https://github.com/pissang/claygl) and so on.
### example ###
[3D](http://139.129.7.130/fusion.gl/example/fusion.gl.3d.html)  
[vao](http://139.129.7.130/fusion.gl/example/fusion.gl.vao.html)  
[texture](http://139.129.7.130/fusion.gl/example/fusion.gl.texture.html)  
[three](http://139.129.7.130/fusion.gl/example/fusion.gl.three.html)  
[claygl](http://139.129.7.130/fusion.gl/example/fusion.gl.clay.html)  
[three&claygl](http://139.129.7.130/fusion.gl/example/fusion.gl.three.claygl.html)
### install ###
```javascript
npm install fusion.gl 
```
### example ###
> use fusion.gl with threejs
```javascript
// use virtual glCanvas instead of real canvas element
const glCanvas1 = new fusion.gl.GLCanvas('mapCanvas');
// init 3d scene by threejs
const camera = new THREE.PerspectiveCamera(70, 800 / 600, 0.01, 10);
camera.position.z = 1;
scene = new THREE.Scene();
geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
material = new THREE.MeshNormalMaterial();
mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);
renderer = new THREE.WebGLRenderer({
    canvas: glCanvas1,
    context: glCanvas1.getContext('webgl', {
        antialias: true
    })
});
renderer.setSize(800, 600);
renderer.render(scene, camera);
function animate() {
    requestAnimationFrame(animate);
    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.02;
    renderer.render(scene, camera);
}
animate();
// link to real htmlcanvaselement
glCanvas1.linkToCanvas(document.getElementById('mapCanvas'));
```
![threejs-1](https://user-images.githubusercontent.com/5127112/36083573-c4093c04-0fee-11e8-8d02-b1892672b739.png)
> use fusion.gl with claygl
```javascript
// use virtual glCanvas instead of real canvas element
const mapCanvas = document.getElementById('mapCanvas');
//mock html element attributes and functions
const mock = new fusion.gl.HtmlMock(mapCanvas, ['getBoundingClientRect', 'nodeName', 'width', 'height']);
const glCanvas2 = new fusion.gl.GLCanvas('mapCanvas',{mock:mock});
//init 3d scene by claygl
clay.application.create(glCanvas2, {
    event: true,
    graphic: { shadow: true },
    init: function (app) {
        this._camera = app.createCamera([0, 3, 8], [0, 1, 0]);
        app.createDirectionalLight([-1, -1, -1], '#fff', 0.7);
        app.createAmbientLight('#fff', 0.3);
        app.createCube();
        app.createSphere().position.set(2, 0, 0);
        app.createPlane().position.set(-2, 0, 0);
        app.createMesh(new clay.geometry.Cone()).position.set(4, 0, 0);
        app.createMesh(new clay.geometry.Cylinder()).position.set(-4, 0, 0);
        var roomCube = app.createCubeInside({
            roughness: 1,
            color: [0.3, 0.3, 0.3]
            });
            roomCube.silent = true;
            roomCube.castShadow = false;
            roomCube.scale.set(10, 10, 10);
            roomCube.position.y = 9;
            this._control = new clay.plugin.OrbitControl({
                target: this._camera,
                domElement: app.container
            });
        },
        loop: function (app) {
            this._control.update(app.frameTime);
        }
});
// link to real htmlcanvaselement
glCanvas2.linkToCanvas(document.getElementById('mapCanvas'));
```
![claygl-1](https://user-images.githubusercontent.com/5127112/36083571-bf0e5c34-0fee-11e8-9ebe-0c991440f216.png)
> mixture
```javascript
//these two scene will be painted on a canvas if virtual canvas linked to the same real htmlCanvasElement
glCanvas1.linkToCanvas(document.getElementById('mapCanvas'));
glCanvas2.linkToCanvas(document.getElementById('mapCanvas'));
```
![claygl-three-1](https://user-images.githubusercontent.com/5127112/36083586-f048e4d6-0fee-11e8-84e7-a826314b7a79.png)
### notice ####
> The tests are not yet finished, and all comments are welcome
