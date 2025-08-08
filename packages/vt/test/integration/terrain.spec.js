const maptalks = require('maptalks');
const assert = require('assert');
const path = require('path');
const { match, readSpecs, writeImageData, hasOwn } = require('./util');
const { GeoJSONVectorTileLayer } = require('../../dist/maptalks.vt.js');
const { GroupGLLayer } = require('@maptalks/gl');
const startServer = require('../specs/server.js');
const PORT = 4398;

const DEFAULT_VIEW = {
    center: [91.14478,29.658272],
    zoom: 12,
    pitch: 5,
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

describe('vector tile on terrain integration specs', () => {
    let map, container, server;
    const containerSize = 128;
    before(done => {
        container = document.createElement('div');
        container.style.width = containerSize + 'px';
        container.style.height = containerSize + 'px';
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
            container.style.width = (style.containerWidth || containerSize) + 'px';
            container.style.height = (style.containerHeight || containerSize) + 'px';
            const options = style.view || DEFAULT_VIEW;
            if (!options.lights) {
                options.lights = DEFAULT_VIEW.lights;
            }
            options.devicePixelRatio = 1;

            const limit = style.renderingCount || 6;
            map = new maptalks.Map(container, options);
            style.debugCollision = true;
            style.tileLimitPerFrame = 0;
            // GeoJSONVectorTileLayer的features默认是id，而VectorTileLayer则默认是0
            // 所以这里设置为0，模拟VectorTileLayer默认关闭features时的各种情况
            style.features = 0;
            // disable parents tiles
            style.tileStackDepth = 0;
            style.fadeAnimation = false;
            // style.debug = true;
            const layer = new GeoJSONVectorTileLayer('gvt', style);
            const terrain = {
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: 'http://localhost:' + PORT + '/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0,
                tileLimitPerFrame: 0,
                loadingLimit: 0,
                requireSkuToken: false,
                fadeAnimation: false
                // shader: 'lit'
            };
            const group = new GroupGLLayer('group', [layer], { terrain });
            group.addTo(map);

            const terrainLayer = group.getTerrainLayer();
            let count = 0;
            let ended = false;
            terrainLayer.on('terrainreadyandrender', () => {
                count++;
                const canvas = map.getRenderer().canvas;
                const expectedPath = style.expected;
                if (!ended && count >= limit) {
                    ended = true;
                    //比对测试
                    match(canvas, expectedPath, (err, result) => {
                        if (err) {
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
                        assert(result.diffCount === 0);
                        done();
                    });
                } else {
                    map.getRenderer().setToRedraw();
                }
            });

        };
    };

    context('terrain render specs', () => {
        const specs = readSpecs(path.resolve(__dirname, 'fixtures', 'terrain'));
        for (const p in specs) {
            if (hasOwn(specs, p)) {
                it(p, runner(p, specs[p]));
            }
        }
    });
});
