const path = require('path');

const material = {
    'baseColorFactor': [1, 1, 1, 1],
    'baseColorTexture': 'file://' + path.resolve(__dirname, '../../../resources/1.png'),
    'roughnessFactor': 0,
    'metalnessFactor': 1,
    'outputSRGB': 0
};

module.exports = {
    view: {
        pitch: 70,
        bearing: -60,
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
