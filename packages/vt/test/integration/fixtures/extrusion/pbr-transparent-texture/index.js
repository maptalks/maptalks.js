const path = require('path');

const data = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [
                    [
                        [-1., 1.0],
                        [1., 1.0],
                        [1., -1.0],
                        [-1., -1],
                        [-1., 1]
                    ]
                ]
            },
            properties: {
                levels: 3000
            }
        }
    ]
};
const plugin = {
    type: 'lit',
    dataConfig: {
        type: '3d-extrusion',
        altitudeProperty: 'levels',
        altitudeScale: 5,
        defaultAltitude: 0
    },
    sceneConfig: {},
};
const material = {
    'baseColorFactor': [1, 1, 1, 1],
    'roughnessFactor': 0,
    'metalnessFactor': 0,
    'outputSRGB': 0,
    'baseColorTexture': 'file://' + path.resolve(__dirname, '../../../resources/transparent-hole.png'),
    'uvScale': [0.001, 0.001]
};
const style = [{
    renderPlugin: plugin,
    symbol: {
        polygonOpacity: 1,
        material
    },
    filter: true,
}];
module.exports = {
    style,
    data: data,
    renderingCount: 2,
    view: {
        pitch: 0,
        center: [0, 0],
        zoom: 6.5,
        lights: {
            ambient: {
                color: [0.3, 0.3, 0.3]
            },
            directional: {
                color: [0.1, 0.1, 0.1],
                direction: [1, 0, -1],
            }
        }
    }
};
