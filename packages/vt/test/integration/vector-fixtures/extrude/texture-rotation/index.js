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
    top: true,
    side: false
    // textureYOrigin: 'bottom'
};

const origin = [0.2, 0.1];

const material = {
    'baseColorFactor': [1, 1, 1, 1],
    'roughnessFactor': 0,
    'metalnessFactor': 0,
    'outputSRGB': 0,
    // 'uvScale': [0.0003, 0.0003],
    'textureWidth': 23.25 / 0.0003,
    'textureOrigin': origin,
    'uvRotation': 60,
    'baseColorTexture': 'file://' + path.resolve(__dirname, '../../../resources/marker.png')
};

const layerOptions = Object.assign({}, JSON.parse(JSON.stringify(options)), {
    data: [polygon]
});
layerOptions.options.material = material;
layerOptions.options.dataConfig = dataConfig;
layerOptions.renderingCount = 2;
layerOptions.view.pitch = 0;
layerOptions.view.bearing = 0;
layerOptions.view.center = origin;
module.exports = layerOptions;
