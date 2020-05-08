const path = require('path');

const material = {
    'baseColorFactor': [1, 1, 1, 1],
    'uBaseColorTexture': 'file://' + path.resolve(__dirname, '../../../resources/UV_Grid_Sm.jpg'),
    'roughnessFactor': 0,
    'metalnessFactor': 1,
    'outputLinear': 1
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
