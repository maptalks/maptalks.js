# fusion.gl #
[![Build Status](https://travis-ci.org/axmand/fusion.gl.svg?branch=master)](https://travis-ci.org/axmand/fusion.gl)
[![codecov](https://codecov.io/gh/axmand/fusion.gl/branch/master/graph/badge.svg)](https://codecov.io/gh/axmand/fusion.gl)
[![npm version](https://badge.fury.io/js/fusion.gl.svg)](https://badge.fury.io/js/fusion.gl)

## Description ##
> a drawing container,only provide sample geometry such as boll,cube and physics engine.

### Dependency ###
> 1. headless-gl
```
npm install --global --production windows-build-tools
```
```
npm install gl
```
> 2. electron[optional]
```
npm install electron
```
### Usage ###
```
const canvas = doucment.createElement('canvas');
```
>with three.js
```

const glCanvas = new Fusion.gl.GLCanvas(canvas);

const gl = glCavnas.getContext('webgl');

const renderer = new THREE.WebGLRenderer({
    canvas:glCanvas
});

render.render(scene,camera);

// other code
```
>with twgl
```

const glCanvas2 = new Fusion.gl.GLCanvas(canvas);

const gl2 = glCanvas2.getContext('webgl');

const programInfo = twgl.createProgramInfo(gl2, ["vs", "fs"]);

const tex = twgl.createTexture(gl2,{...});

//other code

```
>with xeogl
```

const glCanvas2 = new GLCanvas(canvas);
        
xeogl.scene = new xeogl.Scene({
    canvas: glCanvas2,
    webgl2: false //specified webgl1/2 if needed
});

//other code

```
Creating GLCanvas instance every time when you want to mix with other WebGL library

