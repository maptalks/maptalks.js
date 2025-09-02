const maptalks = require('maptalks');
const { GroupGLLayer } = require('@maptalks/gl');

const { Geo3DTilesLayer } = require('../dist/maptalks.3dtiles');
const assert = require('assert');
const { match, writeImageData } = require('./util');
const startServer = require('./server.js');
const { join } = require('path');

const PORT = 39887;

const TARGET_CANVAS = document.createElement('canvas');

maptalks.Map.mergeOptions({
    renderer: 'canvas'
});

describe('render specs', () => {
    let server;
    before(done => {
        server = startServer(PORT, done);
    });

    after(() => {
        server.close();
    });

    let container, map;
    function createMap() {
        const option = maptalks.Util.extend({
            zoom: 20,
            center: [0, 0],
            devicePixelRatio: 1
        });
        map = new maptalks.Map(container, option);
    }

    beforeEach(() => {
        container = document.createElement('div');
        container.style.width = '800px';
        container.style.height = '600px';
        container.style.backgroundColor = '#000';
        document.body.appendChild(container);
        createMap();
    });

    afterEach(() => {
        map.remove();
        document.body.innerHTML = '';
    });

    const runner = (done, layer, expected, layerAssertion) => {
        layer.on('loadtileset', () => {
            if (expected.view) {
                map.setView(expected.view);
            } else {
                const extent = layer.getExtent(0);
                if (expected.pitch) {
                    map.setPitch(expected.pitch);
                }
                map.fitExtent(extent, expected.zoomOffset || 0, { animation: false });
            }
        });
        let ended = false;
        let timeoutHandle = null;
        layer.on('canvasisdirty', () => {
            if (ended) {
                return;
            }
            clearTimeout(timeoutHandle);
            timeoutHandle = setTimeout(() => {
                const expectedPath = join(__dirname, expected.path);
                const threshold = expected.threshold || 0.1;
                const canvas = layer.getRenderer().canvas;
                ended = true;
                //比对测试
                match(canvas, expectedPath, threshold, (err, result) => {
                    if (err) {
                        console.error(err);
                        done(err);
                        return;
                    }
                    if (result.diffCount > (expected.diffCount || 0)) {
                        //保存差异图片
                        const dir = expectedPath.substring(0, expectedPath.length - 'expected.png'.length);
                        const diffPath = dir + 'diff.png';
                        writeImageData(diffPath, result.diffImage, result.width, result.height);
                        const actualPath = dir + 'actual.png';
                        TARGET_CANVAS.width = canvas.width;
                        TARGET_CANVAS.height = canvas.height;
                        const ctx = TARGET_CANVAS.getContext('2d');
                        ctx.drawImage(canvas, 0, 0);
                        writeImageData(actualPath, ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
                    }

                    assert(result.diffCount <= expected.diffCount, 'result: ' + result.diffCount + ', expected: ' + expected.diffCount);
                    if (layerAssertion) {
                        layerAssertion(layer);
                    }
                    done();
                });
            }, expected.timeout || 500);

        });
        if (expected.noGroup) {
            layer.addTo(map);
        } else {
            if (!expected.noAddToMap) {
                const group = new GroupGLLayer('group', [layer]);
                group.addTo(map);
            }
        }

    };

    it('map canvas renderer', done => {
        const resPath = 'Cesium3DTiles/Tilesets/Tileset';
        const layer = new Geo3DTilesLayer('3d-tiles', {
            services : [
                {
                    url : `http://localhost:${PORT}/integration/fixtures/${resPath}/tileset.json`,
                    shader: 'pbr'
                }
            ]
        });
        runner(done, layer, { path: `./integration/expected/${resPath}/expected.png`, diffCount: 0, renderCount: 5, threshold: 0.35 });
    });
});
