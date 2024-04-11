const path = require('path');

const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-1, 0.7], [-0.4, 0.7], [0, 0.2]] }, properties: { type: 2 } }
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
            lineColor: '#f00',
            linePatternFile: 'file://' + path.resolve(__dirname, '../../../resources/avatar.jpg'),
            lineWidth: 24,
            lineBlur: 5
        }
    }
];

module.exports = {
    style,
    diffCount: 1,
    data: data
};
