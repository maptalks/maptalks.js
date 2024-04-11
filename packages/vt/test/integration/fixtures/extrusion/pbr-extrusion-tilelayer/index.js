const maptalks = require('maptalks');

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
                levels: 15000
            }
        }
    ]
};
const plugin = {
    type: 'lit',
    dataConfig: {
        type: '3d-extrusion',
        altitudeProperty: 'levels',
        defaultAltitude: 0
    },
    sceneConfig: {},
};
const material = {
    'baseColorFactor': [1, 1, 1, 1],
    'roughnessFactor': 0,
    'metalnessFactor': 1,
    'outputSRGB': 0
};
const style = [{
    renderPlugin: plugin,
    symbol: {
        polygonOpacity: 1,
        polygonFill: '#f00',
        material
    },
    filter: true,
}];
module.exports = {
    style,
    data: data,
    layers: [
        new maptalks.TileLayer('b', {
            // 1 px black dot
            fadeAnimation: false,
            urlTemplate: 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs='
        })
    ],
    groupSceneConfig: {
        postProcess: {
            enable: true,
            antialias: {
                enable: true
            }
        }
    },
    view: {
        pitch: 80,
        center: [0, 0],
        zoom: 6
    }
};
