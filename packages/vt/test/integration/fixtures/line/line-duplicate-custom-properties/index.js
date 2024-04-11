const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-1, 0.0], [-0.4, 0.0]] }, properties: { type: 1, foo: 'bar' } }
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
                properties: { color: '#f00', width: 8 }
            },
            {
                filter: ['==', 'foo', 'bar'],
                properties: { color: '#0f0', width: 4 }
            }
        ],
        symbol: {
            lineWidth: {
                property: 'width',
                type: 'identity'
            },
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
