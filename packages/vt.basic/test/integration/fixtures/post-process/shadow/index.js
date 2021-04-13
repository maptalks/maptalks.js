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
                        [1., 3.0],
                        [3., 3.0],
                        [3., 1.0],
                        [1., 1],
                        [1., 3]
                    ],
                    [
                        [1.5, 2.5],
                        [2.5, 2.5],
                        [2.5, 1.5],
                        [1.5, 1.5],
                        [1.5, 2.5]
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
    sceneConfig: {
    },
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
        filter: true,
    },
    {
        renderPlugin: {
            type: 'line',
            dataConfig: {
                type: 'line'
            },
            sceneConfig: {}
        },
        symbol: {
            lineColor: [0.73, 0.73, 0.73, 1],
            lineOpacity: 0.5,
            lineWidth: 2,
        },
        filter: true,
    },
];
module.exports = {
    style,
    data: data,
    view: {
        pitch: 70,
        // bearing: 60,
        center: [2, 2],
        zoom: 6.5
    },
    renderingCount: 2,
    sceneConfig: {
        shadow: {
            type: 'esm',
            enable: true,
            quality: 'high',
            opacity: 0.8,
            color: [0, 0, 0],
            blurOffset: 1,
            lightDirection: [1, 0, -1]
        },
    }
};
