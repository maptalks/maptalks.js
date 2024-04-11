const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-1, 0.0], [-0.4, 0.0], [0, -0.5]] }, properties: {} }
    ]
};

const style = [
    {
        customProperties: [
            {
              filter: {
                condition: true
              },
              properties: {
                gradients: [0, 'red', 0.7, 'yellow', 1, 'green']
              }
            }
        ],
        renderPlugin: {
            type: 'line-gradient',
            dataConfig: {
                type: 'line'
            },
        },
        symbol: {
            lineWidth: 16,
            lineGradientProperty: 'gradients',
        }
    }
];

module.exports = {
    style,
    data: data
};
