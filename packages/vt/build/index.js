import * as maptalks from 'maptalks';
import * as maptalksgl from '@maptalks/gl';

//refereing maptalksgl to include it in rollup bundle
const mat4 = maptalksgl.mat4;
mat4.create();

import chunk from './worker.js';

if (maptalksgl.transcoders) {
    const version = maptalks.Map.VERSION;
    if (version.indexOf("1.0.0-beta") >= 0 || version.indexOf("1.0.0-alpha") >= 0) {
        const transcoderInjected = maptalksgl.transcoders.inject(chunk);
        maptalks.registerWorkerAdapter('@maptalks/vt', transcoderInjected);
    } else {
        maptalks.registerWorkerAdapter('@maptalks/vt', function () {
            const transcoderInjected = maptalksgl.transcoders.inject(chunk);
            return transcoderInjected;
        });
    }
} else {
    maptalks.registerWorkerAdapter('@maptalks/vt', chunk);
}
export * from '../src/layer/';
