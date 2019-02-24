const remote = require('electron').remote;
const maptalks = require('../common/maptalks');
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { match, readSpecs } = require('./util');
const { GeoJSONVectorTileLayer } = require('@maptalks/vt');
require('../../dist/maptalks.vt.basic-dev');

const GENERATE_MODE = (process.env.BUILD || remote.getGlobal('process').env.BUILD) === 'fixtures';

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
            options.centerCross = true;
            map = new maptalks.Map(container, options);
            const layer = new GeoJSONVectorTileLayer('gvt', style);
            let count = 0;
            layer.on('layerload', () => {
                count++;
                if (count <= 1) {
                    return;
                }
                const canvas = map.getRenderer().canvas;
                const expectedPath = style.expected;
                if (GENERATE_MODE) {
                    //生成fixtures
                    const dataURL = canvas.toDataURL();
                    // remove Base64 stuff from the Image
                    const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');
                    fs.writeFile(expectedPath, base64Data, 'base64', done);
                } else {
                    //比对测试
                    match(canvas, expectedPath, (err, result) => {
                        if (err) {
                            done(err);
                            return;
                        }
                        if (result.diffCount > 0) {
                            //保存差异图片
                            const dir = expectedPath.substring(0, expectedPath.length - 'expected.png'.length);
                            const diffPath = dir + 'diff.png';
                            writeImageData(diffPath, result.diffImage, result.width, result.height);
                            const actualPath = dir + 'actual.png';
                            writeImageData(actualPath, canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
                        }
                        assert(result.diffCount === 0);
                        done();
                    });
                }
            });
            layer.addTo(map);
        };
    };

    context('icon specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'fixtures', 'icon'));
        for (const p in specs) {
            if (specs.hasOwnProperty(p)) {
                it(p, runner(p, specs[p]));
            }
        }
    });

    context('text specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'fixtures', 'text'));
        for (const p in specs) {
            if (specs.hasOwnProperty(p)) {
                it(p, runner(p, specs[p]));
            }
        }
    });

    context('line specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'fixtures', 'line'));
        for (const p in specs) {
            if (specs.hasOwnProperty(p)) {
                it(p, runner(p, specs[p]));
            }
        }
    });

    context('polygon specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'fixtures', 'polygon'));
        for (const p in specs) {
            if (specs.hasOwnProperty(p)) {
                it(p, runner(p, specs[p]));
            }
        }
    });

});

const canvas = document.createElement('canvas');
function writeImageData(path, arr, width, height) {
    canvas.width = width;
    canvas.height = height;
    const imageData = canvas.getContext('2d').getImageData(0, 0, width, height);

    for (let i = 0; i < arr.length; i++) {
        imageData.data[i] = arr[i];
    }
    canvas.getContext('2d').putImageData(imageData, 0, 0);
    const dataURL = canvas.toDataURL();
    const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(path, base64Data, 'base64');
}
