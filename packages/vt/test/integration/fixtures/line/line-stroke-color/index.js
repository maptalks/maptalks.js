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
            lineColor: [0.73, 0.73, 0.73, 0],
            lineWidth: 6,
            lineStrokeColor: [0, 0, 0, 1],
            lineStrokeWidth: 2
        }
    }
];

module.exports = {
    style,
    data: data
};
