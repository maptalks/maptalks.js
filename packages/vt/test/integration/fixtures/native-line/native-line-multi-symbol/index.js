const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-1, 0.0], [-0.4, 0.0], [0, -0.5]] }, properties: { type: 3 } }
    ]
};

const style = [
    {
        renderPlugin: {
            type: 'native-line',
            dataConfig: {
                type: 'native-line'
            },
            sceneConfig: {
            }
        },
        symbol: [
            {
                lineColor: '#f00',
                lineOpacity: 0.4
            },
            {
                lineColor: '#0f0',
                lineOpacity: 0.4
            }
        ]
    }
];

module.exports = {
    style,
    data: data
};
