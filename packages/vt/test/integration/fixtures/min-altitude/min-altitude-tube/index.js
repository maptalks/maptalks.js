const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, -0.00002, 0], [0.00005, -0.00002, 4]] }, properties: { type: 1 } }
    ]
};

const style = [
    {
        renderPlugin: {
            type: 'tube',
            dataConfig: {
                type: 'round-tube'
            },
            sceneConfig: {
            }
        },
        symbol: {
            lineColor: '#f00',
            lineWidth: 4
        }
    }
];

module.exports = {
    style,
    diffCount: 1,
    altitude: 10,
    data: data,
    view: {
        center: [0, 0],
        zoom: 20
    }
};
