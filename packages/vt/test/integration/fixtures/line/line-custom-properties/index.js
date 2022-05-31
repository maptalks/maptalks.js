const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-1, 0.0], [-0.4, 0.0]] }, properties: { type: 1 } },
        { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-1, 0.3], [-0.4, 0.3]] }, properties: { type: 2 } },
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
        customProperties: [
            {
                filter: ['==', 'type', 1],
                properties: { color: '#f00' }
            },
            {
                filter: ['==', 'type', 2],
                properties: { color: '#0f0' }
            }
        ],
        symbol: {
            lineWidth: 10,
            lineColor: {
                property: 'color',
                type: 'identity'
            }
        }
    }
];

module.exports = {
    style,
    data: data
};
