const path = require('path');
const scale = Math.pow(2, 2);

const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [13.411523913043766, 52.53168811873488] },
        properties: { rotationX: 90, rotationY: 10, rotationZ: 20, scaleX: 1 * scale, scaleY: 2 * scale, scaleZ: 3 * scale, translationX: 1, translationY: 2, translationZ: 3 } }
    ]
};


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
            rotationX: { type: 'identity', property: 'rotationX' },
            rotationY: { type: 'identity', property: 'rotationY' },
            rotationZ: { type: 'identity', property: 'rotationZ' },
            scaleX: { type: 'identity', property: 'scaleX' },
            scaleY: { type: 'identity', property: 'scaleY' },
            scaleZ: { type: 'identity', property: 'scaleZ' },
            translationX: { type: 'identity', property: 'translationX' },
            translationY: { type: 'identity', property: 'translationY' },
            translationZ: { type: 'identity', property: 'translationZ' },
            polygonOpacity: 1,
            polygonFill: '#f00'
        }
    }
];

module.exports = {
    style,
    data,
    // features: true,
    view: {
        center: [13.411523913043766, 52.53168811873488],
        zoom: 19
    }
};
