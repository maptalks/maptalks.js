# fusion.gl #
[![Build Status](https://travis-ci.org/axmand/fusion.gl.svg?branch=master)](https://travis-ci.org/axmand/fusion.gl)
[![codecov](https://codecov.io/gh/axmand/fusion.gl/branch/master/graph/badge.svg)](https://codecov.io/gh/axmand/fusion.gl)
[![npm version](https://badge.fury.io/js/fusion.gl.svg)](https://badge.fury.io/js/fusion.gl)

## Description ##
> a drawing container,only provide sample geometry such as boll,cube and physics engine.

### Install ###
```shell
npm install fusion.gl
```
### Dependency ###
> 1. headless-gl [optional]
```shell
npm install --global --production windows-build-tools
```
```shell
npm install gl
```
> 2. electron [optional]
```shell
npm install electron
```
### Usage ###
```javascript
const canvas = doucment.createElement('canvas');
```
> with three.js
```javascript

const glCanvas = new Fusion.gl.GLCanvas(canvas);

const gl = glCavnas.getContext('webgl');

const renderer = new THREE.WebGLRenderer({
    canvas:glCanvas
});

render.render(scene,camera);

/*other code*/
```
> with twgl
```javascript

const glCanvas2 = new Fusion.gl.GLCanvas(canvas);

const gl2 = glCanvas2.getContext('webgl');

const programInfo = twgl.createProgramInfo(gl2, ["vs", "fs"]);

const tex = twgl.createTexture(gl2,{...});

/*other code*/

```
> with xeogl
```javascript

const glCanvas3 = new Fusion.gl.GLCanvas(canvas);
        
xeogl.scene = new xeogl.Scene({
    canvas: glCanvas3,
    webgl2: false
});

/*other code*/

```
> with playcanvas
```javascript
const glCanvas4 = new Fusion.gl.GLCanvas(canvas);

const app = new pc.Application(glCanvas, { });

app.start();

```
> with qtek
```javascript
const glCanvas5 = new Fusion.gl.GLCanvas(canvas);

var renderer = new qtek.Renderer({
    canvas: glCanvas5,
    devicePixelRatio: 1.0
});

```

> creating instance of GLCanvas each time while you want to mix current library with others

