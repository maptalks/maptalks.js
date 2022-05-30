const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-1, 0.5], [1, 0.5]] }, properties: { type: 1 } },
        { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-1, 0], [1, 0]] }, properties: { type: 2 } },
        { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-1, -0.5], [1, -0.5]] }, properties: { type: 3 } }
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
            lineWidth: 8,
            lineCap: 'square'
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
            lineWidth: 8,
            lineCap: 'butt'
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
            lineWidth: 8,
            lineCap: 'round'
        }
    }
];

module.exports = {
    style,
    data: data
};
