const path = require('path');

const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-1, 0.0], [-0.4, 0.0], [0, -0.5]] }, properties: { type: 1, gap: 0.5 } },
        { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-1, 0.7], [-0.4, 0.7], [0, 0.2]] }, properties: { type: 2, gap: 1.5 } }
    ]
};

const style = [
    {
        renderPlugin: {
            type: 'line',
            dataConfig: {
                type: 'line'
            },
            sceneConfig: {
            }
        },
        symbol: {
            linePatternFile: {
                property: 'type',
                type: 'categorical',
                stops: [
                    [1, 'file://' + path.resolve(__dirname, '../../../resources/avatar.jpg')],
                    [2, 'file://' + path.resolve(__dirname, '../../../resources/1.png')]
                ]
            },
            linePatternGap: {
                type: 'identity',
                property: 'gap'
            },
            lineWidth: 24,
            lineBlur: 5
        }
    }
];

module.exports = {
    style,
    data: data
};
