const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [13.411523913043766, 52.53168811873488] }, properties: { type: 1 } }
    ]
};
const scale = Math.pow(2, 2) / 60;

const style = [
    {
        renderPlugin: {
            type: 'gltf-lit',
            dataConfig: {
                type: 'native-point'
            },
            sceneConfig: {
                gltfAnimation: {
                    enable: true
                }
            }
        },
        symbol: {
            scaleX: scale,
            scaleY: scale,
            scaleZ: scale,
            rotationX: 90,
            markerOpacity: 1,
            markerFill: '#f00'
        }
    }
];

module.exports = {
    style,
    data,
    view: {
        center: [13.411523913043766, 52.53168811873488],
        zoom: 19
    }
};
