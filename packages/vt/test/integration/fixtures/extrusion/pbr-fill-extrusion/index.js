// maptalks/issues#227
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
                        [-1.5, 1.50],
                        [1.5, 1.50],
                        [1.5, -1.50],
                        [-1.5, -1.5],
                        [-1.5, 1.5]
                    ]
                ]
            },
            properties: {
                type: 'fill'
            }
        },
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
                levels: 15000,
                type: 'extrusion'
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
const style = [
    {
        renderPlugin: plugin,
        symbol: {
            polygonOpacity: 1,
            polygonFill: '#f00',
            material
        },
        filter: ['==', 'type', 'extrusion'],
    },
    {
        renderPlugin: {
            type: 'fill',
            dataConfig: {
                type: 'fill'
            }
        },
        symbol: {
            polygonOpacity: 1,
            polygonFill: '#0f0'
        },
        filter: ['==', 'type', 'fill'],
    }
];
module.exports = {
    style,
    data: data,
    view: {
        pitch: 0,
        center: [0, 0],
        zoom: 6
    }
};
