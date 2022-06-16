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
                type: 'round-tube'
            },
            sceneConfig: {
            }
        },
        symbol: {
            lineColor: '#f00',
            lineWidth: {
                property: 'type',
                type: 'categorical',
                stops: [
                    [1, 4],
                    [2, 2]
                ]
            },
            uvScale: [2, 3],
            linePatternGap: 0.2
        }
    }
];

module.exports = {
    style,
    diffCount: 1,
    data: data,
    view: {
        center: [0, 0],
        zoom: 20
    }
};
