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
                type: 1
            }
        },
        {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [-1, -0.75],
                    [1, -0.75]
                ]
            },
            properties: {
                type: 2
            }
        }
    ]
};
const style = [
    {
        renderPlugin: {
            type: 'lit',
            dataConfig: {
                'type': '3d-extrusion',
                'altitudeProperty': 'height',
                'minHeightProperty': 'min_height',
                'altitudeScale': 1,
                'defaultAltitude': 10,
                'topThickness': 0,
                'top': true,
                'side': false,
                'topUVMode': 0,
                'sideUVMode': 0
            },
            sceneConfig: {
            },
        },
        symbol: {
            bloom: true,
            polygonOpacity: 1,
            polygonFill: '#0f0',
            'material': {
                'baseColorFactor': [0.345, 0.345, 0.502, 1]
            }
        },
        filter: [
            '==',
            '$type',
            'Polygon'
        ],
    },
    {
        renderPlugin: {
            type: 'line',
            dataConfig: {
                type: 'line'
            }
        },
        symbol: {
            bloom: false,
            lineColor: '#f00',
            lineWidth: 4
        },
        filter: [
            '==',
            '$type',
            'LineString'
        ],
    }
];
module.exports = {
    style,
    data: data,
    view: {
        pitch: 70,
        bearing: 60,
        center: [0, 0],
        zoom: 6.5
    },
    sceneConfig: {
        postProcess: {
            enable: true,
            bloom: {
                enable: true
            }
        }
    }
};
