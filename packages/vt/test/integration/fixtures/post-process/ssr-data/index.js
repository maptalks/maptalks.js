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
                        [0.0015, 0.0015],
                        [0.0015, 0.0005],
                        [0.0005, 0.0005],
                        [0.0005, 0.0015]
                    ]
                ]
            },
            properties: {
                type: 'data',
                levels: 3
            }
        },
        {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [
                    [
                        [0.0020, 0.0020],
                        [0.0020, 0.0020],
                        [0.0020, 0.0001],
                        [0.0001, 0.0001],
                        [0.0001, 0.0020]
                    ]
                ]
            },
            properties: {
                type: 'ground',
                levels: 0
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
            'type',
            'data'
        ]
    },
    {
        renderPlugin: plugin,
        symbol: {
            ssr: true,
            polygonOpacity: 1,
            polygonFill: '#fff',
            material
        },
        filter: [
            '==',
            'type',
            'ground'
        ]
    }
];
module.exports = {
    style,
    data,
    view: {
        'center': [0.0001774231847093688, 0.00028917934585592775],
        'zoom': 18.620460092039856,
        'pitch': 60,
        'bearing': 30.00000000000011
    },
    renderingCount: 2,
    callRedraw: true,
    containerWidth: 512,
    containerHeight: 512,
    sceneConfig: {
        postProcess: {
            enable: true,
            antialias: {
                enable: false
            },
            ssr: {
                enable: true
            }
        }
    }
};
