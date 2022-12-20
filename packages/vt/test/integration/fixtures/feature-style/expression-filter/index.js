const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', id: 0, geometry: { type: 'LineString', coordinates: [[-1, 0.9], [0, 0.9], [0.6, -0.5]] }, properties: { type: 1 } },
        { type: 'Feature', id: 1, geometry: { type: 'LineString', coordinates: [[-1, 0.6], [-0.2, 0.6], [0.3, -0.5]] }, properties: { type: 2, foo: '1bar2' } },
        { type: 'Feature', id: 2, geometry: { type: 'LineString', coordinates: [[-1, 0.3], [-0.4, 0.3], [0, -0.5]] }, properties: { type: 3, foo: '1bar2' } }
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
        filter: ['==', ['get', 'type'], 1],
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
        // filter: ['==', ['get', 'type'], 2],
        filter: ['contains', 'foo', 'bar'],
        symbol: {
            lineColor: '#0f0',
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
        filter: ['==', ['get', 'type'], 3],
        symbol: {
            lineColor: '#000',
            lineWidth: 12,
            lineJoin: 'bevel'
        }
    }
];

const featureStyle = [
    {
        id: 2,
        style: [
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
                    lineWidth: 12,
                    lineJoin: 'round',
                    lineColor: '#f00'
                }
            }
        ]
    }
];

module.exports = {
    style: {
        style,
        featureStyle
    },
    data: data
};
