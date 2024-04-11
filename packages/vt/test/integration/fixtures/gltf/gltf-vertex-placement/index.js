const path = require('path');

const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'LineString', coordinates: [[13.411523913043766, 52.53168811873488], [13.411423913043766, 52.53168811873488]] }, properties: { type: 1 } }
    ]
};
const scale = Math.pow(2, 2);

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
            scaleX: scale,
            scaleY: scale,
            scaleZ: scale,
            rotationX: 90,
            markerPlacement: 'vertex'
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
