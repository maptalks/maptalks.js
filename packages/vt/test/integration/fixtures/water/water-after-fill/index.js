const path = require('path');

const data = {
    type: 'FeatureCollection',
    features: [
        // { type : 'Feature', geometry : { type : 'Polygon', coordinates : [[[-1, 0.0], [-0.4, 0.0], [0, -0.5], [-1, 0]]] }, properties : { type : 3 }}
        {
            type: 'Feature', geometry: {
                type: 'Polygon', coordinates: [
                    [[-1., 1.0], [1., 1.0], [1., -1.0], [-1., -1], [-1., 1]],
                    [[-0.5, 0.5], [0.5, 0.5], [0.5, -0.5], [-0.5, -0.5], [-0.5, 0.5]]
                ]
            }, properties: { type: 3 }
        },
        {
            type: 'Feature', geometry: {
                type: 'Polygon', coordinates: [
                    [[-0.3, 0.3], [0.3, 0.3], [0.3, -0.3], [-0.3, -0.3], [-0.3, 0.3]]
                ]
            }, properties: { type: 2 }
        }
    ]
};

const symbol = {
    "ssr": false,
    "texWaveNormal": 'file://' + path.resolve(__dirname, '../../../resources/normal.png'),
    "texWavePerturbation": 'file://' + path.resolve(__dirname, '../../../resources/perturbation.png'),
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


// https://github.com/fuzhenn/maptalks-ide/issues/3129
const style = {
    background: {
        enable: true,
        color: [0, 1, 0, 1],
        opacity: 0.5
    },
    style: [
        {
          "filter": ["==", "type", 3],
          "renderPlugin": {
            type: 'fill',
            dataConfig: {
                type: 'fill'
            }
          },
          "symbol": {
            polygonFill: '#f00'
          }
        },
        {
          "filter": ["==", "type", 2],
          "renderPlugin": renderPlugin,
          "symbol": symbol
        },
    ]
};

module.exports = {
    style,
    data,
    renderingCount: 7,
    view: {
        center: [0, 0],
        zoom: 6,
        pitch: 70,
        bearing: 80,
        lights: {
            ambient: {
                color: [0.3, 0.3, 0.3]
            },
            directional: {
                color: [0.8, 0.8, 0.8],
                direction: [1, 0, -1],
            }
        }
    }
};
