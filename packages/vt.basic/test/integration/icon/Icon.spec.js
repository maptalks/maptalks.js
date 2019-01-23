const maptalks = require('maptalks');
// const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { match } = require('../util');
const { GeoJSONVectorTileLayer } = require('@maptalks/vt');
require('../../../dist/maptalks.vt.basic-dev');
const styles = require('./fixtures/');

const GENERATE_MODE = process.env.BUILD === 'fixtures';

describe('icon specs', () => {
    let map, container;
    before(() => {
        container = document.createElement('div');
        container.style.width = '300px';
        container.style.height = '300px';
        document.body.appendChild(container);
        map = new maptalks.Map(container, {
            center : [0, 0],
            zoom : 19
        });
    });

    afterEach(() => {
        const layers = map.getLayers();
        layers.forEach(layer => {
            map.removeLayer(layer);
        });
    });

    const runner = p => {
        return done => {
            const layer = new GeoJSONVectorTileLayer('gvt', styles[p]);
            let count = 0;
            layer.on('layerload', () => {
                count++;
                if (count <= 1) {
                    return;
                }
                const renderer = layer.getRenderer();
                const canvas = renderer.canvas;
                const expectedPath = path.resolve(__dirname, 'fixtures', p, 'expected.png');
                if (GENERATE_MODE) {
                    const dataURL = canvas.toDataURL();
                    // remove Base64 stuff from the Image
                    const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');
                    fs.writeFile(expectedPath, base64Data, 'base64', done);
                    done();
                } else {
                    match(canvas, expectedPath, done);
                }
            });
            layer.addTo(map);
        };
    };

    for (const p in styles) {
        if (styles.hasOwnProperty(p)) {
            it(p, runner(p));
        }
    }
});
