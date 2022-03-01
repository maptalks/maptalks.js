const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[-1, -0.1], [-0.4, -0.1], [0, -0.5], [-1, -0.5], [-1, -0.1]]] }, properties: { type: 3 } }
        // { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-1, -0.1], [-0.4, -0.1]] }, properties: { type: 3 } }
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
            lineWidth: 12,
            lineColor: '#f00',
            lineDashColor: {
                property: 'type',
                default: 'rgba(0,255,0,1)',
                type: 'categorical',
                stops: [
                    [3, '#000']
                ],
            },
            lineDasharray: [10, 10]
        }
    }
];

module.exports = {
    style,
    data: data
};
