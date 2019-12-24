const path = require('path');

const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-1, 0.0], [-0.4, 0.0], [0, -0.5]] }, properties: { type: 3 } }
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
            linePatternFile: 'file://' + path.resolve(__dirname, '../../../resources/plane-min.png'),
            lineWidth: 24,
            lineBlur: 5
        }
    }
];

module.exports = {
    style,
    data: data
};
