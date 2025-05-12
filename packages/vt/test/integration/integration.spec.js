// const remote = require('electron').remote;
const maptalks = require('maptalks');
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { match, readSpecs, writeImageData, hasOwn } = require('./util');
const { GeoJSONVectorTileLayer } = require('../../dist/maptalks.vt.js');
const { GroupGLLayer } = require('@maptalks/gl');
const startServer = require('../specs/server.js');
const PORT = 4398;

const GENERATE_MODE = false; //(process.env.BUILD || remote.getGlobal('process').env.BUILD) === 'fixtures';

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
    let map, container, server;
    before(done => {
        // const iconDebug = document.createElement('canvas');
        // iconDebug.id = 'MAPTALKS_ICON_DEBUG';
        // document.body.appendChild(iconDebug);
        container = document.createElement('div');
        container.style.width = '128px';
        container.style.height = '128px';
        document.body.appendChild(container);
        server = startServer(PORT, done);
    });

    after(() => {
        server.close();
    });

    afterEach(() => {
        map.remove();
    });

    const runner = (p, style) => {
        return done => {
            let ended = false;
            container.style.width = (style.containerWidth || 128) + 'px';
            container.style.height = (style.containerHeight || 128) + 'px';
            const options = style.view || DEFAULT_VIEW;
            options.centerCross = true;
            if (!options.lights) {
                options.lights = DEFAULT_VIEW.lights;
            }
            const eventName = style.eventName || 'layerload';
            const limit = style.renderingCount || 1;
            options.devicePixelRatio = 1;
            map = new maptalks.Map(container, options);
            style.debugCollision = true;
            style.tileLimitPerFrame = 0;
            style.loadingLimit = 0;
            // GeoJSONVectorTileLayer的features默认是id，而VectorTileLayer则默认是0
            // 所以这里设置为0，模拟VectorTileLayer默认关闭features时的各种情况
            if (!style.features) {
                style.features = 0;
            }
            // disable parents tiles
            style.tileStackDepth = 0;
            if (style.workerGlyph === undefined) {
                style.workerGlyph = false;
            }
            // style.debug = true;
            const layer = new (style.ctor || GeoJSONVectorTileLayer)('gvt', style);
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
                } else if (!ended && count >= limit) {
                    //比对测试
                    match(canvas, expectedPath, (err, result) => {
                        if (err) {
                            ended = true;
                            done(err);
                            return;
                        }
                        if (result.diffCount > (style.diffCount || 0)) {
                            //保存差异图片
                            const dir = expectedPath.substring(0, expectedPath.length - 'expected.png'.length);
                            const diffPath = dir + 'diff.png';
                            writeImageData(diffPath, result.diffImage, result.width, result.height);
                            const actualPath = dir + 'actual.png';
                            writeImageData(actualPath, canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
                        }
                        // console.log(JSON.stringify(map.getView()));
                        assert(result.diffCount <= (style.diffCount || 0));
                        ended = true;
                        done();
                    });
                } else {
                    map.getRenderer().setToRedraw();
                }
            });
            if (style.groupSceneConfig) {
                const children = [];
                if (style.layers) {
                    children.push(...style.layers);
                }
                children.push(layer);
                const group = new GroupGLLayer('group', children, { sceneConfig: style.groupSceneConfig, terrain: style.terrain });
                group.addTo(map);
            } else {
                layer.addTo(map);
            }

        };
    };

    const postProcessRunner = (p, style) => {
        let finished = false;
        return done => {
            container.style.width = (style.containerWidth || 128) + 'px';
            container.style.height = (style.containerHeight || 128) + 'px';
            const options = style.view || DEFAULT_VIEW;
            options.centerCross = true;
            if (!options.lights) {
                options.lights = DEFAULT_VIEW.lights;
            }
            options.devicePixelRatio = 1;
            map = new maptalks.Map(container, options);
            style.debugCollision = true;
            style.features = 0;
            style.tileLimitPerFrame = 0;
            style.tileStackDepth = 0;
            style.loadingLimit = 0;
            // style.debug = true;
            const layer = new GeoJSONVectorTileLayer('gvt', style);
            const sceneConfig = style.sceneConfig;
            const groupLayer = new GroupGLLayer('group', [layer], { sceneConfig, antialias: false });
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
                            writeImageData(actualPath, canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
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
                    } if (count === limit) {
                        groupLayer.once('layerload', groupLayerListener);
                    }
                });
            } else {
                groupLayer.on('layerload', () => {
                    //因为某些后处理（如阴影）是在第二帧才会正常绘制的，所以要监听第二次
                    count++;
                    if (count < limit) {
                        return;
                    } else if (count === limit) {
                        groupLayerListener();
                    }
                });
            }
            groupLayer.addTo(map);
            // layer.addTo(map);
        };
    };

    context('post process render specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'fixtures', 'post-process'));
        for (const p in specs) {
            if (hasOwn(specs, p)) {
                it(p, postProcessRunner(p, specs[p]));
            }
        }
    });


    context('icon specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'fixtures', 'icon'));
        for (const p in specs) {
            if (hasOwn(specs, p)) {
                it(p, runner(p, specs[p]));
            }
        }
    });

    context('text specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'fixtures', 'text'));
        for (const p in specs) {
            if (hasOwn(specs, p)) {
                it(p, runner(p, specs[p]));
            }
        }
    });

    context('line specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'fixtures', 'line'));
        for (const p in specs) {
            if (hasOwn(specs, p)) {
                it(p, runner(p, specs[p]));
            }
        }
    });

    context('polygon specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'fixtures', 'polygon'));
        for (const p in specs) {
            if (hasOwn(specs, p)) {
                it(p, runner(p, specs[p]));
            }
        }
    });

    context('native point specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'fixtures', 'native-point'));
        for (const p in specs) {
            if (hasOwn(specs, p)) {
                it(p, runner(p, specs[p]));
            }
        }
    });

    context('native line specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'fixtures', 'native-line'));
        for (const p in specs) {
            if (hasOwn(specs, p)) {
                it(p, runner(p, specs[p]));
            }
        }
    });

    context('heatmap specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'fixtures', 'heatmap'));
        for (const p in specs) {
            if (hasOwn(specs, p)) {
                it(p, runner(p, specs[p]));
            }
        }
    });

    context('default render specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'fixtures', 'default'));
        for (const p in specs) {
            if (hasOwn(specs, p)) {
                it(p, runner(p, specs[p]));
            }
        }
    });

    context('extrusion render specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'fixtures', 'extrusion'));
        for (const p in specs) {
            if (hasOwn(specs, p)) {
                it(p, runner(p, specs[p]));
            }
        }
    });

    context('gltf render specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'fixtures', 'gltf'));
        for (const p in specs) {
            if (hasOwn(specs, p)) {
                it(p, runner(p, specs[p]));
            }
        }
    });

    context('feature render specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'fixtures', 'feature-style'));
        for (const p in specs) {
            if (hasOwn(specs, p)) {
                it(p, runner(p, specs[p]));
            }
        }
    });

    context('tube render specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'fixtures', 'tube'));
        for (const p in specs) {
            if (hasOwn(specs, p)) {
                it(p, runner(p, specs[p]));
            }
        }
    });

    context('projections specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'fixtures', 'projections'));
        for (const p in specs) {
            if (hasOwn(specs, p)) {
                it(p, runner(p, specs[p]));
            }
        }
    });

    context('water specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'fixtures', 'water'));
        for (const p in specs) {
            if (hasOwn(specs, p)) {
                it(p, runner(p, specs[p]));
            }
        }
    });

    context('min altitude specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'fixtures', 'min-altitude'));
        for (const p in specs) {
            if (hasOwn(specs, p)) {
                if (!specs[p].altitude) {
                    specs[p].altitude = 2000;
                }
                if(!specs[p].view) {
                    specs[p].view = {
                        center: [91.14478,29.658272],
                        zoom: 12
                    };
                }
                it(p, runner(p, specs[p]));
            }
        }
    });

    context('layer opacity specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'fixtures', 'layer-opacity'));
        for (const p in specs) {
            if (hasOwn(specs, p)) {
                if(!specs[p].view) {
                    specs[p].view = {
                        center: [91.14478,29.658272],
                        zoom: 12
                    };
                }
                specs[p].opacity = 0.5;
                specs[p].groupSceneConfig = {};
                // 图层加在GroupGLLayer上的透明度测试
                it(p, runner(p, specs[p]));
            }
        }
    });

    context('layer opacity on map specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'fixtures', 'layer-opacity'));
        for (const p in specs) {
            if (p.indexOf('native-line') >= 0) {
                continue;
            }
            if (hasOwn(specs, p)) {
                if(!specs[p].view) {
                    specs[p].view = {
                        center: [91.14478,29.658272],
                        zoom: 12
                    };
                }
                specs[p].opacity = 0.5;
                // 图层直接加在map上的透明度测试
                it(p, runner(p, specs[p]));
            }
        }
    });

    context('specs on performance', () => {
        const specs = readSpecs(path.resolve(__dirname, 'fixtures', 'perf'));
        for (const p in specs) {
            if (hasOwn(specs, p)) {
                it(p, runner(p, specs[p])).timeout(10000);
            }
        }
    });
});


