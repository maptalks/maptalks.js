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
                'point': [736, 736, 0],
                'type': 'icon',
                'plugin': 0,
                'featureId': 0
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
                'point': [736, 736, 0],
                'type': 'icon',
                'plugin': 0,
                'featureId': 0
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
                'point': [736, 736, 0],
                'type': 'icon',
                'plugin': 0,
                'featureId': 0
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
                        'layer': 0
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
                        'layer': 0
                    },
                    'symbol': {
                        'lineColor': '#f00',
                        'lineWidth': 20
                    }
                };
                delete redPoint[0].data.tile;
                assert.deepEqual(redPoint[0].data, expected, JSON.stringify(redPoint[0].data));
                done();
            });
            layer.addTo(map);
        });
        it('should pick lines with customProperties', done => {
            const options = {
                features: 'feature',
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
                        "customProps": {
                            "custom_prop_line_batch_id": "admin-0-boundary-bg"
                        },
                        'type': 2,
                        "properties": {
                           "custom_prop_line_batch_id": "admin-0-boundary-bg",
                           "mapbox_clip_end": 1,
                           "mapbox_clip_start": 0
                        },
                        'id': 0,
                        'layer': "0"
                    },
                    'symbol': {
                        'lineColor': '#f00',
                        'lineWidth': 20
                    }
                };
                delete redPoint[0].data.tile;
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
                        'layer': 0
                    },
                    'symbol': {
                        'polygonFill': '#f00',
                        'polygonOpacity': 1
                    }
                };
                delete redPoint[0].data.tile;
                assert.deepEqual(redPoint[0].data, expected, JSON.stringify(redPoint[0].data));
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
                                [13.417135053741617, 52.52956625878565, 0],
                                [13.417226248848124, 52.52956625878565, 1]
                            ]
                        },
                        'id': 0,
                        'layer': 0
                    },
                    'symbol': {
                        'lineColor': '#f00',
                        'lineWidth': 20
                    }
                };
                delete redPoint[0].data.tile;
                assert.deepEqual(redPoint[0].data, expected, JSON.stringify(redPoint[0].data));
                done();
            });
            layer.addTo(map);
        });
    });

    context('vector layer\'s picking', () => {
        it('should pick point in PointLayer', done => {
            const options = {
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
                assert(redPoint[0] instanceof maptalks.Marker);
                assert(redPoint[0].getProperties().idx === 11);
                done();
            });
            layer.addTo(map);

        });

        it('should pick point with multiple symbols in PointLayer', done => {
            const options = {
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
                assert(redPoint[0] instanceof maptalks.Marker);
                assert(redPoint[0].getProperties().idx === 11);
                done();
            });
            layer.addTo(map);

        });

        it('should pick lines in LineStringLayer', done => {
            const options = {
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
                assert(redPoint[0] instanceof maptalks.LineString);
                assert(redPoint[0].getProperties().idx === 11);
                done();
            });
            layer.addTo(map);
        });

        it('should pick polygon in polygonLayer', done => {
            const options = {
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
                assert(redPoint[0] instanceof maptalks.Polygon);
                assert(redPoint[0].getProperties().idx === 11);
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
                assert(Math.abs(picked[0].data.feature.geometry[0][0][0]) < 10);
                assert(Math.abs(picked[0].data.feature.geometry[0][0][1]) < 10);
                done();
            }
        });
        layer.addTo(map);
    });
});
