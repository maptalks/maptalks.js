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
            type: 'fill',
            dataConfig: {
                type: 'fill'
            },
            sceneConfig: {
            },
        },
        symbol: {
            polygonBloom: false,
            polygonOpacity: 1,
            polygonFill: '#0f0'
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
            lineBloom: true,
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
    containerWidth: 512,
    containerHeight: 512,
    renderingCount: 4,
    view: {
        pitch: 70,
        bearing: 60,
        center: [0, 0],
        zoom: 7.5
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
