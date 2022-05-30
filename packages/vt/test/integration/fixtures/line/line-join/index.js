const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-1, 0.9], [0, 0.9], [0.6, -0.5]] }, properties: { type: 1 } },
        { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-1, 0.6], [-0.2, 0.6], [0.3, -0.5]] }, properties: { type: 2 } },
        { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-1, 0.3], [-0.4, 0.3], [0, -0.5]] }, properties: { type: 3 } }
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
        filter: ['==', 'type', 1],
        symbol: {
            lineColor: '#000',
            lineWidth: 12,
            lineJoin: 'miter'
        }
    },
    {
        renderPlugin: {
            type: 'line',
            dataConfig: {
                type: 'line'
            },
            sceneConfig: {
            }
        },
        filter: ['==', 'type', 2],
        symbol: {
            lineColor: '#000',
            lineWidth: 12,
            lineJoin: 'round'
        }
    },
    {
        renderPlugin: {
            type: 'line',
            dataConfig: {
                type: 'line'
            },
            sceneConfig: {
            }
        },
        filter: ['==', 'type', 3],
        symbol: {
            lineColor: '#000',
            lineWidth: 12,
            lineJoin: 'bevel'
        }
    }
];

module.exports = {
    style,
    data: data
};
