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
            lineStrokeColor: '#000',
            lineColor: [0, 0, 0, 0],
            lineWidth: 8,
            lineStrokeWidth: 6
        }
    }
];

module.exports = {
    style,
    data: data
};
