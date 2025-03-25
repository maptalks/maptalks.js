const fs = require('fs');
const path = require('path');
//export packages info
const packages = [
    {
        name: 'maptalks',
        umdPath: '../maptalks/dist/maptalks.js'
    },
    {
        name: '@maptalks/gl',
        umdPath: '../gl/dist/maptalksgl.js'
    },
    {
        name: '@maptalks/vt',
        umdPath: '../vt/dist/maptalks.vt.js'
    },
    {
        name: '@maptalks/3dtiles',
        umdPath: '../layer-3dtiles/dist/maptalks.3dtiles.js'
    },
    {
        name: '@maptalks/gltf-layer',
        umdPath: '../layer-gltf/dist/maptalks.gltf.js'
    },
    {
        name: '@maptalks/transform-control',
        umdPath: '../transform-control/dist/transform-control.js'
    },
    {
        name: '@maptalks/video-layer',
        umdPath: '../layer-video/dist/maptalks.video.js'
    }
];

let code = ``;

//generate index.js code
packages.forEach(item => {
    const { name, umdPath } = item;
    const namespace = require(umdPath);
    const keys = Object.keys(namespace);
    const exportStr = keys.join(', ');
    code += `export { ${exportStr} } from '${name}';\n`;
});

code += `
import { transcoders } from '@maptalks/gl';
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