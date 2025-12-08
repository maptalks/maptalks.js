const assert = require('assert');
const { GeoJSONVectorTileLayer } = require('../../dist/maptalks.vt.gpu.js');

const STYLE = [
    {
        filter: ['==', 'type', 1],
        renderPlugin: {
            type: 'line',
            dataConfig: {
                type: 'line'
            },
            sceneConfig: {
            }
        },
        symbol: {
            lineWidth: 12,
            lineBlur: 5
        }
    },
    {
        filter: ['==', 'type', 2],
        renderPlugin: {
            type: 'line',
            dataConfig: {
                type: 'line'
            },
            sceneConfig: {
            }
        },
        symbol: {
            lineWidth: 12,
            lineBlur: 5
        }
    }
];

const COMPRESSED = { 'plugins': [{ 'type': 'line', 'dataConfig': { 'type': 'line' } }], 'styles': { featureStyle: [], style: [{ 'filter': ['==', 'type', 1], 'renderPlugin': 0, 'symbol': { 'lineWidth': 12, 'lineBlur': 5 } }, { 'filter': ['==', 'type', 2], 'renderPlugin': 0, 'symbol': { 'lineWidth': 12, 'lineBlur': 5 } }] } };

describe('style compress specs', () => {
    it('should compress a style', () => {
        const compressed = GeoJSONVectorTileLayer.compressStyleJSON(STYLE);
        assert.deepEqual(compressed, COMPRESSED);
    });

    it('should set a compressed style', () => {
        const layer = new GeoJSONVectorTileLayer('id', { style: COMPRESSED });
        const style = layer.getComputedStyle();
        const expected = {
            background: {
                color: [0, 0, 0, 0],
                enable: false,
                opacity: 1
            },
            style: [
                {
                    filter: ['==', 'type', 1],
                    renderPlugin: {
                        type: 'line',
                        dataConfig: {
                            type: 'line'
                        }
                    },
                    symbol: {
                        lineWidth: 12,
                        lineBlur: 5
                    }
                },
                {
                    filter: ['==', 'type', 2],
                    renderPlugin: {
                        type: 'line',
                        dataConfig: {
                            type: 'line'
                        }
                    },
                    symbol: {
                        lineWidth: 12,
                        lineBlur: 5
                    }
                }
            ],
            featureStyle: []
        };
        assert.deepEqual(style, expected);
    });

    //TODO 增加style + featureStyle的压缩
});
