const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, -0.00002], [0.00005, -0.00002]] }, properties: { lineWidth: 200, lineHeight: 100 } },
        { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0.00003], [0.00005, 0.00003]] }, properties: { lineWidth: 100, lineHeight: 100 } },
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
            lineWidth: {
                property: 'lineWidth',
                type: 'identity'
            },
            lineHeight: {
                property: 'lineHeight',
                type: 'identity'
            }
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
