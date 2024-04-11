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
                        [0.0005, 0.0015],
                        [0.0015, 0.0015],
                        [0.0015, 0.0005],
                        [0.0005, 0.0005],
                        [0.0005, 0.0015]
                    ]
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
    }
];
module.exports = {
    style,
    data,
    view: {
        pitch: 70,
        bearing: -60,
        center: [0.001, 0.001],
        zoom: 17
    },
    renderingCount: 1,
    sceneConfig: {
        ground: {
            enable: true,
            renderPlugin: {
                type: 'fill'
            },
            symbol: {
                polygonFill: [0, 1, 0, 1],
                polygonOpacity: 1
            }
        },
        postProcess: {
            enable: true,
            ssr: {
                enable: true
            }
        },
        shadow: {
            type: 'esm',
            enable: true,
            quality: 'high',
            opacity: 0.8,
            color: [0, 0, 0],
            blurOffset: 1,
            lightDirection: [1, 0, -1]
        }
    }
};
