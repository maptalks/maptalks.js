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
                    ],
                    [
                        [-0.5, 0.5],
                        [0.5, 0.5],
                        [0.5, -0.5],
                        [-0.5, -0.5],
                        [-0.5, 0.5]
                    ]
                ]
            },
            properties: {
                levels: 12000
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
        defaultAltitude: 0,
        top: false,
        side: true,
        sideVerticalUVMode: 1
    },
    sceneConfig: {
        cullFace: false
    },
};
const material = {
    'baseColorFactor': [1, 1, 1, 1],
    'roughnessFactor': 1,
    'metalnessFactor': 0,
    'outputSRGB': 0,
    'baseColorTexture': 'file://' + path.resolve(__dirname, '../../../resources/marker.png'),
    'uvScale': [0.001, 1]
};
const style = [{
    renderPlugin: plugin,
    symbol: {
        polygonOpacity: 1,
        material
    },
    filter: true,
}];
// 未知原因导致纹理是反的，但在chrome 113上是正常的
module.exports = {
    style,
    data: data,
    view: {
        pitch: 50,
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
