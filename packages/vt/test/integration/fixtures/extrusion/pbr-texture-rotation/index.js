const path = require('path');

const data = {
    type: 'FeatureCollection',
    features: [
        // { type : 'Feature', geometry : { type : 'Polygon', coordinates : [[[-1, 0.0], [-0.4, 0.0], [0, -0.5], [-1, 0]]] }, properties : { type : 3 }}
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
    'baseColorTexture': 'file://' + path.resolve(__dirname, '../../../resources/marker.png'),
    'uvScale': [0.001, 0.001],
    'uvRotation': 60,
    'uvOffset': [0.3, 0.4],
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
    view: {
        center: [0, 0],
        zoom: 7,
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
