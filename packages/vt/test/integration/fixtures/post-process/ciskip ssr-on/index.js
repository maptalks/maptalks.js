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
                        [0.0015, 0.0015],
                        [0.0015, 0.0005],
                        [0.0005, 0.0005],
                        [0.0005, 0.0015],
                        [0.0015, 0.0015],
                    ]
                ]
            },
            properties: {
                levels: 3
            }
        },
        {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [0.0016, 0.0016],
                    [0.0016, 0.0004],
                    [0.0004, 0.0004],
                    [0.0004, 0.0016],
                    [0.0016, 0.0016]
                ]
            },
            properties: {
                levels: 3
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
    'metalnessFactor': 1
};
const style = [
    {
        renderPlugin: plugin,
        symbol: {
            bloom: false,
            polygonOpacity: 1,
            polygonFill: '#f00',
            material
        },
        filter: [
            '==',
            '$type',
            'Polygon'
        ]
    },
    {
        renderPlugin: {
            type: 'line',
            dataConfig: {
                type: 'line'
            },
            sceneConfig: {
            }
        },
        symbol: {
            lineBloom: true,
            lineWidth: 4,
            lineColor: '#0f0'
        },
        filter: [
            '==',
            '$type',
            'LineString'
        ]
    }
];
module.exports = {
    style,
    data,
    view: {
        'center': [0.0001774231847093688, 0.00028917934585592775],
        'zoom': 18.620460092039856,
        'pitch': 80,
        'bearing': 30.00000000000011
    },
    renderingCount: 1,
    diffCount: 10,
    containerWidth: 512,
    containerHeight: 512,
    sceneConfig: {
        ground: {
            enable: true,
            renderPlugin: {
                type: 'lit'
            },
            symbol: {
                ssr: true,
                polygonFill: [1, 1, 1, 1],
                polygonOpacity: 1,
                material
            }
        },
        postProcess: {
            enable: true,
            antialias: {
                enable: false
            },
            ssr: {
                enable: true
            },
            bloom: {
                enable: true
            }
        }
    }
};
