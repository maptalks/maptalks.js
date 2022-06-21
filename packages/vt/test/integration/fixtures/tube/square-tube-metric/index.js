const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, -0.00002], [0.00005, -0.00002]] }, properties: { type: 1 } },
        { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0.00003], [0.00005, 0.00003]] }, properties: { type: 2 } }
    ]
};

const style = [
    {
        renderPlugin: {
            type: 'tube',
            dataConfig: {
                type: 'square-tube',
                metric: 'cm'
            },
            sceneConfig: {
            }
        },
        symbol: {
            lineColor: [1, 0, 0, 1],
            lineWidth: 400,
            lineHeight: 200
        }
    }
];

module.exports = {
    style,
    diffCount: 1,
    data: data,
    view: {
        center: [0, 0],
        zoom: 20,
        pitch: 20
    }
};
