const fs = require('fs');
const path = require('path');
//export packages info
const packages = [
    {
        name: 'maptalks',
        umdPath: '../maptalks/dist/maptalks.js',
        //exclude some variables
        exclude: []
    },
    {
        name: '@maptalks/gpu',
        umdPath: '../gpu/dist/maptalksgpu.js',
        //exclude some variables
        exclude: []
    },
    {
        name: '@maptalks/vt',
        umdPath: '../vt/dist/maptalks.vt.js',
        //exclude some variables
        exclude: []
    },
    {
        name: '@maptalks/3dtiles',
        umdPath: '../layer-3dtiles/dist/maptalks.3dtiles.js',
        //exclude some variables
        exclude: []
    },
    {
        name: '@maptalks/gltf-layer',
        umdPath: '../layer-gltf/dist/maptalks.gltf.js',
        //exclude some variables
        exclude: []
    },
    {
        name: '@maptalks/transform-control',
        umdPath: '../transform-control/dist/transform-control.js',
        //exclude some variables
        exclude: []
    },
    {
        name: '@maptalks/video-layer',
        umdPath: '../layer-video/dist/maptalks.video.js',
        //exclude some variables
        exclude: []
    }
];

let code = ``;

//generate index.js code
packages.forEach(item => {
    const { name, umdPath, exclude } = item;
    const namespace = require(umdPath);
    const keys = Object.keys(namespace).filter(key => {
        return !(exclude || []).includes(key);
    });
    const exportStr = keys.join(', ');
    if (name === 'maptalks' || name === '@maptalks/gpu') {
        code += `export { ${exportStr} } from '${name}';\n`;
    } else {
        const gpuName = umdPath.substring(umdPath.lastIndexOf('/') + 1).replace('.js', '.gpu.es.js');
        code += `export { ${exportStr} } from '${name}/dist/${gpuName}';\n`;
    }
});
//write index.d.ts
fs.writeFileSync(path.resolve(__dirname, './index.d.ts'), code);

code += `
import { transcoders } from '@maptalks/gpu';
if (typeof window !== 'undefined') {
    // transcoders are registered at maptalksgl namespace
    // @ts-expect-error-error
    window.maptalksgl = window.maptalksgl || {};
    // @ts-expect-error-error
    window.maptalksgl.transcoders = window.maptalksgl.transcoders || transcoders;
}
`
//write index.js
fs.writeFileSync(path.resolve(__dirname, './index.js'), code);
