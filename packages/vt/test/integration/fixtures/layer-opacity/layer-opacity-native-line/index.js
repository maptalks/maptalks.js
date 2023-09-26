const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'LineString', coordinates: [[91.14378,29.658272], [91.15678,29.658272]] }, properties: { type: 1 } }
    ]
};

const style = [
    {
        filter: true,
        renderPlugin: {
            type: 'native-line',
            dataConfig: {
                type: 'native-line'
            }
        },
        symbol: {
            lineColor: '#f00'
        }
    }
];

module.exports = {
    style,
    data
};
