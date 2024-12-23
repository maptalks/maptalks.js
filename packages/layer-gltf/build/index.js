import * as maptalks from '@maptalks/map';
import * as maptalksgl from '@maptalks/gl';

import chunk from './worker.js';

if (maptalksgl.transcoders) {
    const version = maptalks.Map.VERSION;
    if (version.indexOf("1.0.0-beta") >= 0 || version.indexOf("1.0.0-alpha") >= 0) {
        const transcoderInjected = maptalksgl.transcoders.inject(chunk);
        maptalks.registerWorkerAdapter('@maptalks/gltf-layer', transcoderInjected);
    } else {
        maptalks.registerWorkerAdapter('@maptalks/gltf-layer', function () {
            const transcoderInjected = maptalksgl.transcoders.inject(chunk);
            return transcoderInjected;
        });
    }
} else {
    maptalks.registerWorkerAdapter('@maptalks/gltf-layer', chunk);
}

export * from '../src/index';
