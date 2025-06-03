const path = require('path');

const data = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [[13.411423913043766, 52.53158811873488, 0], [13.411623913043766, 52.53168811873488, 8]]
            },
            properties: {
                type: 1
            }
        }
    ]
};

// const data = {
//     type: 'FeatureCollection',
//     features: [
//         {
//             type: 'Feature',
//             geometry: {
//                 type: 'MultiPoint',
//                 coordinates: [[13.411523913043766, 52.53168811873488, 0], [13.411623913043766, 52.53168811873488, 8]]
//             },
//             properties: {
//                 type: 1
//             }
//         }
//     ]
// };
const scale = Math.pow(2, 2);

const style = [
    {
        filter: true,
        renderPlugin: {
            type: 'gltf-lit',
            dataConfig: {
                type: 'native-line'
            }
        },
        symbol: {
            url: 'file://' + path.resolve(__dirname, '../../../resources/gltf/box.glb'),
            scaleX: scale,
            scaleY: scale,
            scaleZ: scale,
            polygonOpacity: 1,
            polygonFill: '#f00'
        }
    },
    {
        filter: true,
        renderPlugin: {
            type: 'native-line',
            dataConfig: {
                type: 'native-line'
            },
            sceneConfig: {
                depthFunc: 'always'
            }
        },
        symbol: {
            lineColor: '#f00',
            lineOpacity: 1
        }
    }
];

module.exports = {
    style,
    debug: true,
    data,
    view: {
        center: [13.411523913043766, 52.53168811873488],
        zoom: 20,
        pitch: 80
    },
    containerWidth: 1024,
    containerHeight: 1024
};
