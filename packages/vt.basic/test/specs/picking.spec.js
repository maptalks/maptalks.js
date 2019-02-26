const path = require('path');
const assert = require('assert');
const data = require('../integration/fixtures/data');
const maptalks = require('../common/maptalks');
const { GeoJSONVectorTileLayer } = require('@maptalks/vt');
require('../../dist/maptalks.vt.basic-dev');

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
            assert.deepEqual(result, expected, JSON.stringify(result));
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
                        type: 'icon',
                        dataConfig: {
                            type: 'point'
                        },
                        sceneConfig : {
                            collision : false
                        },
                        style: [
                            {
                                symbol: {
                                    markerFile: ICON_PATH
                                }
                            }
                        ]
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
                        type: 'icon',
                        dataConfig: {
                            type: 'point'
                        },
                        sceneConfig : {
                            collision : true,
                            fading : false
                        },
                        style: [
                            {
                                symbol: {
                                    markerFile: ICON_PATH
                                }
                            }
                        ]
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
            const expected = [{ 'feature': { 'feature': { 'type': 'Feature', 'geometry': { 'type': 'Point', 'coordinates': [0.5, 0.5] }, 'properties': { 'type': 1 }, 'id': 0 }, }, 'point': [361.20911646267484, -370.47862625122036, -4.833766723333952], 'type': 'icon' }];
            runner(options, coord, expected, true, done);
        });

        it('should pick a icon with rotation alignment', done => {
            const options = {
                data: data.point,
                style: [
                    {
                        type: 'icon',
                        dataConfig: {
                            type: 'point'
                        },
                        sceneConfig : {
                            collision : false
                        },
                        style: [
                            {
                                symbol: {
                                    markerFile: ICON_PATH,
                                    markerPitchAlignment: 'map'
                                }
                            }
                        ]
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
            const expected = [{ 'feature': { 'feature': { 'type': 'Feature', 'geometry': { 'type': 'Point', 'coordinates': [0.5, 0.5] }, 'properties': { 'type': 1 }, 'id': 0 }, }, 'point': [366.73117714902435, -371.1556777954098, -7.649648145847891], 'type': 'icon' }];
            runner(options, coord, expected, true, done);
        });

        it('should ignore icon in collision fading', done => {
            const options = {
                data: data.point,
                style: [
                    {
                        type: 'icon',
                        dataConfig: {
                            type: 'point'
                        },
                        sceneConfig : {
                            collision : true,
                            fading : true
                        },
                        style: [
                            {
                                symbol: {
                                    markerFile: ICON_PATH
                                }
                            }
                        ]
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
                        type: 'text',
                        dataConfig: {
                            type: 'point'
                        },
                        sceneConfig : {
                            collision : false
                        },
                        style: [
                            {
                                symbol: {
                                    textName: '未来'
                                }
                            }
                        ]
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
            const expected = [{ 'feature': { 'feature': { 'type': 'Feature', 'geometry': { 'type': 'Point', 'coordinates': [0.5, 0.5] }, 'properties': { 'type': 1 }, 'id': 0 }, 'symbol': { 'textName': '未来' }}, 'point': [361.20911646267484, -370.47862625122036, -4.833766723333952], 'type': 'text' }];
            runner(options, coord, expected, false, done);
        });

        it('should pick a text with rotation alignment', done => {
            const options = {
                data: data.point,
                style: [
                    {
                        type: 'text',
                        dataConfig: {
                            type: 'point'
                        },
                        sceneConfig : {
                            collision : true,
                            fading : false
                        },
                        style: [
                            {
                                symbol: {
                                    textName: '未来',
                                    textPitchAlignment: 'map'
                                }
                            }
                        ]
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
            const expected = [{ 'feature': { 'feature': { 'type': 'Feature', 'geometry': { 'type': 'Point', 'coordinates': [0.5, 0.5] }, 'properties': { 'type': 1 }, 'id': 0 }, 'symbol': { 'textName': '未来', 'textPitchAlignment': 'map' }, 'textName': '未来' }, 'point': [366.74511569700024, -371.1573867797848, -7.656755872570102], 'type': 'text' }];
            runner(options, coord, expected, false, done);
        });
    });
});
