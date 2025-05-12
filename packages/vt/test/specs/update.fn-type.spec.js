const assert = require('assert');
const { readPixel } = require('../common/Util');
const maptalks = require('maptalks');
const { GeoJSONVectorTileLayer } = require('../../dist/maptalks.vt.js');


const DEFAULT_VIEW = {
    center: [0, 0],
    zoom: 6,
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
        { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-1, 0], [1, 0]] }, properties: { type: 1, color: '#0f0' } }
    ]
};

describe('update function type style specs', () => {
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

    it('normal to zoom function type', done => {
        const symbol = { lineColor: '#f00', lineWidth: 8, lineOpacity: 1 };
        assertChangeStyle(done, symbol, [255, 0, 0, 255], [0, 255, 0, 255], layer => {
            layer.updateSymbol(0, {
                lineColor: {
                    type: 'interval',
                    stops: [
                        [map.getZoom(), '#0f0'],
                        [map.getZoom() + 2, '#f00'],
                    ]
                }
            });
        });
    });

    it('normal to property function type', done => {
        const symbol = { lineColor: '#f00', lineWidth: 8, lineOpacity: 1 };
        assertChangeStyle(done, symbol, [255, 0, 0, 255], [0, 255, 0, 255], layer => {
            layer.updateSymbol(0, {
                lineColor: {
                    type: 'categorical',
                    property: 'type',
                    stops: [
                        [1, '#0f0'],
                        [2, '#f00'],
                    ]
                }
            });
        });
    });

    it('property function type to property function type', done => {
        const symbol = { lineColor: {
            type: 'categorical',
            property: 'type',
            stops: [
                [1, '#f00'],
                [2, '#f00'],
            ]
        }, lineWidth: 8, lineOpacity: 1 };
        assertChangeStyle(done, symbol, [255, 0, 0, 255], [0, 255, 0, 255], layer => {
            layer.updateSymbol(0, {
                lineColor: {
                    type: 'categorical',
                    property: 'type',
                    stops: [
                        [1, '#0f0'],
                        [2, '#f00'],
                    ]
                }
            });
        }, false, 8);
    });

    it('normal to property-zoom function type', done => {
        const symbol = { lineColor: '#f00', lineWidth: 8, lineOpacity: 1 };
        assertChangeStyle(done, symbol, [255, 0, 0, 255], [0, 0, 255, 255], layer => {
            layer.updateSymbol(0, {
                lineColor: {
                    type: 'categorical',
                    property: 'type',
                    stops: [
                        [1, {
                            type: 'interval',
                            stops: [
                                [map.getZoom(), '#00f'],
                                [map.getZoom() + 2, '#f00'],
                            ]
                        }],
                        [2, '#f00'],
                    ]
                }
            });
        });
    });

    it('property-zoom based to normal color', done => {
        const symbol = { lineColor: {
            type: 'categorical',
            property: 'type',
            stops: [
                [1, {
                    type: 'interval',
                    stops: [
                        [map.getZoom(), '#00f'],
                        [map.getZoom() + 2, '#f00'],
                    ]
                }],
                [2, '#f00'],
            ]
        }, lineWidth: 8, lineOpacity: 1 };
        assertChangeStyle(done, symbol, [0, 0, 255, 255], [255, 0, 0, 255], layer => {
            layer.updateSymbol(0, {
                lineColor: '#f00'
            });
        });
    });

    //TODO 目前暂时不支持zoom-property形式的function type
    it.skip('zoom-property-zoom based to normal color', done => {
        const symbol = { lineColor: {
            type: 'interval',
            stops: [
                [map.getZoom(), {
                    type: 'categorical',
                    property: 'type',
                    stops: [
                        [1, '#00f'],
                        [2, '#f00'],
                    ]
                }],
                [map.getZoom() + 2, '#f00'],
            ]
        }, lineWidth: 8, lineOpacity: 1 };
        assertChangeStyle(done, symbol, [0, 0, 255, 255], [255, 0, 0, 255], layer => {
            layer.updateSymbol(0, {
                lineColor: '#f00'
            });
        });
    });

    it('zoom based to normal color', done => {
        const symbol = { lineColor: {
            type: 'interval',
            stops: [
                [map.getZoom(), '#00f'],
                [map.getZoom() + 2, '#f00'],
            ]
        }, lineWidth: 8, lineOpacity: 1 };
        assertChangeStyle(done, symbol, [0, 0, 255, 255], [255, 0, 0, 255], layer => {
            layer.updateSymbol(0, {
                lineColor: '#f00'
            });
        });
    });

    function assertChangeStyle(done, symbol, currentColor, expectedColor, changeFun, isSetStyle, endCount) {
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
                symbol
            }
        ];
        const layer = new GeoJSONVectorTileLayer('gvt', {
            tileLimitPerFrame: 0,
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
        layer.on(isSetStyle ? 'canvasisdirty' : 'canvasisdirty', () => {
            if (!dirty) {
                return;
            }
            count++;
            if (count === 1) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, currentColor);
                changeFun(layer);
            } else if (count === (endCount || 2)) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //变成绿色
                assert.deepEqual(pixel, expectedColor);
                done();
            }
        });
        layer.addTo(map);
    }

});

