const path = require('path');

const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [13.411523913043766, 52.53168811873488] }, properties: { type: 1, height: 4 } }
    ]
};
const scale = 1;

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
            url: 'file://' + path.resolve(__dirname, '../../../resources/gltf/box.glb'),
            modelHeight: {
                type: 'identity',
                property: 'height'
            },
            scaleX: scale,
            scaleY: scale,
            scaleZ: scale,
            rotationX: 90,
            polygonOpacity: 1,
            polygonFill: '#f00'
        }
    }
];

module.exports = {
    style,
    data,
    features: true,
    view: {
        center: [13.411523913043766, 52.53168811873488],
        zoom: 19
    }
};
