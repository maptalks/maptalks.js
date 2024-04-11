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
    view: {
        pitch: 70,
        bearing: -60,
        center: [0, 0],
        zoom: 17
    },
    renderingCount: 0,
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
