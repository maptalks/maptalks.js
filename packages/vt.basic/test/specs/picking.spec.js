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
                    delete result[i].feature.symbol;
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
                ]
            };
            const coord = [0.5, 0.5];
            const expected = [{ 'feature': { 'feature': { 'type': 'Feature', 'geometry': { 'type': 'Point', 'coordinates': [0.5, 0.5] }, 'properties': { 'type': 1 }, 'id': 0 }, }, 'point': [368, -368, 0], 'type': 'icon' }];
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

    //TODO line 和 Polygon 的picking 测试
});
