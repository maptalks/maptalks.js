const path = require('path');

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
            markerFile: 'file://' + path.resolve(__dirname, '../../../resources/shield.svg'),
            markerTextFitPadding: {
                type: 'categorical',
                property: 'type',
                default: [0, 0, 0, 0],
                stops: [
                    [1, [2, 3, 2, 3]],
                    [2, [4, 5, 4, 5]],
                    [3, [4, 5, 4, 5]],
                ]
            },
            markerWidth: 10,
            markerHeight: 10,
            markerTextFit: {
                type: 'categorical',
                property: 'type',
                default: 'none',
                stops: [
                    [1, 'both'],
                    [2, 'width'],
                    [3, 'height']
                ]
            },
            textName: '{type}',
            textFill: '#000',
            textSize: {
                stops: [
                    [1, 10],
                    [10, 20]
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
            { type: 'Feature', geometry: { type: 'Point', coordinates: [0.1, 0.5] }, properties: { type: 2 } },
            { type: 'Feature', geometry: { type: 'Point', coordinates: [-0.5, 0.5] }, properties: { type: 3 } }
        ]
    },
    view: {
        center: [0, 0],
        zoom: 6
    }
};
