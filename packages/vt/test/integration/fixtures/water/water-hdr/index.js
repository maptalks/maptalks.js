// maptalks/issues#770
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

const style = {
    background: {
        enable: true,
        color: [0, 1, 0, 1],
        opacity: 0.5
    },
    style: [
        {
          "filter": ["==", "type", 3],
          "renderPlugin": renderPlugin,
          "symbol": symbol
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
                resource: {
                    url: path.join(__dirname, "../../../resources/env.hdr"),
                    sh: [
                        0.20858436898833022, 0.23915094694605302, 0.2764453514295079, 0.04950023235319853,
                        0.048269945750549895, 0.03190286835526042, 0.03813514353032277, 0.038695892061119105,
                        0.026303896200427286, -0.019233848855311677, -0.02538977446926201, -0.029096620785351676,
                        -0.01172075538047479, -0.010939008319894038, -0.008561246332352453, -0.005574930591349054,
                        -0.00543337565708197, -0.003958969121495932, 0.030768413550559873, 0.028952465658790758,
                        0.020335418593710984, -0.11441424414505244, -0.11983866529491013, -0.09375876129847162,
                        0.017978553168773385, 0.0158766066546692, 0.011120821552798437
                    ]
                }
            },
            directional: {
                color: [0.8, 0.8, 0.8],
                direction: [1, 0, -1],
            }
        }
    },
};
