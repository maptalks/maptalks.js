const maptalks = require('maptalks');
const { GroupGLLayer } = require('@maptalks/gl');

const { Geo3DTilesLayer } = require('../dist/maptalks.3dtiles');
const assert = require('assert');
const startServer = require('./server.js');

const PORT = 39887;

maptalks.Map.mergeOptions({
    renderer: ['gl', 'gpu']
});

describe('highlight and showOnly specs', () => {
    let server;
    before(done => {
        server = startServer(PORT, done);
    });

    after(() => {
        server.close();
    });

    let container, map;

    function createMap(center) {
        const option = {
            zoom: 20,
            center: center || [0, 0],
            devicePixelRatio: 1
        };
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

    const runner = (done, layer, options) => {
        layer.on('loadtileset', () => {
            if (options.view) {
                map.setView(options.view);
            } else {
                const extent = layer.getExtent(0);
                if (options.pitch) {
                    map.setPitch(options.pitch);
                }
                map.fitExtent(extent, options.zoomOffset || 0, { animation: false });
            }

        });
        let hited = false;
        let counter = 0;

        function readPixel(offset) {
            const renderer = map.getRenderer();
            const canvas = renderer.canvas;
            const x = canvas.width / 2 + (offset && offset[0] || 0);
            const y = canvas.height / 2 + (offset && offset[1] || 0);
            return map.getRenderer().context.getImageData(x, y, 1 ,1);
        }
        let counterLimit = 1;
        let timeoutHandle;
        let timeoutDone = false;
        if (options.expected === true) {
            timeoutHandle = setTimeout(() => {
                timeoutDone = true;
                done();
            }, 7000);
        }
        layer.on('canvasisdirty', ({ renderCount }) => {
            clearTimeout(timeoutHandle);
            if (timeoutDone) {
                return;
            }
            if (!hited && renderCount === options.renderCount) {
                hited = true;
                map.on('frameend', () => {
                    if (counter === counterLimit) {
                        if (options.afterExe) {
                            options.afterExe();
                        } else {
                            const color = readPixel(options.offset);
                            if (options.expected === true) {
                                done();
                                return;
                            }
                            if (color.data[3] === 0 && options.expected[3] !== 0) {
                                counterLimit++;
                            } else {
                                assert.deepEqual(color.data, options.expected);
                                done();
                            }

                        }
                    } else if (counter === 0) {
                        if (options.onPainted) {
                            options.onPainted();
                        }
                        if (options.highlights) {
                            layer.highlight(options.highlights);
                        } else if (options.showOnlys) {
                            layer.showOnly(options.showOnlys);
                        }
                    } else if (options.afterExe && counter === counterLimit + 2) {
                        done();
                    }

                    counter++;
                    layer.getRenderer().setToRedraw();
                });
            }
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                bloom: {
                    enable: true,
                    factor: 1,
                    threshold: 0,
                    radius: 1
                }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        group.addTo(map);
    };

    // ci 上似乎需要先垫一个测试用例，才会正常运行
    it('highlight test start for CI, can be ignored if failed.', done => {
        const resPath = 'Cesium3DTiles/Batched/BatchedWithBatchTable';
        const layer = new Geo3DTilesLayer('3d-tiles', {
            services : [
                {
                    url : `http://localhost:${PORT}/integration/fixtures/${resPath}/tileset.json`,
                    shader: 'pbr'
                }
            ]
        });
        const highlights = {
            id: 0,
            color: '#f00'
        };
        runner(done, layer, { renderCount: 1, highlights, expected: true });
    });

    it('highlight color', done => {
        const resPath = 'Cesium3DTiles/Batched/BatchedWithBatchTable';
        const layer = new Geo3DTilesLayer('3d-tiles', {
            services : [
                {
                    url : `http://localhost:${PORT}/integration/fixtures/${resPath}/tileset.json`,
                    shader: 'pbr'
                }
            ]
        });
        const highlights = {
            id: 0,
            color: '#f00'
        };
        runner(done, layer, { renderCount: 1, highlights, expected: new Uint8ClampedArray([255, 0, 0, 255]) });
    });

    it('highlight opacity', done => {
        const resPath = 'Cesium3DTiles/Batched/BatchedWithBatchTable';
        const layer = new Geo3DTilesLayer('3d-tiles', {
            services : [
                {
                    url : `http://localhost:${PORT}/integration/fixtures/${resPath}/tileset.json`,
                    shader: 'pbr'
                }
            ]
        });
        const highlights = {
            id: 0,
            opacity: 0.5
        };
        runner(done, layer, { renderCount: 1, highlights, expected: new Uint8ClampedArray([138, 138, 138, 127]) });
    });

    it('highlight visible', done => {
        const resPath = 'Cesium3DTiles/Batched/BatchedWithBatchTable';
        const layer = new Geo3DTilesLayer('3d-tiles', {
            services : [
                {
                    url : `http://localhost:${PORT}/integration/fixtures/${resPath}/tileset.json`,
                    shader: 'pbr'
                }
            ]
        });
        const highlights = {
            id: 0,
            visible: false
        };
        runner(done, layer, { renderCount: 1, highlights, expected: new Uint8ClampedArray([0, 0, 0, 0]) });
    });

    it('highlight bloom', done => {
        const resPath = 'Cesium3DTiles/Batched/BatchedWithBatchTable';
        const layer = new Geo3DTilesLayer('3d-tiles', {
            services : [
                {
                    url : `http://localhost:${PORT}/integration/fixtures/${resPath}/tileset.json`,
                    shader: 'pbr'
                }
            ]
        });
        const highlights = {
            id: 0,
            color: '#ff0',
            bloom: 1
        };
        runner(done, layer, { renderCount: 1, highlights, offset: [10, 0], expected: new Uint8ClampedArray([74, 74, 0, 55]) });
    });

    it('cancelHighlight', done => {
        const resPath = 'Cesium3DTiles/Batched/BatchedWithBatchTable';
        const layer = new Geo3DTilesLayer('3d-tiles', {
            services : [
                {
                    url : `http://localhost:${PORT}/integration/fixtures/${resPath}/tileset.json`,
                    shader: 'pbr'
                }
            ]
        });
        const canvas = map.getRenderer().canvas;
        const ctx = map.getRenderer().context;
        const highlights = {
            id: 0,
            color: '#ff0'
        };
        const offset = [0, 0];

        const onPainted = () => {
            const color = ctx.getImageData(canvas.width / 2 + offset[0], canvas.height / 2 + offset[1], 1, 1);
            assert.deepEqual(color.data, new Uint8ClampedArray([255, 255, 255, 255]));
        };
        const afterExe = () => {
            const color = ctx.getImageData(canvas.width / 2 + offset[0], canvas.height / 2 + offset[1], 1, 1);
            assert.deepEqual(color.data, new Uint8ClampedArray([255, 255, 0, 255]));
            layer.cancelHighlight(0, [0]);
        };
        runner(() => {
            const color = ctx.getImageData(canvas.width / 2 + offset[0], canvas.height / 2 + offset[1], 1, 1);
            assert.deepEqual(color.data, new Uint8ClampedArray([255, 255, 255, 255]));
            done();
        }, layer, { onPainted, afterExe, renderCount: 1, highlights, offset: [10, 0] });
    });

    it('cancelAllHighlight', done => {
        const resPath = 'Cesium3DTiles/Batched/BatchedWithBatchTable';
        const layer = new Geo3DTilesLayer('3d-tiles', {
            services : [
                {
                    url : `http://localhost:${PORT}/integration/fixtures/${resPath}/tileset.json`,
                    shader: 'pbr'
                }
            ]
        });
        const canvas = map.getRenderer().canvas;
        const ctx = map.getRenderer().context;
        const highlights = {
            id: 0,
            color: '#ff0'
        };
        const offset = [0, 0];

        const onPainted = () => {
            const color = ctx.getImageData(canvas.width / 2 + offset[0], canvas.height / 2 + offset[1], 1, 1);
            assert.deepEqual(color.data, new Uint8ClampedArray([255, 255, 255, 255]));
        };
        const afterExe = () => {
            const color = ctx.getImageData(canvas.width / 2 + offset[0], canvas.height / 2 + offset[1], 1, 1);
            assert.deepEqual(color.data, new Uint8ClampedArray([255, 255, 0, 255]));
            layer.cancelAllHighlight();
        };
        runner(() => {
            const color = ctx.getImageData(canvas.width / 2 + offset[0], canvas.height / 2 + offset[1], 1, 1);
            assert.deepEqual(color.data, new Uint8ClampedArray([255, 255, 255, 255]));
            done();
        }, layer, { onPainted, afterExe, renderCount: 1, highlights, offset: [10, 0] });
    });

    it('showOnly', done => {
        const resPath = 'Cesium3DTiles/Batched/BatchedWithBatchTable';
        const layer = new Geo3DTilesLayer('3d-tiles', {
            services : [
                {
                    url : `http://localhost:${PORT}/integration/fixtures/${resPath}/tileset.json`,
                    shader: 'pbr'
                }
            ]
        });
        const canvas = map.getRenderer().canvas;
        const ctx = map.getRenderer().context;
        const showOnlys = {
            id: 0
        };
        const onPainted = () => {
            const offset = [-40, 75];
            const color = ctx.getImageData(canvas.width / 2 + offset[0], canvas.height / 2 + offset[1], 1, 1);
            assert.deepEqual(color.data, new Uint8ClampedArray([255, 255, 255, 255]));
        };
        runner(() => {
            const offset = [0, 0];
            const color = ctx.getImageData(canvas.width / 2 + offset[0], canvas.height / 2 + offset[1], 1, 1);
            assert.deepEqual(color.data, new Uint8ClampedArray([255, 255, 255, 255]));
            done();
        }, layer, { onPainted, renderCount: 1, showOnlys, offset: [-40, 75], expected: new Uint8ClampedArray([0, 0, 0, 0]) });
    });

    it('cancelShowOnly', done => {
        const resPath = 'Cesium3DTiles/Batched/BatchedWithBatchTable';
        const layer = new Geo3DTilesLayer('3d-tiles', {
            services : [
                {
                    url : `http://localhost:${PORT}/integration/fixtures/${resPath}/tileset.json`,
                    shader: 'pbr'
                }
            ]
        });
        const canvas = map.getRenderer().canvas;
        const ctx = map.getRenderer().context;
        const showOnlys = {
            id: 0
        };
        const onPainted = () => {
            const offset = [-40, 75];
            const color = ctx.getImageData(canvas.width / 2 + offset[0], canvas.height / 2 + offset[1], 1, 1);
            assert.deepEqual(color.data, new Uint8ClampedArray([255, 255, 255, 255]));
        };
        const afterExe = () => {
            const offset = [-40, 75];
            let color = ctx.getImageData(canvas.width / 2 + offset[0], canvas.height / 2 + offset[1], 1, 1);
            // 左下角被showOnly隐藏了
            assert.deepEqual(color.data, new Uint8ClampedArray([0, 0, 0, 0]));
            color = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
            // 中心的仍然显示
            assert.deepEqual(color.data, new Uint8ClampedArray([255, 255, 255, 255]));
            layer.cancelShowOnly();
        };
        runner(() => {
            const offset = [-40, 75];
            // 因为调用了cancelShowOnly，左下角恢复显示
            const color = ctx.getImageData(canvas.width / 2 + offset[0], canvas.height / 2 + offset[1], 1, 1);
            assert.deepEqual(color.data, new Uint8ClampedArray([255, 255, 255, 255]));
            done();
        }, layer, { onPainted, afterExe, renderCount: 1, showOnlys, offset: [-40, 75] });
    });

});
