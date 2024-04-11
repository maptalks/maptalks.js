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
    side: false,
    topUVMode: 1
    // textureYOrigin: 'bottom'
};

const material = {
    'baseColorFactor': [1, 1, 0, 1],
    'roughnessFactor': 0,
    'metalnessFactor': 0,
    'outputSRGB': 0,
    'baseColorTexture': 'file://' + path.resolve(__dirname, '../../../resources/brick_normal.jpg')
};

const layerOptions = Object.assign({}, JSON.parse(JSON.stringify(options)), {
    data: [polygon]
});
layerOptions.options.material = material;
layerOptions.options.dataConfig = dataConfig;
layerOptions.renderingCount = 2;

const view = {
    pitch: 50,
    center: [0, 0],
    zoom: 6,
    lights: {
        ambient: {
            color: [0.5, 0.5, 0.5]
        },
        directional: {
            color: [0.1, 0.1, 0.1],
            direction: [1, 0, -1],
        }
    }
};

layerOptions.view = view;

module.exports = layerOptions;
