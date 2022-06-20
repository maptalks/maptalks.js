const path = require('path');

const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, -0.00002], [0.00005, -0.00002]] }, properties: { type: 1 } },
        { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0.00003], [0.00005, 0.00003]] }, properties: { type: 2 } }
    ]
};

const style = [
    {
        renderPlugin: {
            type: 'tube',
            dataConfig: {
                type: 'square-tube'
            },
            sceneConfig: {
            }
        },
        symbol: {
            lineColor: [1, 1, 1, 1],
            linePatternFile: {
                property: 'type',
                type: 'categorical',
                stops: [
                    [1, 'file://' + path.resolve(__dirname, '../../../resources/avatar.jpg')],
                    [2, 'file://' + path.resolve(__dirname, '../../../resources/1.png')]
                ]
            },
            lineWidth: 4,
            // lineHeight: 4
        }
    }
];

module.exports = {
    style,
    diffCount: 1,
    data: data,
    view: {
        center: [0, 0],
        zoom: 20,
        pitch: 20
    }
};
