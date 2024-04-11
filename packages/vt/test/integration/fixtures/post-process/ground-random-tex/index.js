const path = require('path');

const material = {
    'baseColorFactor': [1, 1, 1, 1],
    'baseColorTexture': 'file://' + path.resolve(__dirname, '../../../resources/1.png'),
    'roughnessFactor': 0,
    'metalnessFactor': 1,
    'noiseTexture': 'file://' + path.resolve(__dirname, '../../../resources/noise.png'),
    'uvScale': [0.8, 0.7],
    'uvOffset': [0.1, 0.2],
    'outputSRGB': 0
};

module.exports = {
    view: {
        pitch: 0,
        bearing: 0,
        center: [0, 0],
        zoom: 17
    },
    renderingCount: 2,
    eventName: 'layerload',
    sceneConfig: {
        ground: {
            enable: true,
            renderPlugin: {
                type: 'lit'
            },
            symbol: {
                polygonFill: [1, 1, 1, 1],
                polygonOpacity: 1,
                material
            }
        },
        postProcess: {
            enable: false
        }
    }
};
