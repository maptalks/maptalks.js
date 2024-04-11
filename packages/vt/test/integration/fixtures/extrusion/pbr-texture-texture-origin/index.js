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
            }
        }
    ]
};
const plugin = {
    type: 'lit',
    dataConfig: {
        type: '3d-extrusion',
        altitudeProperty: 'levels',
        altitudeScale: 0,
        defaultAltitude: 0,
        side: false
    },
    sceneConfig: {},
};
const material = {
    'baseColorFactor': [1, 1, 1, 1],
    'roughnessFactor': 0,
    'metalnessFactor': 0,
    'outputSRGB': 0,
    'baseColorTexture': 'file://' + path.resolve(__dirname, '../../../resources/marker.png'),
    'textureWidth': 23.25 / 0.0003,
    'textureOrigin': [0.1, 0.2]
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
        // pitch: 50,
        center: [0.1, 0.2],
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
