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
    top: false,
    side: true,
    topUVMode: 1
    // textureYOrigin: 'bottom'
};

const material = {
    'baseColorFactor': [1, 1, 1, 1],
    'roughnessFactor': 0,
    'metalnessFactor': 0,
    'outputSRGB': 0,
    'baseColorTexture': 'file://' + path.resolve(__dirname, '../../../resources/marker.png')
};

const sideMaterial = {
    'baseColorFactor': [0, 0, 1, 1],
    'roughnessFactor': 0,
    'metalnessFactor': 0
};

const layerOptions = Object.assign({}, JSON.parse(JSON.stringify(options)), {
    data: [polygon]
});
layerOptions.options.material = material;
layerOptions.options.sideMaterial = sideMaterial;
layerOptions.options.dataConfig = dataConfig;
layerOptions.renderingCount = 2;
layerOptions.view = {
    pitch: 60,
    bearing: -120,
    center: [0, 0],
    zoom: 5,
    lights: {
        ambient: {
            color: [0.5, 0.5, 0.5]
        },
        directional: {
            color: [0.8, 0.8, 0.8],
            direction: [1, 0, -1],
        }
    }
}
module.exports = layerOptions;
