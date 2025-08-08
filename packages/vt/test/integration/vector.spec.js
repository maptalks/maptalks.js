const maptalks = require('maptalks');
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { match, readSpecs, hasOwn } = require('./util');
const { PointLayer, LineStringLayer, PolygonLayer, ExtrudePolygonLayer } = require('../../dist/maptalks.vt.js');
const { GroupGLLayer } = require('@maptalks/gl');

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
        // const iconDebug = document.createElement('canvas');
        // iconDebug.id = 'MAPTALKS_ICON_DEBUG';
        // document.body.appendChild(iconDebug);
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
            const count = style.renderingCount || 1;
            container.style.width = (style.containerWidth || 128) + 'px';
            container.style.height = (style.containerHeight || 128) + 'px';
            options.devicePixelRatio = 1;
            map = new maptalks.Map(container, options);
            const layer = new Layer('vector', style.data, style.options);
            let counter = 0;
            layer.on('canvasisdirty', () => {
                counter++;
                if (counter < count || counter > count) {
                    return;
                }
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
                        writeImageData(actualPath, canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
                    }
                    assert(result.diffCount === 0);
                    done();
                });
            });
            if (style.options && style.options.enableBloom) {
                const sceneConfig = {
                    postProcess: {
                        enable: true,
                        bloom: { enable: true },
                        ssr: { enable: true }
                    }
                };
                const groupLayer = new GroupGLLayer('group', [layer], { sceneConfig });
                groupLayer.addTo(map);
            } else {
                layer.addTo(map);
            }
            // const vLayer = new maptalks.VectorLayer('v').addTo(map);
            // vLayer.addGeometry(new maptalks.Circle(map.locate(map.getCenter(), 4000, 0), 4000));
        };
    };


    context('icon specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'vector-fixtures', 'icon'));
        for (const p in specs) {
            if (hasOwn(specs, p)) {
                it('icon-' + p, runner(p, PointLayer, specs[p]));
            }
        }
    });

    context('line specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'vector-fixtures', 'line'));
        for (const p in specs) {
            if (hasOwn(specs, p)) {
                it('line-' + p, runner(p, LineStringLayer, specs[p]));
            }
        }
    });

    context('polygon specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'vector-fixtures', 'polygon'));
        for (const p in specs) {
            if (hasOwn(specs, p)) {
                it('polygon-' + p, runner(p, PolygonLayer, specs[p]));
            }
        }
    });

    context('extrude specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'vector-fixtures', 'extrude'));
        for (const p in specs) {
            if (hasOwn(specs, p)) {
                it('extrude-' + p, runner(p, ExtrudePolygonLayer, specs[p]));
            }
        }
    });

    context('layer opacity and altitude specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'vector-fixtures', 'opacity-min-altitude'));
        for (const p in specs) {
            if (hasOwn(specs, p)) {
                if (!specs[p].options) {
                    specs[p].options = {};
                }
                if (specs[p].options.opacity === undefined) {
                    specs[p].options.opacity = 0.5;
                }
                if (specs[p].options.altitude === undefined) {
                    specs[p].options.altitude = 80000;
                }
                it('options-' + p, runner(p, getLayerClazz(specs[p].layerClass), specs[p]));
            }
        }
    });
});

const canvas = document.createElement('canvas');
function writeImageData(path, arr, width, height) {
    canvas.width = width;
    canvas.height = height;
    const imageData = canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, width, height);

    for (let i = 0; i < arr.length; i++) {
        imageData.data[i] = arr[i];
    }
    canvas.getContext('2d', { willReadFrequently: true }).putImageData(imageData, 0, 0);
    const dataURL = canvas.toDataURL();
    const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(path, base64Data, 'base64');
}


function getLayerClazz(className) {
    if (className === 'ExtrudePolygonLayer') {
        return ExtrudePolygonLayer;
    } else if (className === 'LineStringLayer') {
        return LineStringLayer;
    } else if (className === 'PolygonLayer') {
        return PolygonLayer;
    } else if (className === 'PointLayer') {
        return PointLayer;
    }
}
