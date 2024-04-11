const maptalks = require('maptalks');
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
        polygonOpacity: 1,
        topPolygonFill: '#f00',
        bottomPolygonFill: '#0f0'
    },
    properties: {
        height: 12000
    }
});

const dataConfig = {
    type: '3d-extrusion',
    altitudeProperty: 'height',
    altitudeScale: 5,
    defaultAltitude: 0
    // textureYOrigin: 'bottom'
};

const material = {
    'emissiveFactor': [1, 1, 1],
    'baseColorFactor': [1, 1, 1, 1],
    'roughnessFactor': 0,
    'metalnessFactor': 0,
    'outputSRGB': 0
};

const layerOptions = Object.assign({}, JSON.parse(JSON.stringify(options)), {
    data: [polygon]
});
layerOptions.options.material = material;
layerOptions.options.dataConfig = dataConfig;
layerOptions.renderingCount = 1;
module.exports = layerOptions;
