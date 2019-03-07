const path = require('path');
const assert = require('assert');
const data = require('../integration/fixtures/data');
const maptalks = require('maptalks');
const { GeoJSONVectorTileLayer } = require('@maptalks/vt');
require('../../dist/maptalks.vt.basic');

const DEFAULT_VIEW = {
    center: [0, 0],
    zoom: 6,
    pitch: 0,
    bearing: 0
};

const ICON_PATH = 'file://' + path.resolve(__dirname, '../integration/resources/plane-min.png');

describe('picking specs', () => {
    let map, container;
    before(() => {
        container = document.createElement('div');
        container.style.width = '128px';
        container.style.height = '128px';
        document.body.appendChild(container);
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
        let count = 0;
        layer.on('layerload', () => {
            count++;
            if (count <= 1 || count > 2) {
                return;
            }
            const result = layer.identify(coord);
            if (ignoreSymbol) {
                for (let i = 0; i < result.length; i++) {
                    delete result[i].data.symbol;
                }
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
                style: [
                    {
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
                            markerFile: ICON_PATH
                        }
                    }
                ],
                pickingGeometry: true,
                pickingPoint: true
            };
            const coord = [0.5, 0.5];
            const expected = [{ 'data': { 'feature': { 'type': 'Feature', 'geometry': { 'type': 'Point', 'coordinates': [0.5, 0.5] }, 'properties': { 'type': 1 }, 'id': 0, 'layer': 0 }, }, 'point': [368, -368, 0], 'type': 'icon' }];
            runner(options, coord, expected, true, done);
        });

        it('should pick a icon on a rotated map', done => {
            const options = {
                data: data.point,
                style: [
                    {
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
                    }
                ],
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
                style: [
                    {
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
                    }
                ],
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
                style: [
                    {
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
                    }
                ]
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
                style: [
                    {
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
                    }
                ],
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
                style: [
                    {
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
                    }
                ],
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
                style: [
                    {
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
                    }
                ],
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
                style: [
                    {
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
                    }
                ],
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
                    features: [
                        { type: 'Feature', geometry: { type: 'Point', coordinates: [0.5, 0.5] }, properties: { type: 1 } },
                        { type: 'Feature', geometry: { type: 'Point', coordinates: [0.6, 0.6] }, properties: { type: 2 } }
                    ]
                },
                style: [
                    {
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
                    },
                    {
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
                    }
                ],
                view: {
                    center: [0.5, 0.5],
                    zoom: 8
                }
            };

            map = new maptalks.Map(container, options.view || DEFAULT_VIEW);

            const layer = new GeoJSONVectorTileLayer('gvt', options);
            let count = 0;
            layer.on('layerload', () => {
                count++;
                if (count <= 1 || count > 2) {
                    return;
                }
                const yellowPoint = layer.identify([0.6, 0.6]);
                const redPoint = layer.identify([0.5, 0.5]);
                assert.ok(yellowPoint.length === 1);
                assert.ok(redPoint.length === 1);
                assert.notDeepEqual(yellowPoint, redPoint);

                const expected = {
                    'feature': { 'type': 'Feature', 'geometry': { 'type': 'Point', 'coordinates': [0.5, 0.5] }, 'properties': { 'type': 1 }, 'id': 0, 'layer': 0 }, 'symbol': { 'markerSize': 30, 'markerFill': '#f00', 'markerOpacity': 0.5 }
                };
                assert.deepEqual(redPoint[0].data, expected, JSON.stringify(redPoint[0].data));

                done();
            });
            layer.addTo(map);
        });
    });

    //TODO line 和 Polygon 的picking 测试
});
