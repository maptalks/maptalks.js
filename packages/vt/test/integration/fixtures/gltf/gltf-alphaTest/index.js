const path = require('path');

const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [13.411523913043766, 52.53168811873488] }, properties: { type: 1 } }
    ]
};
const scale = Math.pow(2, 5);

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
            url: 'file://' + path.resolve(__dirname, '../../../resources/tree2.glb'),
            scaleX: scale,
            scaleY: scale,
            scaleZ: scale,
            markerOpacity: 1,
            alphaTest: 0.5
        }
    }
];

module.exports = {
    style,
    data,
    renderCount: 3,
    containerWidth: 512,
    containerHeight: 512,
    view: {
        pitch: 50,
        bearing: 50,
        center: [13.411523913043766, 52.53168811873488],
        zoom: 19
    }
};
