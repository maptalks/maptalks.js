const assert = require('assert');
const { readPixel } = require('../common/Util');
const maptalks = require('maptalks');
const { GeoJSONVectorTileLayer } = require('../../dist/maptalks.vt.js');
const { GroupGLLayer } = require('@maptalks/gl');
const startServer = require('./server.js');
const PORT = 4398;

const DEFAULT_VIEW = {
    center: [91.14478,29.658272],
    zoom: 12,
    pitch: 0,
    bearing: 0,
    devicePixelRatio: 1,
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

const line = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', id: 0, geometry: { type: 'LineString', coordinates: [[91.13178,29.658272], [91.15678,29.658272]] }, properties: { type: 1 } }
    ]
};

const terrain = {
    type: 'mapbox',
    tileSize: 512,
    spatialReference: 'preset-vt-3857',
    urlTemplate: 'http://localhost:' + PORT + '/mapbox-terrain/{z}/{x}/{y}.webp',
    tileStackDepth: 0,
    tileLimitPerFrame: 0,
    requireSkuToken: false,
    fadeAnimation: false,
    shader: 'lit'
};

describe('update vt on terrain specs', () => {
    let container, map, server;
    before(done => {
        container = document.createElement('div');
        container.style.width = '512px';
        container.style.height = '512px';
        document.body.appendChild(container);
        server = startServer(PORT, done);
    });

    beforeEach(() => {
        map = new maptalks.Map(container, DEFAULT_VIEW);
    });

    afterEach(() => {
        map.remove();
    });

    after(() => {
        server.close();
    });


    context('should can update terrain with line render plugin, fuzhenn/maptalks-ide#3152', () => {

        const lineTerrainRunner = (done, eventCount, isPostProcessOn) => {
            const style = [
                {
                    filter: true,
                    renderPlugin: {
                        type: 'line',
                        dataConfig: { type: 'line' },
                    },
                    symbol: { lineColor: '#f00', lineWidth: 8, lineOpacity: 1 }
                }
            ];
            const layer = new GeoJSONVectorTileLayer('gvt', {
                tileLimitPerFrame: 0,
                data: line,
                style,
                tileStackDepth: 0,
                loadingLimit: 0
            });
            const sceneConfig = {
                postProcess: {
                    enable: !!isPostProcessOn,
                    antialias: { enable: true }
                }
            };
            const limit = 20;
            const group = new GroupGLLayer('group', [layer], { sceneConfig });
            let count = 0;
            const renderer = map.getRenderer();
            const x = renderer.canvas.width, y = renderer.canvas.height;
            layer.once('canvasisdirty', () => {
                group.on('layerload', () => {
                    count++;
                    if (count === eventCount) {
                        let pixel = readPixel(renderer.canvas, x / 2, y / 2);
                        if (pixel[3] === 0 && count < limit) {
                            eventCount++;
                            return;
                        }
                        assert.deepEqual(pixel, [255, 0, 0, 255]);

                        pixel = readPixel(renderer.canvas, x / 2, y / 2 + 40);
                        assert(pixel[0] === 115);
                        assert(pixel[1] === 115);
                        assert(pixel[2] === 115);
                        assert(pixel[3] === 255);
                        done();
                    }
                });
                setTimeout(() => {
                    // 开启了postProcess时，这里如果立即执行，line无法绘制，原因未知
                    group.setTerrain(terrain);
                }, 100);
            });
            group.addTo(map);
        }
        it ('without post process', done => {
            lineTerrainRunner(done, 4, false);
        });

        it ('with post process', done => {
            lineTerrainRunner(done, 4, true);
        });

    });

});

