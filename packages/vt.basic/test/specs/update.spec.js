const path = require('path');
const assert = require('assert');
const { readPixel } = require('../common/Util');
const maptalks = require('maptalks');
const { GeoJSONVectorTileLayer } = require('@maptalks/vt');
const { GroupGLLayer } = require('@maptalks/gl');
require('../../dist/maptalks.vt.basic');

const DEFAULT_VIEW = {
    center: [0, 0],
    zoom: 6,
    pitch: 0,
    bearing: 0,
    attribution: false,
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
        { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-1, 0], [1, 0]] }, properties: { type: 1 } }
    ]
};

const point = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: { type: 1 } }
    ]
};

const polygon = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [
                    [
                        [-1., 1.0],
                        [1., 1.0],
                        [1., -1.0],
                        [-1., -1],
                        [-1., 1]
                    ],
                    [
                        [-0.5, 0.5],
                        [0.5, 0.5],
                        [0.5, -0.5],
                        [-0.5, -0.5],
                        [-0.5, 0.5]
                    ]
                ]
            },
            properties: {
                levels: 3000
            }
        }
    ]
};

describe('update style specs', () => {
    let container, map;
    before(() => {
        container = document.createElement('div');
        container.style.width = '128px';
        container.style.height = '128px';
        document.body.appendChild(container);
        // const canvas = document.createElement('canvas');
        // canvas.id = 'debug';
        // canvas.width = 128;
        // canvas.height = 128;
        // canvas.style.width = '128px';
        // canvas.style.height = '128px';
        // document.body.appendChild(canvas);
    });

    beforeEach(() => {
        map = new maptalks.Map(container, DEFAULT_VIEW);
    });

    afterEach(() => {
        map.remove();
    });

    it('should can setStyle', done => {
        assertChangeStyle(done, [0, 255, 0, 255], layer => {
            layer.setStyle([
                {
                    filter: true,
                    renderPlugin: {
                        type: 'line',
                        dataConfig: { type: 'line' },
                    },
                    symbol: { lineColor: '#0f0', lineWidth: 8, lineOpacity: 1 }
                }
            ]);
        }, true);
    });

    it('should can setStyle with missed filter', done => {
        assertChangeStyle(done, [0, 0, 0, 0], layer => {
            layer.setStyle([
                {
                    filter: {
                        title: '所有数据',
                        value: ['==', 'missingCondition', 1]
                    },
                    renderPlugin: {
                        type: 'line',
                        dataConfig: { type: 'line' },
                    },
                    symbol: { lineColor: '#0f0', lineWidth: 8, lineOpacity: 1 }
                }
            ]);
        });
    });

    it('should can updateSymbol', done => {
        assertChangeStyle(done, [0, 255, 0, 255], layer => {
            layer.updateSymbol(0, {
                lineColor: '#0f0'
            });
            assert(layer.options.style[0].symbol.lineColor === '#0f0');
        });
    });

    it('should hide by setting visible to false', done => {
        assertChangeStyle(done, [0, 0, 0, 0], layer => {
            layer.updateSymbol(0, {
                visible: false
            });
        });
    });

    it('should can update textFill', done => {
        const style = [
            {
                filter: {
                    title: '所有数据',
                    value: ['==', 'type', 1]
                },
                renderPlugin: {
                    type: 'text',
                    dataConfig: { type: 'point' },
                    sceneConfig: { collision: false }
                },
                symbol: { textName: '■■■', textSize: 30, textFill: '#f00' }
            }
        ];
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: point,
            style
        });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        layer.on('canvasisdirty', () => {
            count++;
            if (count === 1) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                layer.updateSymbol(0, { textFill: '#0f0' });
            } else if (count === 2) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //变成绿色
                assert.deepEqual(pixel, [0, 255, 0, 255]);
                done();
            }
        });
        layer.addTo(map);
    });

    it('should can update textSize', done => {
        const style = [
            {
                filter: {
                    title: '所有数据',
                    value: ['==', 'type', 1]
                },
                renderPlugin: {
                    type: 'text',
                    dataConfig: { type: 'point' },
                    sceneConfig: { collision: false }
                },
                symbol: { textName: '■■■', textSize: 10, textFill: '#f00' }
            }
        ];
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: point,
            style
        });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        layer.on('canvasisdirty', () => {
            count++;
            if (count === 1) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                layer.updateSymbol(0, { textSize: 20, textFill: '#0f0' });
            } else if (count === 2) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //变成绿色
                assert.deepEqual(pixel, [0, 255, 0, 255]);
                done();
            }
        });
        layer.addTo(map);
    });

    it('should can update textSize with line placement', done => {
        const style = [
            {
                filter: {
                    title: '所有数据',
                    value: ['==', 'type', 1]
                },
                renderPlugin: {
                    type: 'text',
                    dataConfig: { type: 'point' },
                    sceneConfig: { collision: false }
                },
                symbol: { textName: '■■', textSize: 10, textFill: '#f00', textPlacement: 'line', textSpacing: 5 }
            }
        ];
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: line,
            style
        });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        layer.on('canvasisdirty', () => {
            count++;
            const xOffset = 2;
            if (count === 1) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2 + xOffset, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                layer.updateSymbol(0, { textSize: 20, textFill: '#0f0' });
            } else if (count === 2) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2 + xOffset, y / 2);
                //变成绿色
                assert.deepEqual(pixel, [0, 255, 0, 255]);
                done();
            }
        });
        layer.addTo(map);
    });

    it('should can update text visible with line placement', done => {
        const style = [
            {
                filter: {
                    title: '所有数据',
                    value: ['==', 'type', 1]
                },
                renderPlugin: {
                    type: 'text',
                    dataConfig: { type: 'point' },
                    sceneConfig: { collision: false }
                },
                symbol: { textName: '■■', textSize: 10, textFill: '#f00', textPlacement: 'line', textSpacing: 5 }
            }
        ];
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: line,
            style
        });
        let count = 0;
        let dirty = false;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        layer.once('canvasisdirty', () => {
            dirty = true;
        });
        layer.on('layerload', () => {
            if (!dirty) {
                return;
            }
            count++;
            const xOffset = 2;
            if (count === 1) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2 + xOffset, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                layer.updateSymbol(0, { visible: false });
            } else if (count === 2) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2 + xOffset, y / 2);
                //变成透明
                assert.deepEqual(pixel, [0, 0, 0, 0]);
                done();
            }
        });
        layer.addTo(map);
    });

    it('should can highlight text', done => {
        const style = [
            {
                filter: {
                    title: '所有数据',
                    value: ['==', 'type', 1]
                },
                renderPlugin: {
                    type: 'text',
                    dataConfig: { type: 'point' },
                    sceneConfig: { collision: false }
                },
                symbol: { textName: '■■■', textSize: 10, textFill: '#f00' }
            }
        ];
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: point,
            style
        });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        layer.on('canvasisdirty', () => {
            count++;
            if (count === 1) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                layer.highlightBatch(0, [0, 1, 0, 1]);
            } else if (count === 2) {
                const pixel = readPixel(renderer.canvas, x / 2, y / 2);
                //变成高亮的绿色
                assert.deepEqual(pixel, [0, 255, 0, 255]);
                done();
            }
        });
        layer.addTo(map);
    });


    it('should can update markerAllowOverlap', done => {
        const style = [
            {
                filter: {
                    title: '所有数据',
                    value: ['==', 'type', 1]
                },
                renderPlugin: {
                    type: 'icon',
                    dataConfig: { type: 'point' },
                    sceneConfig: { collision: false }
                },
                symbol: {
                    markerFile: 'file://' + path.resolve(__dirname, '../integration/resources/plane-min.png'),
                    markerWidth: 30,
                    markerHeight: 30,
                    markerOpacity: 1
                }
            }
        ];
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: point,
            style
        });
        let count = 0;
        layer.on('canvasisdirty', () => {
            count++;
            if (count === 1) {
                layer.updateSymbol(0, { markerAllowOverlap: true });
            } else if (count === 2) {
                done();
            }
        });
        layer.addTo(map);
    });

    it('should can update symbol when markerFile is null, fuzhenn/maptalks-studio#405', done => {
        const style = [
            {
                filter: {
                    title: '所有数据',
                    value: ['==', 'type', 1]
                },
                renderPlugin: {
                    type: 'icon',
                    dataConfig: { type: 'point' },
                    sceneConfig: { collision: false }
                },
                symbol: {
                    markerFile: null,
                    markerWidth: 30,
                    markerHeight: 30,
                    markerOpacity: 1
                }
            }
        ];
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: point,
            style
        });
        let count = 0;
        layer.on('layerload', () => {
            count++;
            if (count === 2) {
                layer.updateSymbol(0, { markerWidth: 20 });
            } else if (count === 3) {
                done();
            }
        });
        layer.addTo(map);
    });

    it('should can update symbol textFill', done => {
        const style = [
            {
                filter: {
                    title: '所有数据',
                    value: ['==', 'type', 1]
                },
                renderPlugin: {
                    type: 'text',
                    dataConfig: { type: 'point', only2D: true },
                    sceneConfig: { collision: false, fading: false }
                },
                symbol: { textOpacity: 1, textSize: 20, textFill: 'rgba(64,92,143,1)', textName: '大大大', textHaloRadius: 2, textHaloFill: '#f00' }
            }
        ];
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: point,
            style
        });
        let count = 0;
        layer.on('canvasisdirty', () => {
            count++;
            if (count === 1) {
                const canvas = layer.getRenderer().canvas;
                const pixel = readPixel(canvas, canvas.width / 2, canvas.height / 2);
                assert.deepEqual(pixel, [139, 56, 87, 255]);
                layer.updateSymbol(0, { textFill: 'rgba(25, 95, 230, 1)' });
            } else if (count === 2) {
                const canvas = layer.getRenderer().canvas;
                const pixel = readPixel(canvas, canvas.width / 2, canvas.height / 2);
                assert.deepEqual(pixel, [115, 58, 139, 255]);
                //确保glyphAtlas是有效的（否则会绘制一个矩形）
                const pixel2 = readPixel(canvas, canvas.width / 2 + 6, canvas.height / 2);
                assert.deepEqual(pixel2, [0, 0, 0, 0]);
                done();
            }
        });
        layer.addTo(map);
    });

    it('should can update texture to none', done => {
        const plugin = {
            type: 'lit',
            dataConfig: {
                type: '3d-extrusion',
                altitudeProperty: 'levels',
                altitudeScale: 5,
                defaultAltitude: 0
            },
            sceneConfig: {},
        };
        const material = {
            'baseColorTexture': 'file://' + path.resolve(__dirname, './resources/609-normal.jpg'),
            'baseColorFactor': [1, 1, 1, 1],
            'roughnessFactor': 0,
            'metalnessFactor': 1,
            'outputLinear': 1
        };
        const style = [
            {
                filter: true,
                renderPlugin: plugin,
                symbol: { material }
            }
        ];
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: polygon,
            style
        });
        let painted = false;
        layer.on('canvasisdirty', () => {
            const canvas = layer.getRenderer().canvas;
            const pixel = readPixel(canvas, canvas.width / 2 + 40, canvas.height / 2);
            if (pixel[0] > 0) {
                if (!painted) {
                    assert.deepEqual(pixel, [11, 10, 51, 255]);

                    material.baseColorTexture = undefined;
                    layer.updateSymbol(0, { material });
                    painted = true;
                } else {
                    assert.deepEqual(pixel, [52, 52, 52, 255]);
                    done();
                }
            }
        });
        layer.addTo(map);
    }).timeout(10000);

    it('should can update symbol to lit with AA, maptalks-studio#374', done => {
        //https://github.com/fuzhenn/maptalks-studio/issues/374
        const linePlugin = {
            filter: true,
            renderPlugin: {
                type: 'line',
                dataConfig: { type: 'line' },
            },
            symbol: { lineColor: '#f00', lineWidth: 8, lineOpacity: 1 }
        };
        const plugin = {
            filter: true,
            type: 'lit',
            dataConfig: {
                type: '3d-extrusion',
                altitudeProperty: 'levels',
                altitudeScale: 5,
                defaultAltitude: 0
            },
            sceneConfig: {},
        };
        const material = {
            'baseColorFactor': [1, 1, 1, 1],
            'roughnessFactor': 1,
            'metalnessFactor': 0,
            'outputLinear': 1
        };
        const style = [
            linePlugin,
            {
                filter: true,
                renderPlugin: plugin,
                symbol: { material }
            }
        ];
        map.setLightConfig({
            ambient: {
                color: [0.3, 0.3, 0.3]
            },
            directional: {
                color: [0.5, 0.5, 0.5],
                direction: [1, 1, 1]
            }
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                antialias: true
            }
        };
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: polygon,
            style
        });
        const groupLayer = new GroupGLLayer('group', [
            layer
        ], { sceneConfig });

        let painted = false;
        layer.once('canvasisdirty', () => {
            groupLayer.on('layerload', () => {
                const canvas = groupLayer.getRenderer().canvas;
                const pixel = readPixel(canvas, canvas.width / 2 + 40, canvas.height / 2);
                if (pixel[0] > 0) {
                    if (!painted) {
                        assert.deepEqual(pixel, [78, 78, 78, 255]);

                        material.baseColorFactor = [1, 0, 0, 1];
                        layer.updateSymbol(1, { material });
                        painted = true;
                    } else {
                        assert.deepEqual(pixel, [78, 1, 1, 255]);
                        done();
                    }
                }
            });
        });
        groupLayer.addTo(map);
    });

    it('should can update symbol to turn off bloom, maptalks-studio#418', done => {
        //https://github.com/fuzhenn/maptalks-studio/issues/418
        const linePlugin = {
            filter: true,
            renderPlugin: {
                type: 'line',
                dataConfig: { type: 'line' },
            },
            symbol: { bloom: true, lineColor: '#0f0', lineWidth: 8, lineOpacity: 1 }
        };
        const style = [
            linePlugin
        ];
        map.setLightConfig({
            ambient: {
                color: [0.3, 0.3, 0.3]
            },
            directional: {
                color: [0.5, 0.5, 0.5],
                direction: [1, 1, 1]
            }
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                bloom: {
                    enable: true
                }
            }
        };
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: polygon,
            style
        });
        const groupLayer = new GroupGLLayer('group', [
            layer
        ], { sceneConfig });

        let painted = false;
        let count = 0;
        layer.once('canvasisdirty', () => {
            groupLayer.on('layerload', () => {
                const canvas = groupLayer.getRenderer().canvas;
                const pixel = readPixel(canvas, canvas.width / 2 + 40, canvas.height / 2);
                if (pixel[3] > 0) {
                    if (!painted) {
                        assert(pixel[1] > 0);
                        assert(pixel[3] > 0);
                        layer.updateSymbol(0, { bloom: false });
                        painted = true;
                    }
                }
                if (painted) {
                    count++;
                    if (count === 2) {
                        assert.deepEqual(pixel, [0, 0, 0, 0]);
                        done();
                    }

                }
            });
        });
        groupLayer.addTo(map);
    });

    function assertChangeStyle(done, expectedColor, changeFun, isSetStyle) {
        const style = [
            {
                filter: {
                    title: '所有数据',
                    value: ['==', 'type', 1]
                },
                renderPlugin: {
                    type: 'line',
                    dataConfig: { type: 'line' },
                },
                symbol: { lineColor: '#f00', lineWidth: 8, lineOpacity: 1 }
            }
        ];
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: line,
            style
        });
        let dirty = false;
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        layer.once('canvasisdirty', () => {
            dirty = true;
        });
        //因为是setStyle时，数据会被清空重绘，所以需要监听两次canvasisdirty
        layer.on(isSetStyle ? 'canvasisdirty' : 'layerload', () => {
            if (!dirty) {
                return;
            }
            count++;
            if (count === 1) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                changeFun(layer);
            } else if (count === 2) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //变成绿色
                assert.deepEqual(pixel, expectedColor);
                done();
            }
        });
        layer.addTo(map);
    }

});

