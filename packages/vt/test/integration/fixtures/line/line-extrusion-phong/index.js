const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-1, -0.5], [-0.4, -0.5]/*, [0, -0.5]*/] }, properties: { height: 20000 } }
    ]
};
const material = {
    'baseColorFactor': [1, 1, 1, 1],
    'materialShininess': 32.0,
    'ambientStrength': 1,
    'specularStrength': 1,
    'opacity': 1.0,
    'extrusionOpacity': 0,
    'extrusionOpacityRange': [0, 1.8]
};
const style = [
    {
        renderPlugin: {
            type: 'phong',
            dataConfig: {
                type: 'line-extrusion',
                altitudeScale: 1,
                defaultAltitude: 2000
            },
            sceneConfig: {
            },
        },
        symbol: {
            material,
            lineColor: '#f00',
            lineWidth: 16
        }
    }
];

module.exports = {
    style,
    data: data,
    view: {
        pitch: 80,
        center: [-0.5, -0.5],
        zoom: 9
    }
};
