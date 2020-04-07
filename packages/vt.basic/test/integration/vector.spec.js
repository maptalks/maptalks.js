const maptalks = require('maptalks');
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { match, readSpecs } = require('./util');
const { Point3DLayer } = require('@maptalks/vt');
require('../../dist/maptalks.vt.basic');

const DEFAULT_VIEW = {
    center: [0, 0],
    zoom: 6,
    pitch: 0,
    bearing: 0,
    lights: {
        ambient: {
            color: [0.1, 0.1, 0.1]
        },
        directional: {
            color: [0.1, 0.1, 0.1],
            direction: [1, 0, -1],
        }
    }
};

describe('vector 3d integration specs', () => {
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

    const runner = (p, Layer, style) => {
        return done => {
            const options = style.view || DEFAULT_VIEW;
            options.centerCross = true;
            if (!options.lights) {
                options.lights = DEFAULT_VIEW.lights;
            }
            map = new maptalks.Map(container, options);
            const layer = new Layer('vector', style.data, style.options);
            layer.once('canvasisdirty', () => {
                const canvas = map.getRenderer().canvas;
                const expectedPath = style.expected;
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
            });
            layer.addTo(map);
        };
    };


    context('icon specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'vector-fixtures', 'icon'));
        for (const p in specs) {
            if (specs.hasOwnProperty(p)) {
                it('point3d-' + p, runner(p, Point3DLayer, specs[p]));
            }
        }
    });

    // context('text specs', () => {
    //     const specs = readSpecs(path.resolve(__dirname, 'vector-fixtures', 'text'));
    //     for (const p in specs) {
    //         if (specs.hasOwnProperty(p)) {
    //             it(p, runner(p, specs[p]));
    //         }
    //     }
    // });

    // context('line specs', () => {
    //     const specs = readSpecs(path.resolve(__dirname, 'vector-fixtures', 'line'));
    //     for (const p in specs) {
    //         if (specs.hasOwnProperty(p)) {
    //             it(p, runner(p, specs[p]));
    //         }
    //     }
    // });

    // context('polygon specs', () => {
    //     const specs = readSpecs(path.resolve(__dirname, 'vector-fixtures', 'polygon'));
    //     for (const p in specs) {
    //         if (specs.hasOwnProperty(p)) {
    //             it(p, runner(p, specs[p]));
    //         }
    //     }
    // });
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
