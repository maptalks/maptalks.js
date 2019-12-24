const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, -0.5], [-0.4, 0.1], [-1, 0.1]] }, properties: { type: 3 } }
    ]
};

const style = [
    {
        renderPlugin: {
            type: 'line',
            dataConfig: {
                type: 'line',
                only2D: true
            },
            sceneConfig: {
            }
        },
        symbol: {
            lineWidth: 12,
            lineOffset: 10
        }
    }
];

module.exports = {
    style,
    data: data
};
