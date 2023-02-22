// maptalks/issues#222
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
        defaultAltitude: 0,
        top: true,
        side: false
    },
    sceneConfig: {},
};
const material = {
    "baseColorTexture": null,
    "baseColorFactor": [
        1,
        1,
        1,
        1
    ],
    "hsv": [
        0,
        0,
        0
    ],
    "baseColorIntensity": 0.6,
    "contrast": 1,
    "outputSRGB": 1,
    "metallicRoughnessTexture": null,
    "roughnessFactor": 1,
    "metallicFactor": 1,
    "normalTexture": null,
    "noiseTexture": null,
    "uvScale": [
        1,
        1
    ],
    "uvOffset": [
        0,
        0
    ],
    "uvRotation": 0,
    "uvOffsetAnim": [
        0,
        0
    ],
    "normalMapFactor": 1,
    "normalMapFlipY": 0,
    "bumpTexture": null,
    "bumpScale": 0.02,
    "clearCoatThickness": 5,
    "clearCoatFactor": 0,
    "clearCoatIor": 1.4,
    "clearCoatRoughnessFactor": 0.04,
    "occlusionTexture": null,
    "emissiveTexture": null,
    "emissiveFactor": [
        0.03, 0.03, 0.03
    ],
    "emitColorFactor": 1,
    "emitMultiplicative": 1
};
const style = [
    {
        renderPlugin: plugin,
        symbol: {
            polygonOpacity: 0.5,
            polygonFill: '#f00',
            material
        },
        filter: ['==', 'type', 'extrusion'],
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
