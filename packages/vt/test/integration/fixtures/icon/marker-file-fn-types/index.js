const path = require('path');

const icon = 'file://' + path.resolve(__dirname, '../../../resources/plane-min.png');
const style = [
    {
        filter: true,
        renderPlugin: {
            type: 'icon',
            dataConfig: {
                type: 'point'
            },
            sceneConfig: {
                collision: false
            }
        },
        symbol: {
            markerFile: icon,
            markerWidth: {
                type: 'categorical',
                property: 'type',
                default: 30,
                stops: [
                    [2, { stops: [[7, 40], [20, 100]] }]
                ]
            },
            markerHeight: {
                type: 'categorical',
                property: 'type',
                default: 30,
                stops: [
                    [2, 40]
                ]
            },
            markerOpacity: 1,
            markerDx: {
                type: 'categorical',
                property: 'type',
                default: 0,
                stops: [
                    [2, 20]
                ]
            },
            markerDy: {
                type: 'categorical',
                property: 'type',
                default: 0,
                stops: [
                    [2, -30]
                ]
            }
        }
    }
];

module.exports = {
    style,
    data: {
        type: 'FeatureCollection',
        features: [
            { type: 'Feature', geometry: { type: 'Point', coordinates: [0.5, 0.5] }, properties: { type: 1 } },
            { type: 'Feature', geometry: { type: 'Point', coordinates: [0.5, 0.5] }, properties: { type: 2 } }
        ]
    },
    view: {
        center: [0, 0],
        zoom: 6
    }
};
