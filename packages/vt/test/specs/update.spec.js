const path = require('path');
const assert = require('assert');
const { readPixel, compareExpected } = require('../common/Util');
const maptalks = require('maptalks');
const { GeoJSONVectorTileLayer, PolygonLayer } = require('../../dist/maptalks.vt.js');
const { GroupGLLayer } = require('@maptalks/gl');
const startServer = require('./server.js');
const PORT = 4398;

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
    let container, map, server;
    before(done => {
        container = document.createElement('div');
        container.style.width = '128px';
        container.style.height = '128px';
        document.body.appendChild(container);
        server = startServer(PORT, done);
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

    after(() => {
        server.close();
    });

    it('TileLayer covered GeoJSONVectorTileLayer, maptalks/issues#750', done => {
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
                symbol: { textName: '■■■', textSize: 10, textFill: '#0f0' }
            }
        ];
        const layer = new GeoJSONVectorTileLayer('gvt', {
            tileLimitPerFrame: 0,
            loadingLimit: 0,
            data: point,
            style,
            tileStackDepth: 0
        });
        const tileLayer = new maptalks.TileLayer('tile', {
            urlTemplate: path.join(__dirname, './resources/tile-red-256.png')
        })
        const sceneConfig = {
            postProcess: {
                enable: true
            }
        };
        const group = new GroupGLLayer('group', [layer, tileLayer], { sceneConfig });
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        group.addTo(map);
        setTimeout(() => {
            group.remove();
            setTimeout(() => {
                group.addTo(map);
                setTimeout(() => {
                    const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                    assert.deepEqual(pixel, [255, 0, 0, 255]);
                    done();
                }, 200);
            }, 200);
        }, 200);
    });

    it('GeoJSONVectorTileLayer  in GroupGLLayer remove and add again to map, maptalks/issues#256', done => {
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
            tileLimitPerFrame: 0,
            loadingLimit: 0,
            data: point,
            style,
            tileStackDepth: 0
        });
        const sceneConfig = {
            postProcess: {
                enable: true
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        group.addTo(map);
        setTimeout(() => {
            group.remove();
            setTimeout(() => {
                group.addTo(map);
                setTimeout(() => {
                    const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                    assert.deepEqual(pixel, [255, 0, 0, 255]);
                    done();
                }, 200);
            }, 200);
        }, 200);
    });

    it('should update childLayer id and remove it', done => {
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
            tileLimitPerFrame: 0,
            loadingLimit: 0,
            data: point,
            style,
            tileStackDepth: 0
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                outline: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        map.on('renderend', () => {
            count++;
            if (count === 5) {
                const pixel = readPixel(renderer.canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                layer.setId('newId');
                group.removeLayer('newId');
            } else if (count === 7) {
                const pixel = readPixel(renderer.canvas, x / 2, y / 2);
                //变成高亮的绿色
                assert(pixel[0] === 0);
                done();
            }
        });
        group.addTo(map);
    });

    it('fuzhenn/maptalks-designer#877, unique placement for expression textName', done => {
        const point = {
            type: 'FeatureCollection',
            features: [
                { type: 'Feature', id: 0, geometry: { type: 'Point', coordinates: [0, 0] }, properties: { type: 1, title: '■■■' } }
            ]
        };
        const style = [
            {
                filter: {
                    title: '所有数据',
                    value: ['==', 'type', 2]
                },
                renderPlugin: {
                    type: 'text',
                    dataConfig: { type: 'point' },
                    sceneConfig: { collision: true, uniquePlacement: true }
                },
                symbol: { textName: ['get', 'title'], textSize: 10, textFill: '#f00' }
            },
            {
                filter: {
                    title: '所有数据',
                    value: ['==', 'type', 1]
                },
                renderPlugin: {
                    type: 'text',
                    dataConfig: { type: 'point' },
                    sceneConfig: { collision: true, uniquePlacement: true }
                },
                symbol: { textName: ['get', 'title'], textSize: 10, textFill: '#f00' }
            }
        ];
        const layer = new GeoJSONVectorTileLayer('gvt', {
            tileLimitPerFrame: 0,
            loadingLimit: 0,
            data: point,
            style
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                outline: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        map.on('renderend', () => {
            count++;
            if (count === 4) {
                map.zoomIn();
            } else if (count === 16) {
                const pixel = readPixel(renderer.canvas, x / 2, y / 2);
                assert(pixel[0] === 255);
                done();
            }
        });
        group.addTo(map);
    });

    it('should can be added after removed', done => {
        const geo = maptalks.GeoJSON.toGeometry(polygon);
        geo[0].setSymbol({
            polygonFill: '#f00'
        });
        const layer = new PolygonLayer('geo', geo);
        const group = new GroupGLLayer('group', [layer]);
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        map.addLayer(group);
        map.removeLayer(group);
        let count = 0;
        group.on('layerload', () => {
            count++;
            if (count === 2) {
                const pixel = readPixel(renderer.canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                done();
            }
        });
        map.addLayer(group);

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
        }, true, null, 0, 4);
    });

    it('should can set style with missed filter', done => {
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

    // 2022-10-14, 暂时去掉renderStyle的相关方法
    context.skip('renderStyle methods', () => {
        it('should can addRenderStyle', done => {
            assertChangeStyle(done, [0, 255, 0, 255], layer => {
                layer.addRenderStyle(1, {
                    filter: true,
                    renderPlugin: {
                        type: 'line',
                        dataConfig: { type: 'line' },
                    },
                    symbol: { lineColor: '#0f0', lineWidth: 8, lineOpacity: 1 }
                });
            }, true);
        });

        it('should can updateRenderStyle', done => {
            assertChangeStyle(done, [0, 255, 0, 255], layer => {
                layer.updateRenderStyle(0, {
                    filter: true,
                    renderPlugin: {
                        type: 'line',
                        dataConfig: { type: 'line' },
                    },
                    symbol: { lineColor: '#0f0', lineWidth: 8, lineOpacity: 1 }
                });
            }, true);
        });

        it('should can removeRenderStyle', done => {
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
                    symbol: { lineColor: '#f00', lineWidth: 8, lineOpacity: 1 },
                },
                {
                    renderPlugin: {
                        type: 'line',
                        dataConfig: { type: 'line' },
                    },
                    symbol: { lineColor: '#0f0', lineWidth: 8, lineOpacity: 1 }
                }
            ];
            assertChangeStyle(done, [0, 255, 0, 255], layer => {
                layer.removeRenderStyle(0);
            }, true, style);
        });

        it('should can updateRenderStyleByName', done => {
            assertChangeStyle(done, [0, 255, 0, 255], layer => {
                layer.updateRenderStyle('lineStyle', {
                    filter: true,
                    renderPlugin: {
                        type: 'line',
                        dataConfig: { type: 'line' },
                    },
                    symbol: { lineColor: '#0f0', lineWidth: 8, lineOpacity: 1 }
                });
            }, true);
        });

        it('should can removeRenderStyle', done => {
            const style = [
                {
                    name: 'lineStyle',
                    filter: {
                        title: '所有数据',
                        value: ['==', 'type', 1]
                    },
                    renderPlugin: {
                        type: 'line',
                        dataConfig: { type: 'line' },
                    },
                    symbol: { lineColor: '#f00', lineWidth: 8, lineOpacity: 1 },
                },
                {
                    name: 'backStyle',
                    renderPlugin: {
                        type: 'line',
                        dataConfig: { type: 'line' },
                    },
                    symbol: { lineColor: '#0f0', lineWidth: 8, lineOpacity: 1 }
                }
            ];
            assertChangeStyle(done, [0, 255, 0, 255], layer => {
                layer.removeRenderStyle('lineStyle');
            }, true, style);
        });

    });

    context.skip('featureStyle methods', () => {
        it('should can addFeatureStyle', done => {
            assertChangeStyle(done, [0, 255, 0, 255], layer => {
                layer.updateFeatureStyle({
                    id: 0,
                    style: [
                        {
                            renderPlugin: {
                                type: 'line',
                                dataConfig: { type: 'line' },
                            },
                            symbol: { lineColor: '#0f0', lineWidth: 8, lineOpacity: 1 }
                        }
                    ]
                });
            }, true, null, 1);
        });

        it('should can updateFeatureStyle', done => {
            const style = {
                style: [
                    {
                        name: 'lineStyle',
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
                ],
                featureStyle: [
                    {
                        id: 0,
                        style: [
                            {
                                renderPlugin: {
                                    type: 'line',
                                    dataConfig: { type: 'line' },
                                },
                                symbol: { lineColor: '#f00', lineWidth: 8, lineOpacity: 1 }
                            }
                        ]
                    }
                ]
            }
            assertChangeStyle(done, [0, 255, 0, 255], layer => {
                layer.updateFeatureStyle({
                    id: 0,
                    style: [
                        {
                            renderPlugin: {
                                type: 'line',
                                dataConfig: { type: 'line' },
                            },
                            symbol: { lineColor: '#0f0', lineWidth: 8, lineOpacity: 1 }
                        }
                    ]
                });
            }, true, style, 1);
        });

        it('should can removeFeatureStyle', done => {
            const style = {
                style: [
                    {
                        name: 'lineStyle',
                        filter: {
                            title: '所有数据',
                            value: ['==', 'type', 1]
                        },
                        renderPlugin: {
                            type: 'line',
                            dataConfig: { type: 'line' },
                        },
                        symbol: { lineColor: '#0f0', lineWidth: 8, lineOpacity: 1 }
                    }
                ],
                featureStyle: [
                    {
                        id: 0,
                        style: [
                            {
                                renderPlugin: {
                                    type: 'line',
                                    dataConfig: { type: 'line' },
                                },
                                symbol: { lineColor: '#f00', lineWidth: 8, lineOpacity: 1 }
                            }
                        ]
                    }
                ]
            }
            assertChangeStyle(done, [255, 0, 0, 255], layer => {
                layer.removeFeatureStyle(0);
            }, true, style, 1);
        });
    });

    it('should can updateSymbol', done => {
        assertChangeStyle(done, [0, 255, 0, 255], layer => {
            layer.updateSymbol(0, {
                lineColor: '#0f0'
            });
            assert(layer.options.style[0].symbol.lineColor === '#0f0');
        }, false, null, 0, 2);
    });

    it('should can updateSymbol with a url style', done => {
        const styleURL = `http://localhost:${PORT}/update-style.json`;
        assertChangeStyle(done, [0, 255, 0, 255], layer => {
            layer.updateSymbol(0, {
                lineColor: '#0f0'
            });
            assert(layer.options.style === styleURL);
        }, false, styleURL, 0, 2);
    });

    it('should can updateSymbol by name', done => {
        assertChangeStyle(done, [0, 255, 0, 255], layer => {
            layer.updateSymbol('lineStyle', {
                lineColor: '#0f0'
            });
            assert(layer.options.style[0].symbol.lineColor === '#0f0');
        }, false, null, 0, 2);
    });

    it('should can updateSymbol with function-type value', done => {
        assertChangeStyle(done, [0, 255, 0, 255], layer => {
            layer.updateSymbol('lineStyle', {
                lineColor: {
                    type: 'categorical',
                    property: 'type',
                    stops: [
                        [1, [0, 1, 0, 1]]
                    ]
                }
            });
            map.setZoom(map.getZoom() + 2);
            assert(layer.getRenderer().getStyleCounter() === 2);
        }, false, null, 0, 2);
    });

    it('should can setFeatureState', done => {
        assertChangeStyle(done, [0, 255, 0, 255], layer => {
            layer.updateSymbol('lineStyle', {
                lineColor: {
                    type: 'identity',
                    property: 'color'
                }
            });
            layer.setFeatureState({ id: 0 }, { color: '#0f0' });
            map.setZoom(map.getZoom() + 2);
        }, false, null, 0, 2);
    });

    it('should can removeFeatureState with propertyName', done => {
        assertChangeStyle(done, [0, 0, 0, 255], layer => {
            layer.updateSymbol('lineStyle', {
                lineColor: {
                    type: 'identity',
                    property: 'color'
                }
            });
            layer.setFeatureState({ id: 0 }, { color: '#0f0' });
            layer.removeFeatureState({ id: 0 }, 'color');
            map.setZoom(map.getZoom() + 2);
        }, false, null, 0, 2);
    });

    it('should can removeFeatureState with property', done => {
        assertChangeStyle(done, [0, 0, 0, 255], layer => {
            layer.updateSymbol('lineStyle', {
                lineColor: {
                    type: 'identity',
                    property: 'color'
                }
            });
            layer.setFeatureState({ id: 0 }, { color: '#0f0' });
            layer.removeFeatureState({ id: 0 }, { color: '#0f0' });
            map.setZoom(map.getZoom() + 2);
        }, false, null, 0, 2);
    });

    it('should can removeFeatureState', done => {
        assertChangeStyle(done, [0, 0, 0, 255], layer => {
            layer.updateSymbol('lineStyle', {
                lineColor: {
                    type: 'identity',
                    property: 'color'
                }
            });
            layer.setFeatureState({ id: 0 }, { color: '#0f0' });
            layer.removeFeatureState({ id: 0 });
            map.setZoom(map.getZoom() + 2);
        }, false, null, 0, 2);
    });

    it('should can update multiple symbol', done => {
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
                symbol: [
                    {
                        lineColor: '#00f', lineWidth: 8, lineOpacity: 1
                    },
                    {
                        lineColor: '#f00', lineWidth: 8, lineOpacity: 1
                    },
                ]
            }
        ];
        assertChangeStyle(done, [0, 255, 0, 255], layer => {
            layer.updateSymbol(0, [null, {
                lineColor: '#0f0',
                lineOpacity: 1
            }]);
            assert(layer.options.style[0].symbol[1].lineColor === '#0f0');
        }, false, style, 0, 2);
    });

    it('should can update line visible', done => {
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
                symbol: {
                   lineColor: '#f00', lineWidth: 8, lineOpacity: 1
                }
            },
            {
                filter: {
                    title: '所有数据',
                    value: ['==', 'type', 1]
                },
                renderPlugin: {
                    type: 'line',
                    dataConfig: { type: 'line' },
                },
                symbol: {
                   lineColor: '#00f', lineWidth: 8, lineOpacity: 1, visible: false
                }
            }
        ];
        assertChangeStyle(done, [0, 0, 255, 255], layer => {
            layer.updateSymbol(1, { visible: true });
            assert(layer.options.style[1].symbol.visible === true);
        }, true, style, 0, 8);
    });

    it('should can set visible of multiple symbol', done => {
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
                symbol: [
                    {
                        lineColor: '#00f', lineWidth: 8, lineOpacity: 1
                    },
                    {
                        lineColor: '#f00', lineWidth: 8, lineOpacity: 1
                    },
                ]
            }
        ];
        assertChangeStyle(done, [0, 0, 255, 255], layer => {
            layer.updateSymbol(0, [null, {
                visible: 0
            }]);
            assert(layer.options.style[0].symbol[1].visible === 0);
        }, true, style);
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

    it('should can ignore HAS_BLOOM when bloom is turned off, fuzhenn/maptalks-studio#2386', done => {
        const plugin = {
            type: 'lit',
            dataConfig: {
                type: '3d-extrusion',
                // altitudeProperty: 'levels',
                altitudeScale: 5,
                defaultAltitude: 0
            },
            sceneConfig: {},
        };
        const material = {
            'baseColorFactor': [1, 1, 1, 1],
            'roughnessFactor': 1,
            'metalnessFactor': 0
        };
        const style = [
            {
                filter: true,
                renderPlugin: plugin,
                symbol: { material, bloom: true }
            }
        ];
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: polygon,
            style,
            tileStackDepth: 0
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                bloom: { enable: false }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        layer.once('canvasisdirty', () => {
           const renderer = layer.getRenderer();
           const meshes = renderer.getShadowMeshes();
           assert(meshes.length > 0);
           assert(meshes[0].defines['HAS_BLOOM'] === undefined);
           done();
        });
        group.addTo(map);
    });

    it('should can outline batch', done => {
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
        const sceneConfig = {
            postProcess: {
                enable: true,
                outline: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        layer.on('canvasisdirty', () => {
            count++;
        });
        let finished = false;
        map.on('renderend', () => {
            if (count === 1) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                layer.outlineBatch(0);
            } else if (count === 2 && !finished) {
                const pixel = readPixel(renderer.canvas, x / 2, y / 2);
                //变成高亮的绿色
                assert(pixel[1] > 10);
                finished = true;
                done();
            }
        });
        group.addTo(map);
    });

    it('should can outlineAll', done => {
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
        const sceneConfig = {
            postProcess: {
                enable: true,
                outline: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        layer.on('canvasisdirty', () => {
            count++;

        });
        map.on('renderend', () => {
            if (count === 1) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                layer.outlineAll();
            } else if (count === 2) {
                const pixel = readPixel(renderer.canvas, x / 2, y / 2);
                //变成高亮的绿色
                assert(pixel[1] > 10);
                done();
            }
        });
        group.addTo(map);
    });

    it('should can outline features', done => {
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
        const sceneConfig = {
            postProcess: {
                enable: true,
                outline: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        layer.on('canvasisdirty', () => {
            count++;

        });
        map.on('renderend', () => {
            if (count === 1) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                layer.outline(0, [0]);
            } else if (count === 2) {
                const pixel = readPixel(renderer.canvas, x / 2, y / 2);
                //变成高亮的绿色
                assert(pixel[1] > 10);
                done();
            }
        });
        group.addTo(map);
    });

    it('should can outline styled features', done => {
        const featureStyle = [
            {
                id: 0,
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
            style: {
                featureStyle
            }
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                outline: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        layer.on('canvasisdirty', () => {
            count++;

        });
        map.on('renderend', () => {
            if (count === 1) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                layer.outlineFeatures([0]);
            } else if (count === 2) {
                const pixel = readPixel(renderer.canvas, x / 2, y / 2);
                //变成高亮的绿色
                assert(pixel[1] > 10);
                layer.cancelOutline();
            } else if (count === 3) {
                const pixel = readPixel(renderer.canvas, x / 2, y / 2);
                //变成高亮的绿色
                assert(pixel[1] === 0);
                done();
            }
        });
        group.addTo(map);
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
                symbol: { textOpacity: 1, textSize: 20, textFill: 'rgba(64,92,143,1)', textName: '■', textHaloRadius: 2, textHaloFill: '#f00' }
            }
        ];
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: point,
            style,
            loadingLimit: 0
        });
        let count = 0;
        layer.on('canvasisdirty', () => {
            count++;
            if (count === 1) {
                const canvas = layer.getRenderer().canvas;
                const pixel = readPixel(canvas, canvas.width / 2 + 3, canvas.height / 2);
                assert.deepEqual(pixel, [64, 92, 143, 255]);
                layer.updateSymbol(0, { textFill: 'rgba(25, 95, 230, 1)' });
            } else if (count === 2) {
                const canvas = layer.getRenderer().canvas;
                const pixel = readPixel(canvas, canvas.width / 2 + 3, canvas.height / 2);
                assert.deepEqual(pixel, [25, 95, 230, 255]);
                //确保glyphAtlas是有效的（否则会绘制一个矩形）
                const pixel2 = readPixel(canvas, canvas.width / 2 + 7, canvas.height / 2);
                assert.deepEqual(pixel2, [0, 0, 0, 0]);
                done();
            }
        });
        layer.addTo(map);
    });

    it('should can update symbol textHaloRadis', done => {
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
                symbol: { textOpacity: 1, textSize: 30, textFill: 'rgba(64,92,143,1)', textName: '大大大', textHaloRadius: 0, textHaloFill: '#f00' }
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
                layer.updateSymbol(0, { textHaloRadius: 1 });
            } else if (count === 2) {
                const canvas = map.getRenderer().canvas;
                const expectedPath = path.join(__dirname, 'fixtures', 'halo0', 'expected.png');
                compareExpected(canvas, { expectedPath, expectedDiffCount: 10 }, done);
            }
        });
        layer.addTo(map);
    });

    it('should can setZIndex, fuzhenn/maptalks-studio#1112', done => {
        const plugin = {
            type: 'lit',
            dataConfig: {
                type: '3d-extrusion',
                // altitudeProperty: 'levels',
                altitudeScale: 5,
                defaultAltitude: 0
            },
            sceneConfig: {},
        };
        const material = {
            'baseColorFactor': [1, 1, 1, 1],
            'roughnessFactor': 1,
            'metalnessFactor': 0
        };
        const styleRed = [
            {
                filter: true,
                renderPlugin: plugin,
                symbol: { material, polygonFill: '#f00' }
            }
        ];
        const styleGreen = [
            {
                filter: true,
                renderPlugin: plugin,
                symbol: { material, polygonFill: '#0f0' }
            }
        ];
        const layerRed = new GeoJSONVectorTileLayer('gvt1', {
            data: polygon.features[0],
            style: styleRed
        });
        const layerGreen = new GeoJSONVectorTileLayer('gvt2', {
            data: polygon.features[0],
            style: styleGreen
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                antialias: {
                    enable: true
                }
            }
        };
        const layer = new GroupGLLayer('group', [layerRed, layerGreen], { sceneConfig });
        let count = 0;
        const startCount = 1;
        layerRed.once('canvasisdirty', () => {
            layer.on('layerload', () => {
                count++;
                if (count === startCount) {
                    const canvas = layer.getRenderer().canvas;
                    const pixel = readPixel(canvas, canvas.width / 2 + 30, canvas.height / 2 + 30);
                    assert(pixel[1] > pixel[0]);
                    // 调用zindex后，红色就变为上层
                    layerRed.setZIndex(2);
                } else if (count === startCount + 1) {
                    const canvas = layer.getRenderer().canvas;
                    const pixel = readPixel(canvas, canvas.width / 2 + 30, canvas.height / 2 + 30);
                    assert(pixel[1] < pixel[0]);
                    done();
                }
            });

        });
        layer.addTo(map);
    });

    it('should can turn on ssr, fuzhenn/maptalks-studio#2442', done => {
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
                        type: 'building',
                        levels: 3000
                    }
                },
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-6., 6.0],
                                [6., 6.0],
                                [6., -6.0],
                                [-6., -6],
                                [-6., 6]
                            ]
                        ]
                    },
                    properties: {
                        levels: 0,
                        type: 'ground'
                    }
                }
            ]
        };
        const plugin = {
            type: 'lit',
            dataConfig: {
                type: '3d-extrusion',
                altitudeProperty: 'levels',
                altitudeScale: 20,
                defaultAltitude: 0
            },
            sceneConfig: {},
        };
        const material = {
            'baseColorFactor': [1, 0, 0, 1],
            'roughnessFactor': 1,
            'metalnessFactor': 0
        };

        const materialGround = {
            'baseColorFactor': [1, 1, 1, 1],
            'roughnessFactor': 0,
            'metalnessFactor': 1
        };
        const style = [
            {
                filter: ['==', 'type', 'building'],
                renderPlugin: plugin,
                symbol: { material }
            },
            {
                filter: ['==', 'type', 'ground'],
                renderPlugin: plugin,
                symbol: { material: materialGround, ssr: 0 }
            }
        ];
        const layerRed = new GeoJSONVectorTileLayer('gvt', {
            data: polygon,
            style
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                antialias: {
                    enable: true
                },
                ssr: {
                    enable: true,
                    factor: 4
                },
                bloom: {
                    // gl 0.48.2 之前，如果没有打开bloom，ssr的textureRefracted是不完整的
                    // 所以这里关闭bloom，增加一个测试
                    enable: false
                }
            }
        };
        map.setLights({
          "directional": {
            "direction": [
              1,
              0,
              -1
            ],
            "color": [
              0.1,
              0.1,
              0.1
            ]
          },
          "ambient": {
            "resource": null,
            "exposure": 1,
            "hsv": [
              0,
              0,
              0
            ],
            "orientation": 0
          }
        });
        map.setPitch(80);
        const layer = new GroupGLLayer('group', [layerRed], { sceneConfig });
        let count = 0;
        const startCount = 1;
        layerRed.once('canvasisdirty', () => {
            layer.on('layerload', () => {
                count++;
                if (count === startCount) {
                    const canvas = layer.getRenderer().canvas;
                    const pixel = readPixel(canvas, canvas.width / 2, canvas.height / 2 + 20);
                    assert.deepEqual(pixel, [159, 159, 159, 255]);
                    layerRed.updateSymbol(1, { ssr: true });
                } else if (count === startCount + 1) {
                    const canvas = layer.getRenderer().canvas;
                    const pixel = readPixel(canvas, canvas.width / 2, canvas.height / 2 + 20);
                    assert.deepEqual(pixel, [134, 111, 111, 255]);
                    done();
                }
            });

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
            'outputSRGB': 0
        };
        const style = [
            {
                filter: true,
                renderPlugin: plugin,
                symbol: { material }
            }
        ];
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: polygon.features[0],
            style,
            tileStackDepth: 0
        });
        let painted = false;
        let finished = false;
        layer.on('canvasisdirty', () => {
            if (finished) {
                return;
            }
            const canvas = layer.getRenderer().canvas;
            const pixel = readPixel(canvas, canvas.width / 2 + 40, canvas.height / 2);
            if (pixel[0] > 0) {
                if (!painted) {
                    assert.deepEqual(pixel, [11, 11, 51, 255]);

                    material.baseColorTexture = undefined;
                    layer.updateSymbol(0, { material });
                    painted = true;
                } else {
                    finished = true;
                    assert.deepEqual(pixel, [52, 52, 52, 255]);
                    done();
                }
            }
        });
        layer.addTo(map);
    }).timeout(10000);

    it('should can update plugin visible to true, fuzhenn/maptalks-ide#3105', done => {
        const plugin = {
            type: 'fill',
            dataConfig: {
                type: 'fill'
            },
            sceneConfig: {},
        };
        const style = [
            {
                filter: true,
                renderPlugin: plugin,
                symbol: {
                    visible: false,
                    polygonFill: '#f00'
                }
            }
        ];
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: polygon.features[0],
            style,
            tileStackDepth: 0
        });
        layer.once('canvasisdirty', () => {
            const canvas = layer.getRenderer().canvas;
            const pixel = readPixel(canvas, canvas.width / 2 + 40, canvas.height / 2);
            assert.deepEqual(pixel, [255, 0, 0, 255]);
            done();
        });
        layer.addTo(map);
        setTimeout(() => {
            layer.updateSymbol(0, { visible: true });
        }, 200);
    });

    it('should can update textures for line extrusion, maptalks-studio#1923', done => {
        const plugin = {
            filter: true,
            type: 'lit',
            dataConfig: {
                type: 'line-extrusion',
                altitudeScale: 1,
                defaultAltitude: 10
            },
            sceneConfig: {},
        };
        const material = {
            'baseColorFactor': [1, 1, 1, 1],
            'roughnessFactor': 1,
            'metalnessFactor': 0,
            'outputSRGB': 0
        };
        const style = [
            {
                filter: true,
                renderPlugin: plugin,
                symbol: { lineWidth: 24, material }
            }
        ];
        map.setLights({
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
            tileLimitPerFrame: 0,
            loadingLimit: 0,
            data: line,
            style
        });
        const groupLayer = new GroupGLLayer('group', [
            layer
        ], { sceneConfig });
        let painted = false;
        let finished = false;
        let count = 0;
        map.on('renderend', () => {
            const canvas = groupLayer.getRenderer().canvas;
            const pixel = readPixel(canvas, canvas.width / 2 + 40, canvas.height / 2);
            if (pixel[0] > 0) {

                if (!painted) {
                    assert.deepEqual(pixel, [78, 78, 78, 255]);

                    material.baseColorTexture = 'file://' + path.resolve(__dirname, '../integration/resources/1.png');
                    layer.updateSymbol(0, { material });
                    painted = true;
                } else if (!finished) {
                    count++;
                    if (count >= 10) {
                        finished = true;
                        assert.deepEqual(pixel, [36, 40, 43, 255]);
                        done();
                    }
                }
            }
        });
        groupLayer.addTo(map);
    });

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
            'outputSRGB': 0
        };
        const style = [
            linePlugin,
            {
                filter: true,
                renderPlugin: plugin,
                symbol: { material }
            }
        ];
        map.setLights({
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
        let finished = false;
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
                    } else if (!finished) {
                        assert.deepEqual(pixel, [78, 0, 0, 255]);
                        finished = true;
                        done();
                    }
                }
            });
        });
        groupLayer.addTo(map);
    });

    it('should can turn on and off shadow, fuzhenn/maptalks-studio#2496', done => {
       const sceneConfig = {
            "shadow": {
                "type": "esm",
                "enable": true,
                "quality": "high",
                "opacity": 0.5,
                "color": [
                  0,
                  0,
                  0
                ],
                "blurOffset": 1
            }
        };
        const groupLayer = new GroupGLLayer('group', [], { sceneConfig });
        let count = 0;
        groupLayer.on('layerload', () => {
            count++;
            if (count === 1) {
                sceneConfig.shadow.enable = false;
                groupLayer.setSceneConfig(sceneConfig);
            } else if (count === 2) {
                groupLayer.getRenderer().setToRedraw();

            } else if (count === 3) {
                sceneConfig.shadow.enable = true;
                groupLayer.setSceneConfig(sceneConfig);

            } else if (count === 4) {
                done();
            }
        });
        groupLayer.addTo(map);
    })

    it('should can update symbol to turn off bloom, maptalks-studio#418', done => {
        //https://github.com/fuzhenn/maptalks-studio/issues/418
        const linePlugin = {
            filter: true,
            renderPlugin: {
                type: 'line',
                dataConfig: { type: 'line' },
            },
            symbol: { lineBloom: true, lineColor: '#0f0', lineWidth: 8, lineOpacity: 1 }
        };
        const style = [
            linePlugin
        ];
        map.setLights({
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
                        layer.updateSymbol(0, { lineBloom: false });
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


    it('should can update feature symbol', done => {
        assertChangeStyle(done, [0, 255, 0, 255], layer => {
            layer.updateFeatureSymbol(0, 0, {
                lineColor: '#0f0'
            });
            assert(layer.options.style.featureStyle[0].style[0].symbol.lineColor === '#0f0');
        }, false, {
            style: [
                {
                    filter: true,
                    renderPlugin: {
                        type: 'line',
                        dataConfig: { type: 'line' },
                    },
                    symbol: { lineColor: '#f00', lineWidth: 8, lineOpacity: 1 }
                }
            ],
            featureStyle: [
                {
                    id: 0,
                    style: [
                        {
                            renderPlugin: {
                                type: 'line',
                                dataConfig: { type: 'line' },
                            },
                            symbol: { lineColor: '#f00', lineWidth: 8, lineOpacity: 1 }
                        }
                    ]
                }
            ]
        }, 0, 2);
    });

    it('should can update feature symbol 2', done => {
        assertChangeStyle(done, [0, 255, 0, 255], layer => {
            layer.updateFeatureSymbol(0, 1, {
                lineColor: '#0f0'
            });
            assert(layer.options.style.featureStyle[0].style[1].symbol.lineColor === '#0f0');
        }, false, {
            featureStyle: [
                {
                    id: 0,
                    style: [
                        {
                            renderPlugin: {
                                type: 'line',
                                dataConfig: { type: 'line' },
                            },
                            symbol: { lineColor: '#f00', lineWidth: 0, lineOpacity: 0 }
                        },
                        {
                            renderPlugin: {
                                type: 'line',
                                dataConfig: { type: 'line' },
                            },
                            symbol: { lineColor: '#f00', lineWidth: 8, lineOpacity: 1 }
                        }
                    ]
                }
            ]
        }, 0, 2);
    });

    it('should can update feature sceneConfig', done => {
        assertChangeStyle(done, [255, 0, 0, 255], layer => {
            layer.updateFeatureSceneConfig(0, 1, {
                foo: 1
            });
            assert(layer.options.style.featureStyle[0].style[1].renderPlugin.sceneConfig.foo === 1);
        }, false, {
            style: [
                {
                    filter: true,
                    renderPlugin: {
                        type: 'line',
                        dataConfig: { type: 'line' },
                    },
                    symbol: { lineColor: '#f00', lineWidth: 8, lineOpacity: 1 }
                }
            ],
            featureStyle: [
                {
                    id: 0,
                    style: [
                        {
                            renderPlugin: {
                                type: 'line',
                                dataConfig: { type: 'line' },
                            },
                            symbol: { lineColor: '#f00', lineWidth: 8, lineOpacity: 1 }
                        },
                        {
                            renderPlugin: {
                                type: 'line',
                                dataConfig: { type: 'line' },
                            },
                            symbol: { lineColor: '#f00', lineWidth: 8, lineOpacity: 1 }
                        }
                    ]
                }
            ]
        }, 0, 2);
    });

    it('should can update feature dataConfig', done => {
        assertChangeStyle(done, [255, 0, 0, 255], layer => {
            layer.updateFeatureDataConfig(0, 1, {
                foo: 1
            });
            assert(layer.options.style.featureStyle[0].style[1].renderPlugin.dataConfig.foo === 1);
        }, true, {
            style: [
                {
                    filter: true,
                    renderPlugin: {
                        type: 'line',
                        dataConfig: { type: 'line' },
                    },
                    symbol: { lineColor: '#f00', lineWidth: 8, lineOpacity: 1 }
                }
            ],
            featureStyle: [
                {
                    id: 0,
                    style: [
                        {
                            renderPlugin: {
                                type: 'line',
                                dataConfig: { type: 'line' },
                            },
                            symbol: { lineColor: '#f00', lineWidth: 8, lineOpacity: 1 }
                        },
                        {
                            renderPlugin: {
                                type: 'line',
                                dataConfig: { type: 'line' },
                            },
                            symbol: { lineColor: '#f00', lineWidth: 8, lineOpacity: 1 }
                        }
                    ]
                }
            ]
        });
    });

    it('should can update dataConfig', done => {
        const points = {
            type: 'FeatureCollection',
            features: [
                { type: 'Feature', geometry: { type: 'Point', coordinates: [114.25814, 30.58595] }, properties: { type: 1 } }
            ]
        };
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: points,
            style: [
                {
                    renderPlugin: { type: 'native-point', dataConfig: { type: 'native-point' }, sceneConfig: { foo: 1 } },
                    symbol: { markerType: 'square', markerSize: 20 }
                },
                {
                    name: 'squarePoint',
                    renderPlugin: { type: 'native-point', dataConfig: { type: 'native-point' }, sceneConfig: { foo: 1 } },
                    symbol: { markerType: 'square', markerSize: 20 }
                }
            ]
        });
        let refreshCount = 0;
        layer.on('refreshstyle', () => {
            refreshCount++;
        });
        layer.once('pluginsinited', () => {
            layer.updateDataConfig(0, { foo2: 2 });
            layer.updateDataConfig('squarePoint', { foo3: 2 });
            assert.equal(refreshCount, 0);
            assert.deepStrictEqual(layer.options.style[0].renderPlugin.dataConfig, layer.getComputedStyle().style[0].renderPlugin.dataConfig);
            assert.deepStrictEqual(layer.getStyle()[0].renderPlugin.dataConfig, layer.getComputedStyle().style[0].renderPlugin.dataConfig);
            assert.deepStrictEqual(layer.options.style[0].renderPlugin.dataConfig, { type: 'native-point', foo2: 2 });
            assert.deepStrictEqual(layer.options.style[1].renderPlugin.dataConfig, { type: 'native-point', foo3: 2 });
            done();
        });
        layer.addTo(map);
    });

    it('can load null tile ref data', done => {
        // 多symbol style，第二个symbol因为geometry和第一个symbol相同，会用ref引用第一个geometry，这个测试是为了测试第一个geometry为null时的空指针异常
        const lines = {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: [
                            [13.41706531630723, 52.529564627058534],
                            [13.417135053741617, 52.52956625878565],
                            [13.417226248848124, 52.52954504632825],
                            [13.417290621864481, 52.52956625878565],
                            [13.417635229170008, 52.529564137540376]
                        ]
                    },
                    properties: {
                      gradients: [0, 'red', 0.7, 'yellow', 1, 'green'],
                      type: 2,
                      height: 50
                    }
                }
            ]
        };
        const renderPlugin = {
            type: 'line',
            dataConfig: {
              type: 'line'
            },
            sceneConfig: {
            }
          };

        const style = [
          {
            filter: true,
            renderPlugin,

            symbol: [
              {
                lineWidth: 12,
                lineColor: '#f00',
                lineOpacity: 0.5
              },
              {
                lineWidth: 6,
                lineColor: '#000',
                lineOpacity: 0.5
              }
            ]
          }
        ];
        map.setCenterAndZoom([13.417383158075495,52.529497236675155], 17.5);
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: lines,
            style
        });
        layer.once('canvasisdirty', () => {
            done();
        });
        layer.addTo(map);
    });

    it('should can update normal texture, fuzhenn/maptalks-ide#3063', done => {
        map.setLights({
            "directional": {
            "direction": [1, 1, -1],
            "color": [1, 1, 1]
          },
          "ambient": {
            "resource": null,
            "exposure": 1,
            "hsv": [0, 0, 0],
            "orientation": 0
          }
        });
        map.setPitch(70);
        const plugin = {
            type: 'lit',
            dataConfig: {
                type: '3d-extrusion',
                altitudeScale: 5,
                defaultAltitude: 10000
            },
            sceneConfig: {},
        };
        const material = {
          "baseColorTexture": "http://localhost:" + PORT + "/textures/basecolor.jpg",
          "baseColorFactor": [0.984313725490196, 0.984313725490196, 0.984313725490196, 1],
        };
        const style = [
            {
                filter: true,
                renderPlugin: plugin,
                symbol: { material }
            }
        ];
        const layer = new GeoJSONVectorTileLayer('gvt1', {
            data: polygon,
            style,
            tileStackDepth: 0
        });
        let styleRefreshed = false;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        let pixel;
        layer.once('canvasisdirty', () => {
            pixel = readPixel(renderer.canvas, x / 2, y / 2 - 4);
            layer.updateSymbol(0, {
                material: {
                    "baseColorTexture": "http://localhost:" + PORT + "/textures/basecolor.jpg",
                    "baseColorFactor": [0.984313725490196, 0.984313725490196, 0.984313725490196, 1],
                    "normalTexture": "http://localhost:" + PORT + "/textures/normal.jpg",
                    "normalMapFactor": 5
                }
            });
            setTimeout(() => {
                const newPixel = readPixel(renderer.canvas, x / 2, y / 2 - 4);
                //[87, 140, 143, 255]
                assert(styleRefreshed);
                assert.notDeepEqual(pixel, newPixel);
                done();
            }, 500);
        });
        layer.on('refreshstyle', () => {
            styleRefreshed = true;
        });
        layer.addTo(map);
    });

    it('should can update textOpacity from function-type to 1, maptalks/issues#336', done => {
        // 多symbol style，第二个symbol因为geometry和第一个symbol相同，会用ref引用第一个geometry，这个测试是为了测试第一个geometry为null时的空指针异常
        const data = {
            type: "FeatureCollection",
            features: [
                {
                    "type": "Feature",
                    "id": 0, "geometry": {
                        "type": "Point",
                        "coordinates": [-0.113049, 51.49856]
                    }, "properties": {
                        name: '■■■■■■■■■',
                        online: true
                    }
                }
            ]
        };
        const style = {
            style: [
                {
                    filter: true,
                    renderPlugin: {
                        dataConfig: {
                            type: "point",
                        },
                        sceneConfig: {
                            collision: false, fading: false, depthFunc: "always",
                        },
                        postProcess: {
                            enable: true, antialias: {
                                enable: true,
                            },
                        },
                        type: "text",
                    },
                    symbol: {
                        textName: "{name}",
                        textSize: 14,
                        textFill: '#f00',
                        textOpacity: {
                            type: "categorical",
                            property: "online",
                            stops: [[true, 1], [false, 0]]
                        }
                    }
                }
            ]
        };
        map.setCenterAndZoom([-0.113049, 51.49856], 14);
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data,
            style
        });
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        let count = 0;
        layer.on('layerload', () => {
            count++;
            if (count === 1) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                layer.updateSymbol(0, { textOpacity: 0.5 })
            } else if (count === 2) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                assert.deepEqual(pixel, [255, 0, 0, 127]);
                done();
            }

        });

        layer.addTo(map);
    });

    function assertChangeStyle(done, expectedColor, changeFun, isSetStyle, style, renderCount, doneRenderCount) {
        style = style || [
            {
                name: 'lineStyle',
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
            style,
            tileLimitPerFrame: 0,
            loadingLimit: 0,
            tileStackDepth: 0
        });
        renderCount = renderCount || 0;
        doneRenderCount = doneRenderCount || 2;
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
            if (count === renderCount + 1) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                changeFun(layer);
            } else if (count === renderCount + doneRenderCount) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //变成绿色
                assert.deepEqual(pixel, expectedColor);
                done();
            }
        });
        layer.addTo(map);
    }

});

