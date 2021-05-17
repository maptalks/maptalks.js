const remote = require('electron').remote;
const maptalks = require('maptalks');
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { match, readSpecs } = require('./util');
const { GeoJSONVectorTileLayer } = require('@maptalks/vt');
const { GroupGLLayer } = require('@maptalks/gl');
require('../../dist/maptalks.vt.basic');

const GENERATE_MODE = (process.env.BUILD || remote.getGlobal('process').env.BUILD) === 'fixtures';

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
            if (!options.lights) {
                options.lights = DEFAULT_VIEW.lights;
            }
            const eventName = style.eventName || 'canvasisdirty';
            const limit = style.renderingCount || 1;
            map = new maptalks.Map(container, options);
            style.debugCollision = true;
            const layer = new GeoJSONVectorTileLayer('gvt', style);
            let generated = false;
            let count = 0;
            layer.on(eventName, () => {
                count++;
                const canvas = map.getRenderer().canvas;
                const expectedPath = style.expected;
                if (GENERATE_MODE) {
                    //生成fixtures
                    const dataURL = canvas.toDataURL();
                    // remove Base64 stuff from the Image
                    const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');
                    fs.writeFile(expectedPath, base64Data, 'base64', () => {});
                    if (!generated) {
                        generated = true;
                        done();
                    }
                } else if (count >= limit) {
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
                } else {
                    map.getRenderer().setToRedraw();
                }
            });
            layer.addTo(map);
        };
    };

    const postProcessRunner = (p, style) => {
        let finished = false;
        return done => {
            const options = style.view || DEFAULT_VIEW;
            options.centerCross = true;
            if (!options.lights) {
                options.lights = DEFAULT_VIEW.lights;
            }
            map = new maptalks.Map(container, options);
            style.debugCollision = true;
            // style.debug = true;
            const layer = new GeoJSONVectorTileLayer('gvt', style);
            const sceneConfig = style.sceneConfig;
            const groupLayer = new GroupGLLayer('group', [layer], { sceneConfig });
            let generated = false;
            const limit = style.renderingCount || 1;
            const diffCount = style.diffCount || 0;
            let count = 0;
            const groupLayerListener = () => {
                const canvas = map.getRenderer().canvas;
                const expectedPath = style.expected;
                if (GENERATE_MODE) {
                    //生成fixtures
                    const dataURL = canvas.toDataURL();
                    // remove Base64 stuff from the Image
                    const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');
                    fs.writeFile(expectedPath, base64Data, 'base64', () => {});
                    if (!generated) {
                        generated = true;
                        done();
                    }
                } else {
                    //比对测试
                    match(canvas, expectedPath, (err, result) => {
                        if (err) {
                            done(err);
                            return;
                        }
                        if (result.diffCount > diffCount) {
                            //保存差异图片
                            const dir = expectedPath.substring(0, expectedPath.length - 'expected.png'.length);
                            const diffPath = dir + 'diff.png';
                            writeImageData(diffPath, result.diffImage, result.width, result.height);
                            const actualPath = dir + 'actual.png';
                            writeImageData(actualPath, canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
                        }
                        assert(result.diffCount <= diffCount);
                        if (!finished) {
                            done();
                            finished = true;
                        }
                    });
                }
            };
            if (style.data) {
                layer.on('canvasisdirty', () => {
                    //因为某些后处理（如阴影）是在第二帧才会正常绘制的，所以要监听第二次
                    count++;
                    if (count < limit) {
                        if (style.callRedraw) {
                            groupLayer.getRenderer().setToRedraw();
                        }
                        return;
                    }
                    groupLayer.once('layerload', groupLayerListener);
                });
            } else {
                groupLayer.on('layerload', () => {
                    //因为某些后处理（如阴影）是在第二帧才会正常绘制的，所以要监听第二次
                    count++;
                    if (count < limit) {
                        return;
                    }
                    groupLayerListener();
                });
            }
            groupLayer.addTo(map);
            // layer.addTo(map);
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

    context('native point specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'fixtures', 'native-point'));
        for (const p in specs) {
            if (specs.hasOwnProperty(p)) {
                it(p, runner(p, specs[p]));
            }
        }
    });

    context('native line specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'fixtures', 'native-line'));
        for (const p in specs) {
            if (specs.hasOwnProperty(p)) {
                it(p, runner(p, specs[p]));
            }
        }
    });

    context('default render specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'fixtures', 'default'));
        for (const p in specs) {
            if (specs.hasOwnProperty(p)) {
                it(p, runner(p, specs[p]));
            }
        }
    });

    context('extrusion render specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'fixtures', 'extrusion'));
        for (const p in specs) {
            if (specs.hasOwnProperty(p)) {
                it(p, runner(p, specs[p]));
            }
        }
    });

    context('post process render specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'fixtures', 'post-process'));
        for (const p in specs) {
            if (specs.hasOwnProperty(p)) {
                it(p, postProcessRunner(p, specs[p]));
            }
        }
    });

    context('gltf render specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'fixtures', 'gltf'));
        for (const p in specs) {
            if (specs.hasOwnProperty(p)) {
                it(p, runner(p, specs[p]));
            }
        }
    });

    context('feature render specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'fixtures', 'feature-style'));
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
