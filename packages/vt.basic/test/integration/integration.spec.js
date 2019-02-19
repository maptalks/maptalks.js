const maptalks = require('maptalks');
// const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { match, readSpecs } = require('./util');
const { GeoJSONVectorTileLayer } = require('@maptalks/vt');
require('../../dist/maptalks.vt.basic-dev');

const GENERATE_MODE = process.env.BUILD === 'fixtures';

const DEFAULT_VIEW = {
    center : [0, 0],
    zoom : 6,
    pitch : 0,
    bearing : 0
};

describe('vector tile integration specs', () => {
    let map, container;
    before(() => {
        container = document.createElement('div');
        container.style.width = '128px';
        container.style.height = '128px';
        document.body.appendChild(container);
    });

    afterEach(() => {
        map.remove();
    });

    const runner = (p, style) => {
        return done => {
            const options = style.view || DEFAULT_VIEW;
            map = new maptalks.Map(container, options);
            const layer = new GeoJSONVectorTileLayer('gvt', style);
            let count = 0;
            layer.on('layerload', () => {
                count++;
                if (count <= 1) {
                    return;
                }
                const renderer = layer.getRenderer();
                const canvas = renderer.canvas;
                const expectedPath = style.expected;
                if (GENERATE_MODE) {
                    //生成fixtures
                    const dataURL = canvas.toDataURL();
                    // remove Base64 stuff from the Image
                    const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');
                    fs.writeFile(expectedPath, base64Data, 'base64', done);
                } else {
                    //比对测试
                    match(canvas, expectedPath, done);
                }
            });
            layer.addTo(map);
        };
    };

    context('icon specs', () => {
        const iconSpecs = readSpecs(path.resolve(__dirname, 'fixtures', 'icon'));
        for (const p in iconSpecs) {
            if (iconSpecs.hasOwnProperty(p)) {
                it(p, runner(p, iconSpecs[p]));
            }
        }
    });

    context('text specs', () => {
        const iconSpecs = readSpecs(path.resolve(__dirname, 'fixtures', 'text'));
        for (const p in iconSpecs) {
            if (iconSpecs.hasOwnProperty(p)) {
                it(p, runner(p, iconSpecs[p]));
            }
        }
    });


});
