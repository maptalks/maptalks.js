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
        symbol: {
            visible: {
                property: 'type',
                default: false,
                type: 'categorical',
                stops: [
                    [1, true],
                    [2, true]
                ],
            },
            lineWidth: {
                property: 'type',
                type: 'categorical',
                default: 4,
                stops: [
                    [2, { stops: [[1, 10], [20, 20]] }]
                ]
            },
            lineColor: {
                property: 'type',
                type: 'categorical',
                default: '#f00',
                stops: [
                    [2, '#000']
                ]
            }
        }
    }
];

module.exports = {
    style,
    data: data
};
