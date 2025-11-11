const path = require('path');
const assert = require('assert');
const { readPixel } = require('../common/Util');
const maptalks = require('maptalks');
const { GeoJSONVectorTileLayer } = require('../../dist/maptalks.vt.js');
const { GroupGLLayer } = require('@maptalks/gl');


const DEFAULT_VIEW = {
    center: [0, 0],
    zoom: 6,
    pitch: 0,
    bearing: 0,
    attribution: false,
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
        { type: 'Feature', id: 0, geometry: { type: 'LineString', coordinates: [[-1, 0], [1, 0]] }, properties: { type: 1 } }
    ]
};

const line1 = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', id: 0, geometry: { type: 'LineString', coordinates: [[-1, 0, 1], [1, 0, 1]] }, properties: { type: 1 } }
    ]
};

const point = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', id: 0, geometry: { type: 'Point', coordinates: [0, 0] }, properties: { type: 1 } }
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
                    ]
                ]
            },
            properties: {
                levels: 3000,
                externalId: 1
            }
        }
    ]
};

describe('highlight specs', () => {
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

    it('should can highlight gltf-lit', done => {
        const scale = Math.pow(2, 15);
        const options = {
            data: point,
            style: [{
                name: 'gltf-point',
                renderPlugin: {
                    type: 'gltf-lit',
                    dataConfig: {
                        type: 'native-point'
                    }
                },
                symbol: {
                    url: 'file://' + path.resolve(__dirname, './resources/gltf/Box.glb'),
                    scaleX: scale,
                    scaleY: scale,
                    scaleZ: scale,
                    polygonOpacity: 1
                }
            }],
            pickingGeometry: true,
            pickingPoint: true
        };
        const layer = new GeoJSONVectorTileLayer('gvt', options);
        const sceneConfig = {
            postProcess: {
                enable: true,
                bloom: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        group.once('layerload', () => {
            const highlights = [{
                plugin: ['gltf-point'],
                id: 0,
                name: "highlightgltf",
                color: [0, 1, 0, 1],
                opacity: 0.5,
                nodeIndex: 1
            }];
            layer.highlight(highlights);
            setTimeout(() => {
                const pixel = readPixel(renderer.canvas, x / 2, y / 2);
                assert(pixel[1] > 100);
                assert(pixel[3] < 160);
                layer.cancelHighlight(["highlightgltf"]);
                setTimeout(() => {
                    const pixel = readPixel(renderer.canvas, x / 2, y / 2);
                    //变成高亮的绿色，但只高亮了文字绘制的部分，所以颜色
                    assert(pixel[1] < 10);
                    assert(pixel[3] === 255);
                    done();
                }, 200);
            }, 200);
        });
        group.addTo(map);
    });

    it('should can cancel highlight text, maptalks/issues#562', done => {
        const style = [
            {
                name: 'area-label',
                filter: {
                    title: '所有数据',
                    value: ['==', 'type', 1]
                },
                renderPlugin: {
                    type: 'text',
                    dataConfig: { type: 'point' },
                    sceneConfig: { collision: false }
                },
                symbol: { textName: '■■■■■■', textSize: 30, textFill: '#f00' }
            }
        ];
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: point,
            style
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                bloom: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        group.once('layerload', () => {
            const highlights = [{
                plugin: [/*'area-fill', */'area-label'],
                // id: 12,
                filter: () => true,
                name: "highlightname",
                visible: false
            }];
            layer.highlight(highlights);
            setTimeout(() => {
                layer.cancelHighlight(["highlightname"]);
                setTimeout(() => {
                    const pixel = readPixel(renderer.canvas, x / 2 + 10, y / 2);
                    //变成高亮的绿色，但只高亮了文字绘制的部分，所以颜色
                    assert(pixel[0] > 100);
                    done();
                }, 200);
            }, 200);
        });
        group.addTo(map);
    });

    it('should can hide text by highlight, maptalks/issues#576', done => {
        const style = [
            {
                name: 'area-label',
                filter: {
                    title: '所有数据',
                    value: ['==', 'type', 1]
                },
                renderPlugin: {
                    type: 'text',
                    dataConfig: { type: 'point' },
                    // collision 会让CollisionPainter调用updateCollision，重新设置elements
                    // 原版本的gl/highlight.js中，没有把highlight后的elements替换掉geometry.properties.elements
                    // 导致updateCollision基于highlight之前的elements计算，覆盖掉highlight中的结果
                    sceneConfig: { collision: true }
                },
                symbol: { textName: '■■■■■■', textSize: 30, textFill: '#f00' }
            }
        ];
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: point,
            style
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                bloom: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        group.once('layerload', () => {
            const highlights = [{
                plugin: ['area-label'],
                filter: () => true,
                name: "highlightname",
                visible: false
            }];
            layer.highlight(highlights);
            setTimeout(() => {
                setTimeout(() => {
                    const pixel = readPixel(renderer.canvas, x / 2 + 10, y / 2);
                    assert(pixel[3] === 0);
                    done();
                }, 200);
            }, 200);
        });
        group.addTo(map);
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
                symbol: { textName: '口', textSize: 30, textFill: '#f00' }
            }
        ];
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: point,
            style
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                bloom: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        const start = 1;
        group.on('layerload', () => {
            count++;
            if (count === start) {
                // const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                // assert.deepEqual(pixel, [255, 0, 0, 255]);
                layer.highlight({ id: 0, color: [0, 1, 0, 1], opacity: 1, bloom: 1 });
            } else if (count === start + 1) {
                let pixel = readPixel(renderer.canvas, x / 2, y / 2);
                //变成高亮的绿色，但只高亮了文字绘制的部分，所以颜色
                assert(pixel[1] > 100);
                assert(pixel[3] < 150);
                done();
            }
        });
        group.addTo(map);
    });

    it('should can highlight icon', done => {
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
                symbol: { markerType: 'ellipse', markerVerticalAlignment: 'middle', markerWidth: 20, markerHeight: 20, markerFill: '#f00' }
            }
        ];
        // test if feature's id is string, maptalks/issues#332
        point.features[0].id = 'foo';
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: point,
            featureIdProperty: 'type',
            style
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                bloom: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        const start = 1;
        group.on('layerload', () => {
            count++;
            if (count === start) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                layer.highlight([{ id: 1, color: [0, 1, 0, 1], opacity: 0.5, bloom: 1 }]);
            } else if (count === start + 1) {
                const pixel = readPixel(renderer.canvas, x / 2, y / 2);
                //变成高亮的绿色
                assert(pixel[1] > 10);
                point.features[0].id = 1;
                done();
            }
        });
        group.addTo(map);
    });

    it('should can highlight icon with rgba color', done => {
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
                symbol: { markerType: 'ellipse', markerVerticalAlignment: 'middle', markerWidth: 20, markerHeight: 20, markerFill: '#f00' }
            }
        ];
        // test if feature's id is string, maptalks/issues#332
        point.features[0].id = 'foo';
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: point,
            featureIdProperty: 'type',
            style
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                bloom: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        const start = 1;
        group.on('layerload', () => {
            count++;
            if (count === start) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                layer.highlight([{ id: 1, color: 'rgba(0, 255, 0, 0.8)', opacity: 0.5, bloom: 1 }]);
            } else if (count === start + 1) {
                const pixel = readPixel(renderer.canvas, x / 2, y / 2);
                //变成高亮的绿色
                assert(pixel[1] > 10);
                point.features[0].id = 1;
                done();
            }
        });
        group.addTo(map);
    });

    it('should can highlight icon using filter', done => {
        const style = [
            {
                filter: true,
                renderPlugin: {
                    type: 'fill',
                    dataConfig: { type: 'fill' }
                },
                symbol: { polygonFill: '#f00' }
            }
        ];

        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: polygon,
            featureIdProperty: { '0': 'externalId' },
            style
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                bloom: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        const start = 1;
        group.on('layerload', () => {
            count++
            if (count === start) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                layer.highlight({
                    name: 'test',
                    filter: feature => { return feature.id === 1; },
                    color: [0, 1, 0, 1],
                    opacity: 0.5,
                    bloom: 1
                });
            } else if (count === start + 1) {
                let pixel = readPixel(renderer.canvas, x / 2, y / 2);
                //变成高亮的绿色
                assert(pixel[1] > 10);
                layer.cancelHighlight('test');
            } else if (count === start + 2) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                done();
            }
        });
        group.addTo(map);
    });

    it('should can cancelHighlight before highlight, maptalks/issues#343', done => {
        const style = [
            {
                filter: true,
                renderPlugin: {
                    type: 'fill',
                    dataConfig: { type: 'fill' }
                },
                symbol: { polygonFill: '#f00' }
            }
        ];

        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: polygon,
            style
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                bloom: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        const start = 1;
        group.on('layerload', () => {
            count++
            if (count === start) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                layer.cancelHighlight('test');
                done();
            }
        });
        group.addTo(map);
    });

    it('missing name for highlight with filter', done => {
        const style = [
            {
                filter: true,
                renderPlugin: {
                    type: 'fill',
                    dataConfig: { type: 'fill' }
                },
                symbol: { polygonFill: '#f00' }
            }
        ];

        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: polygon,
            style
        });
        try {
            layer.highlight({
                // missing name for highlight with filter
                filter: () => { return true; },
                color: '#f00'
            });
        } catch (err) {
            // an error will be thrown here
            done();
        }

    });

    it('should can highlight line', done => {
        const style = [
            {
                filter: {
                    title: '所有数据',
                    value: ['==', 'type', 1]
                },
                renderPlugin: {
                    type: 'line',
                    dataConfig: { type: 'line' }
                },
                symbol: { lineWidth: 10, lineColor: '#f00' }
            }
        ];
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: line,
            style
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                bloom: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        const start = 1;
        group.on('layerload', () => {
            count++;
            if (count === start) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                layer.highlight({ id: 0, color: [0, 1, 0, 1], opacity: 0.5, bloom: 1 });
            } else if (count === start + 1) {
                let pixel = readPixel(renderer.canvas, x / 2, y / 2);
                //变成高亮的绿色
                assert(pixel[1] > 10);
                //bloom泛光范围里的像素值
                pixel = readPixel(renderer.canvas, x / 2 - 50, y / 2);
                assert(pixel[1] > 10);
                done();
            }
        });
        group.addTo(map);
    });

    it('should can highlight line1 with altitude, maptalks/issues#183', done => {
        const style = [
            {
                filter: {
                    title: '所有数据',
                    value: ['==', 'type', 1]
                },
                renderPlugin: {
                    type: 'line',
                    dataConfig: { type: 'line' }
                },
                symbol: { lineWidth: 10, lineColor: '#f00' }
            }
        ];
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: line1,
            style
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                bloom: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        const start = 1;
        group.on('layerload', () => {
            count++;
            if (count === start) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                layer.highlight({ id: 0, color: [0, 1, 0, 1], opacity: 0.5 });
            } else if (count === start + 1) {
                let pixel = readPixel(renderer.canvas, x / 2, y / 2);
                //变成高亮的绿色
                assert(pixel[1] > 10);
                done();
            }
        });
        group.addTo(map);
    });

    it('should can highlight after layer created', done => {
        const style = [
            {
                filter: {
                    title: '所有数据',
                    value: ['==', 'type', 1]
                },
                renderPlugin: {
                    type: 'line',
                    dataConfig: { type: 'line' }
                },
                symbol: { lineWidth: 10, lineColor: '#f00' }
            }
        ];
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: line,
            style
        });
        layer.highlight({ id: 0, plugin: [], color: [0, 1, 0, 1], opacity: 0.5, bloom: 1 });
        const sceneConfig = {
            postProcess: {
                enable: true,
                bloom: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        group.on('layerload', () => {
            count++;
            if (count === 1) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                //变成高亮的绿色
                assert(pixel[1] > 10);
                done();

            }
        });
        group.addTo(map);
    });

    it('should can highlight after layer renderer created', done => {
        const style = [
            {
                filter: {
                    title: '所有数据',
                    value: ['==', 'type', 1]
                },
                renderPlugin: {
                    type: 'line',
                    dataConfig: { type: 'line' }
                },
                symbol: { lineWidth: 10, lineColor: '#f00' }
            }
        ];
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: line,
            style
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                bloom: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        group.on('layerload', () => {
            count++;
            if (count === 1) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                //变成高亮的绿色
                assert(pixel[1] > 10);
                done();

            }
        });
        group.addTo(map);
        layer.highlight({ id: 0, plugin: [0], color: [0, 1, 0, 1], opacity: 0.5, bloom: 1 });
    });


    it('should can highlight polygon', done => {
        const style = [
            {
                filter: true,
                name: 'test',
                renderPlugin: {
                    type: 'fill',
                    dataConfig: { type: 'fill' }
                },
                symbol: { polygonFill: '#f00' }
            }
        ];

        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: polygon,
            style
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                bloom: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        group.on('layerload', () => {
            count++
            if (count === 1) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                layer.highlight({ id: 0, plugin: 'test', color: [0, 1, 0, 1], opacity: 0.5, bloom: 1 });
            } else if (count === 2) {
                let pixel = readPixel(renderer.canvas, x / 2, y / 2);
                //变成高亮的绿色
                assert(pixel[1] > 10);
                pixel = readPixel(renderer.canvas, x / 2 - 50, y / 2);
                assert(pixel[1] > 10);
                done();
            }
        });
        group.addTo(map);
    });

    it('should can highlight polygon above, maptalks/issues#566', done => {
        const style = [
            {
                filter: true,
                name: 'test',
                renderPlugin: {
                    type: 'fill',
                    dataConfig: { type: 'fill' }
                },
                symbol: {
                    polygonFill: {
                        type: 'categorical',
                        property: 'name',
                        stops: [
                            [1, '#00f'],
                            [2, '#f00'],
                        ],
                    }
                }
            }
        ];

        const data = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    id: 0,
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1., 1.0],
                                [1., 1.0],
                                [1., -1.0],
                                [-1., -1],
                                [-1., 1]
                            ]
                        ]
                    },
                    properties: {
                        name: 1
                    }
                },
                {
                    type: 'Feature',
                    id: 1,
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-1., 1.0],
                                [1., 1.0],
                                [1., -1.0],
                                [-1., -1],
                                [-1., 1]
                            ]
                        ]
                    },
                    properties: {
                        name: 2
                    }
                }
            ]
        };

        const layer = new GeoJSONVectorTileLayer('gvt', {
            data,
            style
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                bloom: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        group.on('layerload', () => {
            count++
            if (count === 1) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                layer.highlight({ id: 1, plugin: 'test', color: [0, 1, 0, 1] });
            } else if (count === 2) {
                let pixel = readPixel(renderer.canvas, x / 2, y / 2);
                //变成高亮的绿色
                assert(pixel[1] > 10);
                done();
            }
        });
        group.addTo(map);
    });

    it('should not highlight with a wrong index', done => {
        const style = [
            {
                filter: true,
                name: 'test',
                renderPlugin: {
                    type: 'fill',
                    dataConfig: { type: 'fill' }
                },
                symbol: { polygonFill: '#f00' }
            }
        ];

        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: polygon,
            style
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                bloom: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        group.on('layerload', () => {
            count++
            if (count === 1) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                layer.highlight({ id: 0, plugin: 1, color: [0, 1, 0, 1], opacity: 0.5, bloom: 1 });
            } else if (count === 2) {
                let pixel = readPixel(renderer.canvas, x / 2, y / 2);
                //变成高亮的绿色
                assert(pixel[1] === 0);
                done();
            }
        });
        group.addTo(map);
    });

    it('should not highlight with a wrong name', done => {
        const style = [
            {
                filter: true,
                name: 'test',
                renderPlugin: {
                    type: 'fill',
                    dataConfig: { type: 'fill' }
                },
                symbol: { polygonFill: '#f00' }
            }
        ];

        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: polygon,
            style
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                bloom: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        group.on('layerload', () => {
            count++
            if (count === 1) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                layer.highlight({ id: 0, plugin: 'wrongName', color: [0, 1, 0, 1], opacity: 0.5, bloom: 1 });
            } else if (count === 2) {
                let pixel = readPixel(renderer.canvas, x / 2, y / 2);
                //变成高亮的绿色
                assert(pixel[1] === 0);
                done();
            }
        });
        group.addTo(map);
    });

    it('should can highlight lit', done => {
        const style = [
            {
                filter: true,
                renderPlugin: {
                    type: 'lit',
                    dataConfig: { type: '3d-extrusion' }
                },
                symbol: { polygonFill: '#f00' }
            }
        ];

        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: polygon,
            style
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                bloom: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        group.on('layerload', () => {
            count++
            if (count === 1) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [125, 2, 2, 255]);
                layer.highlight({ id: 0, color: [0, 1, 0, 1], opacity: 0.5, bloom: 1 });
            } else if (count === 2) {
                let pixel = readPixel(renderer.canvas, x / 2, y / 2);
                //变成高亮的绿色
                assert(pixel[1] > 10);
                pixel = readPixel(renderer.canvas, x / 2 - 50, y / 2);
                assert(pixel[1] > 10);
                done();
            }
        });
        group.addTo(map);
    });

    it('should can highlight tube', done => {
        const style = [
            {
                filter: {
                    title: '所有数据',
                    value: ['==', 'type', 1]
                },
                renderPlugin: {
                    type: 'tube',
                    dataConfig: { type: 'round-tube' }
                },
                symbol: { lineWidth: 50, lineColor: '#f00' }
            }
        ];
        map.setZoom(18);
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: line,
            style
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                bloom: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        let rendered = false;
        let ended = false;
        group.on('layerload', () => {
            let pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
            //开始是红色
            if (!rendered) {
                if (pixel[0] > 0) {
                    layer.highlight({ id: 0, color: [0, 1, 0, 1], opacity: 0.5, bloom: 1 });
                    rendered = true;
                }
            } else if (!ended) {
                ended = true;
                //变成高亮的绿色
                // assert(pixel[1] > 10);
                pixel = readPixel(renderer.canvas, x / 2, y / 2);
                assert(pixel[0] === 0);
                assert(pixel[1] > 5);
                pixel = readPixel(renderer.canvas, x / 2, y / 2 - 60);
                assert(pixel[1] > 10);
                done();
            }
        });
        group.addTo(map);
    });

    it('should can cancelHighlight', done => {
        const style = [
            {
                filter: true,
                renderPlugin: {
                    type: 'fill',
                    dataConfig: { type: 'fill' }
                },
                symbol: { polygonFill: '#f00' }
            }
        ];

        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: polygon,
            style
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                bloom: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        const start = 1;
        group.on('layerload', () => {
            count++
            if (count === start) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                layer.highlight({ id: 0, color: [0, 1, 0, 1], opacity: 0.5, bloom: 1 });
            } else if (count === start + 1) {
                let pixel = readPixel(renderer.canvas, x / 2, y / 2);
                //变成高亮的绿色
                assert(pixel[1] > 10);
                layer.cancelHighlight(0);
            } else if (count === start + 2) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                done();
            }
        });
        group.addTo(map);
    });

    it('should can cancelHighlight with array', done => {
        const style = [
            {
                filter: true,
                renderPlugin: {
                    type: 'fill',
                    dataConfig: { type: 'fill' }
                },
                symbol: { polygonFill: '#f00' }
            }
        ];

        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: polygon,
            style
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                bloom: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        const start =  1;
        group.on('layerload', () => {
            count++
            if (count === start) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                layer.highlight({ id: 0, color: [0, 1, 0, 1], opacity: 0.5, bloom: 1 });
            } else if (count === start + 1) {
                let pixel = readPixel(renderer.canvas, x / 2, y / 2);
                //变成高亮的绿色
                assert(pixel[1] > 10);
                layer.cancelHighlight([0]);

            } else if (count === start + 2) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                done();
            }
        });
        group.addTo(map);
    });

    it('should can cancelAllHighlight', done => {
        const style = [
            {
                filter: true,
                renderPlugin: {
                    type: 'fill',
                    dataConfig: { type: 'fill' }
                },
                symbol: { polygonFill: '#f00' }
            }
        ];

        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: polygon,
            style
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                bloom: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        const start = 1;
        group.on('layerload', () => {
            count++
            if (count === start) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                layer.highlight({ id: 0, color: [0, 1, 0, 1], opacity: 0.5, bloom: 1 });
            } else if (count === start + 1) {
                let pixel = readPixel(renderer.canvas, x / 2, y / 2);
                //变成高亮的绿色
                assert(pixel[1] > 10);
                layer.cancelAllHighlight();

            } else if (count === start + 2) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                done();
            }
        });
        group.addTo(map);
    });
});
