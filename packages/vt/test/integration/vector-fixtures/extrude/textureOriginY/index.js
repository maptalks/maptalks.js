const maptalks = require('maptalks');
const path = require('path');
const options = require('../options.js');

const polygon = new maptalks.Polygon([
    [
        [-1., 1.0],
        [1., 1.0],
        [1., -1.0],
        [-1., -1],
        [-1., 1]
    ],
    [
        [-0.5, 0.5],
        [0.5, 0.5],
        [0.5, -0.5],
        [-0.5, -0.5],
        [-0.5, 0.5]
    ]
], {
    symbol: {
        polygonOpacity: 1
    },
    properties: {
        height: 12000
    }
});

const dataConfig = {
    type: '3d-extrusion',
    altitudeProperty: 'height',
    altitudeScale: 5,
    defaultAltitude: 0,
    top: false,
    side: true,
    // textureYOrigin: 'bottom'
};

const material = {
    'baseColorFactor': [1, 1, 1, 1],
    'roughnessFactor': 0,
    'metalnessFactor': 0,
    'outputSRGB': 0,
    'baseColorTexture': 'file://' + path.resolve(__dirname, '../../../resources/marker.png'),
    'uvScale': [0.001, 0.0013]
};

const layerOptions = Object.assign({}, JSON.parse(JSON.stringify(options)), {
    data: [polygon]
});
layerOptions.options.material = material;
layerOptions.options.dataConfig = dataConfig;
layerOptions.renderingCount = 2;
module.exports = layerOptions;
