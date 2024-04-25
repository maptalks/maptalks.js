const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [91.14478,29.658272] }, properties: { type: 1 } }
    ]
};

const scale = Math.pow(2, 7) / 60;

const style = [
    {
        filter: true,
        renderPlugin: {
            type: 'gltf-lit',
            dataConfig: {
                type: 'native-point'
            },
            sceneConfig: {
                gltfAnimation: {
                    enable: false
                }
            }
        },
        symbol: {
            scaleX: scale,
            scaleY: scale,
            scaleZ: scale,
            markerOpacity: 1,
            markerFill: '#f00'
        }
    }
];

module.exports = {
    renderingCount: 6,
    style,
    data
};
