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
            visible: {
                type: 'categorical',
                property: 'type',
                default: true,
                stops: [
                    [1, true],
                    [2, false]
                ]
            },
            markerFile: icon,
            markerWidth: 30,
            markerHeight: 30,
            markerOpacity: 1
        }
    }
];

module.exports = {
    style,
    data: {
        type: 'FeatureCollection',
        features: [
            { type: 'Feature', geometry: { type: 'Point', coordinates: [0.5, 0.5] }, properties: { type: 1 } },
            { type: 'Feature', geometry: { type: 'Point', coordinates: [0.8, 0.5] }, properties: { type: 2 } }
        ]
    },
    view: {
        center: [0, 0],
        zoom: 6
    }
};
