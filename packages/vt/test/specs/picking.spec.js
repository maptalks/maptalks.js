const path = require('path');
const assert = require('assert');
const data = require('../integration/fixtures/data');
const maptalks = require('maptalks');
const startServer = require('./server.js');
const PORT = 4398;

const {
    GeoJSONVectorTileLayer,
    PointLayer,
    LineStringLayer,
    VectorTileLayer,
    PolygonLayer
} = require('../../dist/maptalks.vt.js');
const {
    GroupGLLayer
} = require('@maptalks/gl');

const DEFAULT_VIEW = {
    center: [0, 0],
    zoom: 6,
    pitch: 0,
    bearing: 0
};
const ICON_PATH = 'file://' + path.resolve(__dirname, '../integration/resources/plane-min.png');
describe('picking specs', () => {
    let map, container, server;
    before(done => {
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

    const runner = (options, coord, expected, ignoreSymbol, done) => {
        map = new maptalks.Map(container, options.view || DEFAULT_VIEW);
        options.tileStackDepth = 0;
        options.loadingLimit = 0;
        map.on('click', e => {
            console.log(e.coordinate);
        });
        const layer = new GeoJSONVectorTileLayer('gvt', options);
        layer.once('canvasisdirty', () => {
            const result = layer.identify(coord);
            if (ignoreSymbol) {
                for (let i = 0; i < result.length; i++) {
                    delete result[i].data.symbol;
                }
            }
            for (let i = 0; i < result.length; i++) {
                assert(result[i].coordinate.length === 3);
                // ignore tiles
                delete result[i].data.tile;
            }
            if (typeof expected === 'object') {
                assert.deepEqual(result, expected, JSON.stringify(result));
            } else if (typeof expected === 'number') {
                assert.ok(result.length === expected, 'actual result length: ' + result.length);
            }
            done();
        });
        layer.addTo(map);
    };
    context('icon', () => {
        it('should pick a normal icon', done => {
            const options = {
                data: data.point,
                style: [{
                    renderPlugin: {
                        type: 'icon',
                        dataConfig: {
                            type: 'point'
                        },
                        sceneConfig: {
                            fading: false,
                            collision: false
                        }
                    },
                    symbol: {
                        markerFile: ICON_PATH
                    }
                }],
                pickingGeometry: true,
                pickingPoint: true
            };
            const coord = [0.5, 0.5];
            const expected = [{
                'data': {
                    'feature': {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Point',
                            'coordinates': [0.5, 0.5]
                        },
                        'properties': {
                            'type': 1,
                            'height': 20000
                        },
                        'id': 0,
                        'layer': 0
                    },
                },
                'point': [736.00006, 736.00006, -0.00049],
                'coordinate': [0.5053711339132829, 0.5053645811220168, 0.02859089700105285],
                'type': 'icon',
                'plugin': 0
            }];
            runner(options, coord, expected, true, done);
        });
        it('should pick an icon with multiple symbols', done => {
            const options = {
                data: data.point,
                style: [{
                    renderPlugin: {
                        type: 'icon',
                        dataConfig: {
                            type: 'point'
                        },
                        sceneConfig: {
                            fading: false,
                            collision: false
                        }
                    },
                    symbol: [
                        {
                            markerFile: ICON_PATH
                        },
                        {
                            markerType: 'ellipse',
                            markerWidth: 10,
                            markerHeight: 10,
                        }
                    ]
                }],
                pickingGeometry: true,
                pickingPoint: true
            };
            const coord = [0.5, 0.5];
            const expected = [{
                'data': {
                    'feature': {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Point',
                            'coordinates': [0.5, 0.5]
                        },
                        'properties': {
                            'type': 1,
                            'height': 20000
                        },
                        'id': 0,
                        'layer': 0
                    },
                },
                'point': [736.00006, 736.00006, -0.00049],
                'coordinate': [0.5053711339132829, 0.5053645811220168, 0.02859089700105285],
                'type': 'icon',
                'plugin': 0
            }];
            runner(options, coord, expected, true, done);
        });
        it('should pick an icon with text', done => {
            const options = {
                data: data.point,
                style: [{
                    renderPlugin: {
                        type: 'icon',
                        dataConfig: {
                            type: 'point'
                        },
                        sceneConfig: {
                            collision: false
                        }
                    },
                    symbol: {
                        markerFile: ICON_PATH,
                        markerDx: -100,
                        textName: 'ABC'
                    }
                }],
                pickingGeometry: true,
                pickingPoint: true
            };
            const coord = [0.5, 0.5];
            const expected = [{
                'data': {
                    'feature': {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Point',
                            'coordinates': [0.5, 0.5]
                        },
                        'properties': {
                            'type': 1,
                            'height': 20000
                        },
                        'id': 0,
                        'layer': 0
                    },
                },
                'coordinate': [0.5053711339132829, 0.5053645811220168, 0.02859089700105285],
                'point': [736.00006, 736.00006, -0.00049],
                'type': 'icon',
                'plugin': 0
            }];
            runner(options, coord, expected, true, done);
        });
        it('should pick a icon on a rotated map', done => {
            const options = {
                data: data.point,
                style: [{
                    renderPlugin: {
                        type: 'icon',
                        dataConfig: {
                            type: 'point'
                        },
                        sceneConfig: {
                            collision: true,
                            fading: false
                        }
                    },
                    symbol: {
                        markerFile: ICON_PATH
                    }
                }],
                loadingLimit: 0,
                view: {
                    center: [0, 0],
                    zoom: 6,
                    pitch: 60,
                    bearing: 90
                }
            };
            const coord = [0.5, 0.5];
            const expected = 1;
            runner(options, coord, expected, true, done);
        });
        it('should pick a icon with rotation alignment', done => {
            const options = {
                data: data.point,
                style: [{
                    renderPlugin: {
                        type: 'icon',
                        dataConfig: {
                            type: 'point'
                        },
                        sceneConfig: {
                            collision: false
                        }
                    },
                    symbol: {
                        markerFile: ICON_PATH,
                        markerPitchAlignment: 'map'
                    }
                }],
                loadingLimit: 0,
                view: {
                    center: [0, 0],
                    zoom: 6,
                    pitch: 60,
                    bearing: 90
                }
            };
            const coord = [0.5, 0.5];
            const expected = 1;
            runner(options, coord, expected, true, done);
        });
        it('should ignore icon in collision fading', done => {
            const options = {
                data: data.point,
                style: [{
                    renderPlugin: {
                        type: 'icon',
                        dataConfig: {
                            type: 'point'
                        },
                        sceneConfig: {
                            collision: true,
                            fading: true
                        }
                    },
                    symbol: {
                        markerFile: ICON_PATH
                    }
                }]
            };
            const coord = [0.5, 0.5];
            const expected = [];
            //icon在collision fading中，无法被pick出来
            runner(options, coord, expected, true, done);
        });
    });
    context('text', () => {
        it('should pick a text with a rotated map', done => {
            const options = {
                data: data.point,
                style: [{
                    renderPlugin: {
                        type: 'text',
                        dataConfig: {
                            type: 'point'
                        },
                        sceneConfig: {
                            collision: false
                        }
                    },
                    symbol: {
                        textName: '未来'
                    }
                }],
                loadingLimit: 0,
                view: {
                    center: [0, 0],
                    zoom: 6,
                    pitch: 60,
                    bearing: 90
                }
            };
            const coord = [0.5, 0.5];
            const expected = 1;
            runner(options, coord, expected, false, done);
        });
        it('should pick a text with rotation alignment', done => {
            const options = {
                data: data.point,
                style: [{
                    renderPlugin: {
                        type: 'text',
                        dataConfig: {
                            type: 'point'
                        },
                        sceneConfig: {
                            collision: true,
                            fading: false
                        }
                    },
                    symbol: {
                        textName: '未来',
                        textPitchAlignment: 'map'
                    }
                }],
                loadingLimit: 0,
                view: {
                    center: [0, 0],
                    zoom: 6,
                    pitch: 60,
                    bearing: 90
                }
            };
            const coord = [0.5, 0.5];
            const expected = 1;
            runner(options, coord, expected, false, done);
        });
        it('should pick a text with line placement', done => {
            const options = {
                data: data.line,
                style: [{
                    renderPlugin: {
                        type: 'text',
                        dataConfig: {
                            type: 'point'
                        },
                        sceneConfig: {
                            collision: true,
                            fading: false
                        }
                    },
                    symbol: {
                        textName: '未来',
                        textPlacement: 'line'
                    }
                }],
                loadingLimit: 0,
                view: {
                    center: [0, 0],
                    zoom: 6,
                    pitch: 60,
                    bearing: 90
                }
            };
            const coord = [-0.43976, 0.55968];
            const expected = 1;
            runner(options, coord, expected, false, done);
        });
        it('should pick a text with pitch alignment and line placement', done => {
            const options = {
                data: data.line,
                style: [{
                    renderPlugin: {
                        type: 'text',
                        dataConfig: {
                            type: 'point'
                        },
                        sceneConfig: {
                            collision: true,
                            fading: false
                        }
                    },
                    symbol: {
                        textName: '未来',
                        textPitchAlignment: 'map',
                        textPlacement: 'line'
                    }
                }],
                loadingLimit: 0,
                view: {
                    center: [0, 0],
                    zoom: 6,
                    pitch: 60,
                    bearing: 90
                }
            };
            const coord = [-0.9541270, 0.54773];
            const expected = 1;
            runner(options, coord, expected, false, done);
        });
    });
    context('native-point', () => {
        it('should pick native points', done => {
            const options = {
                data: {
                    type: 'FeatureCollection',
                    features: [{
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [0.5, 0.5]
                        },
                        properties: {
                            type: 1
                        }
                    }, {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [0.6, 0.6]
                        },
                        properties: {
                            type: 2
                        }
                    }]
                },
                style: [{
                    filter: ['==', 'type', 1],
                    renderPlugin: {
                        type: 'native-point',
                        dataConfig: {
                            type: 'native-point'
                        }
                    },
                    symbol: {
                        markerSize: 30,
                        markerFill: '#f00',
                        markerOpacity: 0.5
                    }
                }, {
                    renderPlugin: {
                        type: 'native-point',
                        dataConfig: {
                            type: 'native-point'
                        }
                    },
                    symbol: {
                        markerType: 'square',
                        markerSize: 20,
                        markerFill: '#ff0',
                        markerOpacity: 0.5
                    }
                }],
                loadingLimit: 0,
                view: {
                    center: [0.5, 0.5],
                    zoom: 8
                }
            };
            map = new maptalks.Map(container, options.view || DEFAULT_VIEW);
            const layer = new GeoJSONVectorTileLayer('gvt', options);
            layer.once('canvasisdirty', () => {
                const yellowPoint = layer.identify([0.6, 0.6]);
                const redPoint = layer.identify([0.5, 0.5]);
                assert.ok(yellowPoint.length === 1);
                assert.ok(redPoint.length === 1);
                assert.notDeepEqual(yellowPoint, redPoint);
                const expected = {
                    'feature': {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Point',
                            'coordinates': [0.5, 0.5]
                        },
                        'properties': {
                            'type': 1
                        },
                        'id': 0,
                        'layer': 0
                    },
                    'symbol': {
                        'markerSize': 30,
                        'markerFill': '#f00',
                        'markerOpacity': 0.5
                    }
                };
                delete redPoint[0].data.tile;
                assert(redPoint[0].coordinate.length === 3);
                assert.deepEqual(redPoint[0].data, expected, JSON.stringify(redPoint[0].data));
                done();
            });
            layer.addTo(map);
        });
    });
    context('native-line', () => {
        it('should pick native lines', done => {
            const options = {
                data: {
                    type: 'FeatureCollection',
                    features: [{
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: [
                                [13.417135053741617, 52.52956625878565],
                                [13.417226248848124, 52.52954504632825],
                            ]
                        }
                    }]
                },
                style: [{
                    renderPlugin: {
                        type: 'native-line',
                        dataConfig: {
                            type: 'native-line'
                        }
                    },
                    symbol: {
                        lineColor: '#f00'
                    }
                }],
                loadingLimit: 0,
                view: {
                    center: [13.417226248848124, 52.52954504632825],
                    zoom: 18
                }
            };
            map = new maptalks.Map(container, options.view || DEFAULT_VIEW);
            const layer = new GeoJSONVectorTileLayer('gvt', options);
            layer.once('canvasisdirty', () => {
                const redPoint = layer.identify([13.417226248848124, 52.52954504632825]);
                const expected = {
                    'feature': {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'LineString',
                            'coordinates': [
                                [13.417135053741617, 52.52956625878565],
                                [13.417226248848124, 52.52954504632825]
                            ]
                        },
                        'id': 0,
                        'layer': 0,
                        "properties": {}
                    },
                    'symbol': {
                        'lineColor': '#f00'
                    }
                };
                delete redPoint[0].data.tile;
                assert.deepEqual(redPoint[0].data, expected, JSON.stringify(redPoint[0].data));
                done();
            });
            layer.addTo(map);
        });
    });
    context('line and polygon', () => {
        it('should pick lines', done => {
            const options = {
                data: {
                    type: 'FeatureCollection',
                    features: [{
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: [
                                [13.417135053741617, 52.52956625878565],
                                [13.417226248848124, 52.52956625878565],
                            ]
                        }
                    }]
                },
                style: [{
                    filter: true,
                    renderPlugin: {
                        type: 'line',
                        dataConfig: {
                            type: 'line'
                        }
                    },
                    symbol: {
                        lineColor: '#f00',
                        lineWidth: 20
                    }
                }],
                loadingLimit: 0,
                view: {
                    center: [13.417226248848124, 52.52954504632825],
                    zoom: 18
                }
            };
            map = new maptalks.Map(container, options.view || DEFAULT_VIEW);
            const layer = new GeoJSONVectorTileLayer('gvt', options);
            layer.once('canvasisdirty', () => {
                const redPoint = layer.identify([13.41720, 52.52956625878565]);
                const expected = {
                    'feature': {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'LineString',
                            'coordinates': [
                                [13.417135053741617, 52.52956625878565],
                                [13.417226248848124, 52.52956625878565]
                            ]
                        },
                        'id': 0,
                        'layer': 0,
                        "properties": {}
                    },
                    'symbol': {
                        'lineColor': '#f00',
                        'lineWidth': 20
                    }
                };
                delete redPoint[0].data.tile;
                assert(redPoint[0].coordinate.length === 3);
                assert.deepEqual(redPoint[0].data, expected, JSON.stringify(redPoint[0].data));
                done();
            });
            layer.addTo(map);
        });
        it('should pick lines with customProperties', done => {
            const options = {
                features: true,
                data: {
                    type: 'FeatureCollection',
                    features: [{
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: [
                                [13.417135053741617, 52.52956625878565],
                                [13.417226248848124, 52.52956625878565],
                            ]
                        }
                    }]
                },
                style: [{
                    filter: true,
                    renderPlugin: {
                        type: 'line',
                        dataConfig: {
                            type: 'line'
                        }
                    },
                    customProperties: [
                        {
                            "filter": true,
                              "properties": {
                                "custom_prop_line_batch_id": "admin-0-boundary-bg"
                              }
                        }
                    ],
                    symbol: {
                        lineColor: '#f00',
                        lineWidth: 20
                    }
                }],
                loadingLimit: 0,
                view: {
                    center: [13.417226248848124, 52.52954504632825],
                    zoom: 18
                }
            };
            map = new maptalks.Map(container, options.view || DEFAULT_VIEW);
            const layer = new GeoJSONVectorTileLayer('gvt', options);
            layer.once('canvasisdirty', () => {
                const redPoint = layer.identify([13.41720, 52.52956625878565]);
                const expected = {
                    "feature": {
                        "type": "Feature",
                        "layer": "0",
                        "id": 0,
                        "geometry": {
                            "type": "LineString",
                            "coordinates": [[13.417135030031202, 52.52956633939653], [13.417226225137709, 52.52956633939653]]
                        },
                        "properties": {
                            "custom_prop_line_batch_id": "admin-0-boundary-bg",
                            "mapbox_clip_start": 0,
                            "mapbox_clip_end": 1
                        },
                        "extent": 8192
                    },
                    "symbol": {
                        "lineColor": "#f00",
                        "lineWidth": 20
                    }
                };
                delete redPoint[0].data.tile;
                assert(redPoint[0].coordinate.length === 3);
                assert.deepEqual(redPoint[0].data, expected, JSON.stringify(redPoint[0].data));
                done();
            });
            layer.addTo(map);
        });
        it('should pick polygon', done => {
            const options = {
                data: {
                    type: 'FeatureCollection',
                    features: [{
                        type: 'Feature',
                        geometry: {
                            type: 'Polygon',
                            coordinates: [
                                [
                                    [13.417135053741617, 52.52956625878565],
                                    [13.417226248848124, 52.52956625878565],
                                    [13.417226248848124, 52.52946625878565],
                                    [13.417135053741617, 52.52946625878565],
                                    [13.417135053741617, 52.52956625878565]
                                ]
                            ]
                        }
                    }]
                },
                style: [{
                    filter: true,
                    renderPlugin: {
                        type: 'fill',
                        dataConfig: {
                            type: 'fill'
                        }
                    },
                    symbol: {
                        polygonFill: '#f00',
                        polygonOpacity: 1
                    }
                }],
                loadingLimit: 0,
                view: {
                    center: [13.417226248848124, 52.52954504632825],
                    zoom: 18
                }
            };
            map = new maptalks.Map(container, options.view || DEFAULT_VIEW);
            const layer = new GeoJSONVectorTileLayer('gvt', options);
            layer.once('canvasisdirty', () => {
                const redPoint = layer.identify([13.41720, 52.52952]);
                const expected = {
                    'feature': {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Polygon',
                            'coordinates': [
                                [
                                    [13.417135053741617, 52.52956625878565],
                                    [13.417226248848124, 52.52956625878565],
                                    [13.417226248848124, 52.52946625878565],
                                    [13.417135053741617, 52.52946625878565],
                                    [13.417135053741617, 52.52956625878565]
                                ]
                            ]
                        },
                        'id': 0,
                        'layer': 0,
                        'properties': {}
                    },
                    'symbol': {
                        'polygonFill': '#f00',
                        'polygonOpacity': 1
                    }
                };
                delete redPoint[0].data.tile;
                assert(redPoint[0].coordinate.length === 3);
                assert.deepEqual(redPoint[0].data, expected, JSON.stringify(redPoint[0].data));
                done();
            });
            layer.addTo(map);
        });

        it('should pick polygon line', done => {
            const options = {
                data: {
                    type: 'FeatureCollection',
                    features: [{
                        type: 'Feature',
                        geometry: {
                            type: 'Polygon',
                            coordinates: [
                                [
                                    [13.417135053741617, 52.52956625878565],
                                    [13.417226248848124, 52.52956625878565],
                                    [13.417226248848124, 52.52946625878565],
                                    [13.417135053741617, 52.52946625878565],
                                    [13.417135053741617, 52.52956625878565]
                                ]
                            ]
                        }
                    }]
                },
                style: [{
                    filter: true,
                    renderPlugin: {
                        type: 'line',
                        dataConfig: {
                            type: 'line'
                        }
                    },
                    symbol: {
                        lineColor: '#f00',
                        lineWidth: 10
                    }
                }],
                loadingLimit: 0,
                view: {
                    center: [13.417226248848124, 52.52954504632825],
                    zoom: 18
                }
            };
            map = new maptalks.Map(container, options.view || DEFAULT_VIEW);
            const layer = new GeoJSONVectorTileLayer('gvt', options);
            layer.once('canvasisdirty', () => {
                const redPoint = layer.identify([13.41720, 52.52952]);
                const expected = {
                    'feature': {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Polygon',
                            'coordinates': [
                                [
                                    [13.417135053741617, 52.52956625878565],
                                    [13.417226248848124, 52.52956625878565],
                                    [13.417226248848124, 52.52946625878565],
                                    [13.417135053741617, 52.52946625878565],
                                    [13.417135053741617, 52.52956625878565]
                                ]
                            ]
                        },
                        'id': 0,
                        'layer': 0,
                        'properties': {}
                    },
                    'symbol': {
                        'lineColor': '#f00',
                        'lineWidth': 10
                    }
                };
                delete redPoint[0].data.tile;
                assert(redPoint[0].coordinate.length === 3);
                assert.deepEqual(redPoint[0].data, expected, JSON.stringify(redPoint[0].data));
                done();
            });
            layer.addTo(map);
        });



    it('should return feature properties used in symbol', done => {
            const options = {
                // 不返回features
                features: 0,
                data: {
                    type: 'FeatureCollection',
                    features: [{
                        type: 'Feature',
                        geometry: {
                            type: 'Polygon',
                            coordinates: [
                                [
                                    [13.417135053741617, 52.52956625878565],
                                    [13.417226248848124, 52.52956625878565],
                                    [13.417226248848124, 52.52946625878565],
                                    [13.417135053741617, 52.52946625878565],
                                    [13.417135053741617, 52.52956625878565]
                                ]
                            ]
                        },
                        properties: {
                            type: 1,
                            color: '#f00',
                            foo: 'bar',
                            foo1: 'bar1'
                        }
                    }]
                },
                style: [{
                    filter: true,
                    renderPlugin: {
                        type: 'fill',
                        dataConfig: {
                            type: 'fill'
                        }
                    },
                    symbol: {
                        polygonFill: {
                            type: 'categorical',
                            default: '#000',
                            property: 'type',
                            stops: [
                                [
                                    1, { type: 'identity', property: 'color' }
                                ]
                            ]
                        },
                        polygonOpacity: 1
                    }
                }],
                loadingLimit: 0,
                view: {
                    center: [13.417226248848124, 52.52954504632825],
                    zoom: 18
                }
            };
            map = new maptalks.Map(container, options.view || DEFAULT_VIEW);
            const layer = new GeoJSONVectorTileLayer('gvt', options);
            layer.once('canvasisdirty', () => {
                const redPoint = layer.identify([13.41720, 52.52952]);
                const expected = {
                    "type": 3,
                    "layer": "0",
                    "id": 0,
                    "properties": {
                        "type": 1,
                        "color": "#f00"
                    }
                };
                delete redPoint[0].data.feature["__fea_idx"];
                assert(redPoint[0].coordinate.length === 3);
                assert.deepEqual(redPoint[0].data.feature, expected, JSON.stringify(redPoint[0].data.feature));
                done();
            });
            layer.addTo(map);
        });
    });

    context('should pick a tube', () => {
        it('should pick a tube', done => {
            const options = {
                data: {
                    type: 'FeatureCollection',
                    features: [{
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: [
                                [13.417135053741617, 52.52956625878565, 0],
                                [13.417226248848124, 52.52956625878565, 1],
                            ]
                        }
                    }]
                },
                style: [{
                    filter: true,
                    renderPlugin: {
                        type: 'tube',
                        dataConfig: {
                            type: 'round-tube'
                        }
                    },
                    symbol: {
                        lineColor: '#f00',
                        lineWidth: 20
                    }
                }],
                loadingLimit: 0,
                view: {
                    center: [13.417226248848124, 52.52954504632825],
                    zoom: 18
                }
            };
            map = new maptalks.Map(container, options.view || DEFAULT_VIEW);
            options.tileStackDepth = 0;
            const layer = new GeoJSONVectorTileLayer('gvt', options);
            layer.once('canvasisdirty', () => {
                const redPoint = layer.identify([13.41720, 52.52956625878565]);
                const expected = {
                    'feature': {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'LineString',
                            'coordinates': [
                                [13.417135053741617, 52.52956625878565, 0],
                                [13.417226248848124, 52.52956625878565, 1]
                            ]
                        },
                        'id': 0,
                        'layer': 0,
                        'properties': {}
                    },
                    'symbol': {
                        'lineColor': '#f00',
                        'lineWidth': 20
                    }
                };
                delete redPoint[0].data.tile;
                assert(redPoint[0].coordinate.length === 3);
                assert.deepEqual(redPoint[0].data, expected, JSON.stringify(redPoint[0].data));
                done();
            });
            layer.addTo(map);
        });
    });

    context('water picking', () => {
        const symbol = {
            "ssr": false,
            "texWaveNormal": 'file://' + path.resolve(__dirname, '../integration/resources/normal.png'),
            "texWavePerturbation": 'file://' + path.resolve(__dirname, '../integration/resources/perturbation.png'),
            "waterBaseColor": [0.1451, 0.2588, 0.4863, 1],
            "contrast": 1,
            "hsv": [0, 0, 0],
            "uvScale": 1 / 1000,
            "animation": false,
            "waterSpeed": 1,
            "waterDirection": 0,
            "visible": true
        };
        const renderPlugin = {
            "type": "water",
            "dataConfig": {
                "type": "fill"
            }
        };
        it('should pick point in water', done => {
            const options = {
                pickingGeometry: true,
                // 不返回features
                // features: 0,
                data: {
                    type: 'FeatureCollection',
                    features: [{
                        type: 'Feature',
                        geometry: {
                            type: 'Polygon',
                            coordinates: [
                                [
                                    [13.417135053741617, 52.52956625878565],
                                    [13.417226248848124, 52.52956625878565],
                                    [13.417226248848124, 52.52946625878565],
                                    [13.417135053741617, 52.52946625878565],
                                    [13.417135053741617, 52.52956625878565]
                                ]
                            ]
                        },
                        properties: {
                            type: 1,
                            color: '#f00',
                            foo: 'bar',
                            foo1: 'bar1'
                        }
                    }]
                },
                style: [{
                    filter: true,
                    renderPlugin,
                    symbol
                }],
                loadingLimit: 0,
                view: {
                    center: [13.417226248848124, 52.52954504632825],
                    zoom: 18
                }
            };
            map = new maptalks.Map(container, options.view || DEFAULT_VIEW);
            const layer = new GeoJSONVectorTileLayer('gvt', options);
            layer.once('canvasisdirty', () => {
                const hit = layer.identify([13.41720, 52.52952])[0];
                const expectedFeature = { "type": "Feature", "geometry": { "type": "Polygon","coordinates": [[[13.417135053741617,52.52956625878565],[13.417226248848124,52.52956625878565],[13.417226248848124,52.52946625878565],[13.417135053741617,52.52946625878565],[13.417135053741617,52.52956625878565]]] },"properties": { "type": 1, "color": "#f00", "foo": "bar", "foo1": "bar1" },"id": 0,"layer": 0 };
                assert.deepEqual(hit.coordinate, [13.417199426757994, 52.52951893867434, 7.081154552807229e-10]);
                assert.deepEqual(expectedFeature, hit.data.feature);
                done();
            });
            layer.addTo(map);
        });
    });

    context('gltf picking', () => {
        it('should pick a gltf', done => {
            const scale = Math.pow(2, 15);
            const options = {
                data: data.point,
                style: [{
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
                        polygonOpacity: 1,
                        polygonFill: '#f00'
                    }
                }],
                pickingGeometry: true,
                pickingPoint: true
            };
            const coord = [0.5, 0.5];
            const expected = [{
                'data': {
                    'feature': {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Point',
                            'coordinates': [0.5, 0.5]
                        },
                        'properties': {
                            'type': 1,
                            'height': 20000
                        },
                        'id': 0,
                        'layer': 0
                    },
                },
                'point': [702.48068, 702.48068, 279.81348],
                'coordinate': [0.4823552013840498, 0.48234950372197244, 16384.240119431175],
                'type': 'gltf-lit',
                'plugin': 0
            }];
            runner(options, coord, expected, true, done);
        });
    });

    context('vector layer\'s picking', () => {
        it('should pick point in PointLayer', done => {
            const options = {
                loadingLimit: 0,
                view: {
                    center: [0, 0],
                    zoom: 6
                }
            };
            const data = {
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [0, 0]
                    },
                    properties: {
                        idx: 10
                    }
                }, {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [0.6, 0.6]
                    },
                    properties: {
                        idx: 11
                    }
                }]
            };
            map = new maptalks.Map(container, options.view || DEFAULT_VIEW);
            const layer = new PointLayer('gvt', data, {
                style: [
                    {
                        filter: true,
                        symbol: {
                            markerType: 'ellipse',
                            markerFill: '#f00',
                            markerWidth: 10,
                            markerHeight: 10,
                            markerLineWidth: 0
                        }
                    }
                ]
            });
            layer.once('canvasisdirty', () => {
                const redPoint = layer.identify([0.6, 0.6]);
                assert(redPoint[0].geometry instanceof maptalks.Marker);
                assert(redPoint[0].geometry.getProperties().idx === 11);
                assert(redPoint[0].coordinate);
                done();
            });
            layer.addTo(map);

        });

        it('should pick point only with text in PointLayer', done => {
            const options = {
                loadingLimit: 0,
                view: {
                    center: [0, 0],
                    zoom: 6
                }
            };
            const marker = new maptalks.Marker([0, 0], {
                symbol: {
                    textName: '■■■■■■',
                    textSize: 20
                },
                properties: {
                    idx: 11
                }
            });
            map = new maptalks.Map(container, options.view || DEFAULT_VIEW);
            const layer = new PointLayer('gvt', [marker]);
            new GroupGLLayer('group', [layer], {
        sceneConfig: {
          environment: {
            enable: true,
            mode: 1,
            level: 0,
            brightness: 0,
          },
        },
      }).addTo(map);
            layer.once('canvasisdirty', () => {
                const redPoint = layer.identify([0, 0]);
                assert(redPoint[0].geometry instanceof maptalks.Marker);
                assert(redPoint[0].geometry.getProperties().idx === 11);
                assert(redPoint[0].coordinate);
                done();
            });
            // layer.addTo(map);

        });

        it('should pick point with multiple symbols in PointLayer', done => {
            const options = {
                loadingLimit: 0,
                view: {
                    center: [0, 0],
                    zoom: 6
                }
            };
            const data = {
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [0, 0]
                    },
                    properties: {
                        idx: 10
                    }
                }, {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [0.6, 0.6]
                    },
                    properties: {
                        idx: 11
                    }
                }]
            };
            map = new maptalks.Map(container, options.view || DEFAULT_VIEW);
            const layer = new PointLayer('gvt', data, {
                style: [
                    {
                        filter: true,
                        symbol: [
                            {
                                markerType: 'ellipse',
                                markerFill: '#f00',
                                markerWidth: 20,
                                markerHeight: 20
                            },
                            {
                                markerType: 'ellipse',
                                markerFill: '#00f',
                                markerWidth: 10,
                                markerHeight: 10
                            }
                        ]
                    }
                ]
            });
            layer.once('canvasisdirty', () => {
                const redPoint = layer.identify([0.6, 0.6]);
                assert(redPoint[0].geometry instanceof maptalks.Marker);
                assert(redPoint[0].geometry.getProperties().idx === 11);
                done();
            });
            layer.addTo(map);

        });

        it('should pick lines in LineStringLayer', done => {
            const options = {
                loadingLimit: 0,
                view: {
                    center: [13.417226248848124, 52.52954504632825],
                    zoom: 18
                }
            };
            const data = {
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [13.417135053741617, 52.52946625878565],
                            [13.417226248848124, 52.52946625878565],
                        ]
                    },
                    properties: {
                        idx: 10
                    }
                }, {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [13.417135053741617, 52.52956625878565],
                            [13.417226248848124, 52.52956625878565],
                        ]
                    },
                    properties: {
                        idx: 11
                    }
                }]
            };
            map = new maptalks.Map(container, options.view || DEFAULT_VIEW);
            const layer = new LineStringLayer('gvt', data, {
                style: [
                    {
                        filter: true,
                        symbol: {
                            lineColor: '#f00',
                            lineWidth: 10
                        }
                    }
                ]
            });
            layer.once('canvasisdirty', () => {
                const redPoint = layer.identify([13.41720, 52.52956625878565]);
                assert(redPoint[0].geometry instanceof maptalks.LineString);
                assert(redPoint[0].geometry.getProperties().idx === 11);
                assert(redPoint[0].coordinate);
                done();
            });
            layer.addTo(map);
        });

        it('should pick polygon in polygonLayer', done => {
            const options = {
                loadingLimit: 0,
                view: {
                    center: [13.417226248848124, 52.52954504632825],
                    zoom: 18
                }
            };
            const data = {
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [13.417135053741617, 52.52976625878565],
                                [13.417226248848124, 52.52976625878565],
                                [13.417226248848124, 52.52966625878565],
                                [13.417135053741617, 52.52966625878565],
                                [13.417135053741617, 52.52976625878565]
                            ]
                        ]
                    },
                    properties: {
                        idx: 10
                    }
                }, {
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [13.417135053741617, 52.52956625878565],
                                [13.417226248848124, 52.52956625878565],
                                [13.417226248848124, 52.52946625878565],
                                [13.417135053741617, 52.52946625878565],
                                [13.417135053741617, 52.52956625878565]
                            ]
                        ]
                    },
                    properties: {
                        idx: 11
                    }
                }]
            };
            map = new maptalks.Map(container, options.view || DEFAULT_VIEW);
            const layer = new PolygonLayer('gvt', data, {
                style: [
                    {
                        filter: true,
                        symbol: {
                            polygonFill: '#f00'
                        }
                    }
                ]
            });
            layer.once('canvasisdirty', () => {
                const redPoint = layer.identify([13.41720, 52.52949625878565]);
                assert(redPoint[0].geometry instanceof maptalks.Polygon);
                assert(redPoint[0].geometry.getProperties().idx === 11);
                done();
            });
            layer.addTo(map);
        });

        it('should pick nothing in hided PolygonLayer', done => {
            const options = {
                loadingLimit: 0,
                view: {
                    center: [13.417226248848124, 52.52954504632825],
                    zoom: 18
                }
            };
            const data = {
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [13.417135053741617, 52.52976625878565],
                                [13.417226248848124, 52.52976625878565],
                                [13.417226248848124, 52.52966625878565],
                                [13.417135053741617, 52.52966625878565],
                                [13.417135053741617, 52.52976625878565]
                            ]
                        ]
                    },
                    properties: {
                        idx: 10
                    }
                }, {
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [13.417135053741617, 52.52956625878565],
                                [13.417226248848124, 52.52956625878565],
                                [13.417226248848124, 52.52946625878565],
                                [13.417135053741617, 52.52946625878565],
                                [13.417135053741617, 52.52956625878565]
                            ]
                        ]
                    },
                    properties: {
                        idx: 11
                    }
                }]
            };
            map = new maptalks.Map(container, options.view || DEFAULT_VIEW);
            const layer = new PolygonLayer('gvt', data, {
                style: [
                    {
                        filter: true,
                        symbol: {
                            polygonFill: '#f00'
                        }
                    }
                ]
            });
            layer.once('canvasisdirty', () => {
                layer.hide();
                const redPoint = layer.identify([13.41720, 52.52949625878565]);
                assert(redPoint.length === 0);
                done();
            });
            layer.addTo(map);
        });
    });

    const COMMON_OPTIONS = {
        data: {
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [0.5, 0.5]
                },
                properties: {
                    type: 1
                }
            }]
        },
        style: {
            renderPlugin: {
                type: 'native-point',
                dataConfig: {
                    type: 'native-point'
                }
            },
            symbol: {
                markerType: 'square',
                markerSize: 20,
                markerFill: '#ff0',
                markerOpacity: 0.5
            }
        },
        features: true,
        loadingLimit: 0,
        view: {
            center: [0.5, 0.5],
            zoom: 8
        }
    };

    it('should let options.features control picking result', done => {
        map = new maptalks.Map(container, COMMON_OPTIONS.view || DEFAULT_VIEW);
        const options = JSON.parse(JSON.stringify(COMMON_OPTIONS));
        options.features = false;
        options.pickingPoint = true;
        const layer = new GeoJSONVectorTileLayer('gvt', options);
        layer.once('canvasisdirty', () => {
            const picked = layer.identify([0.5, 0.5]);
            assert.ok(picked[0].point);
            assert.ok(!picked[0].data);
            done();
        });
        layer.addTo(map);
    }).timeout(5000);

    it('should pick nothing in VectorTileLayer', done => {
        map = new maptalks.Map(container, COMMON_OPTIONS.view || DEFAULT_VIEW);
        const options = JSON.parse(JSON.stringify(COMMON_OPTIONS));
        options.features = false;
        options.pickingPoint = true;
        const layer = new GeoJSONVectorTileLayer('gvt', options);
        layer.once('canvasisdirty', () => {
            layer.hide();
            const picked = layer.identify([0.5, 0.5]);
            assert.ok(picked.length === 0);
            done();
        });
        layer.addTo(map);
    }).timeout(5000);

    it('should pick in a GroupGLLayer', done => {
        map = new maptalks.Map(container, COMMON_OPTIONS.view || DEFAULT_VIEW);
        const layer1 = new GeoJSONVectorTileLayer('gvt1', COMMON_OPTIONS);
        const layer2 = new GeoJSONVectorTileLayer('gvt2', COMMON_OPTIONS);
        const group = new GroupGLLayer('group', [layer1, layer2]);
        let dirty1 = false;
        let dirty2 = false;

        function onDirty() {
            if (dirty1 && dirty2) {
                let picked = layer1.identify([0.5, 0.5]);
                assert.ok(picked[0].data);
                picked = layer2.identify([0.5, 0.5]);
                assert.ok(picked[0].data);
                done();
            }
        }
        layer1.once('canvasisdirty', () => {
            dirty1 = true;
            onDirty();
        });
        layer2.once('canvasisdirty', () => {
            dirty2 = true;
            onDirty();
        });
        group.addTo(map);
    });

    it('should return geographic coordinates in pick', done => {
        map = new maptalks.Map(container, {
            center: [0, 0],
            zoom: 5
        });
        const layer = new VectorTileLayer('vt', {
            urlTemplate: 'http://localhost:4398/vt/{z}/{x}/{y}.mvt',
            spatialReference: 'preset-vt-3857',
            pickingGeometry: true,
            features: true
        });
        let count = 0;
        layer.on('canvasisdirty', () => {
            count++;
            if (count === 5) {
                const picked = layer.identifyAtPoint(new maptalks.Point(map.width / 2, map.height / 2));
                assert(picked[0].data.feature.type === 'Feature');
                assert(picked[0].data.feature.geometry.type === 'Polygon');
                assert(Math.abs(picked[0].data.feature.geometry.coordinates[0][0][0]) < 10);
                assert(Math.abs(picked[0].data.feature.geometry.coordinates[0][0][1]) < 10);
                done();
            }
        });
        layer.addTo(map);
    });

    it('should enable stencil in VectorTileLayer FillPainter pick, maptalks/issues#832', done => {
        map = new maptalks.Map(container, {
            center: [121.52861644,31.23331691],
            zoom: 19
        });
        const layer = new VectorTileLayer('vt', {
            urlTemplate: 'http://localhost:4398/832/{z}/{x}/{y}.mvt',
            pickingGeometry: true,
            style: "http://localhost:4398/832/1.json",
            features: true
        });
        layer.addTo(map);

        setTimeout(() => {
            const picked = layer.identifyAtPoint(new maptalks.Point(map.width / 2, map.height / 2));
            assert(picked[0].data.feature.properties.displaytext === '冰厂田幼儿园');
            done();
        }, 1000);
    });
});
