const style = [
    {
        renderPlugin: {
            type: 'text',
            dataConfig: {
                type: 'point'
            },
            sceneConfig: {
                collision: false
            }
        },
        symbol: {
            textName: ["step", ["zoom"], ["get", "name0"], 5, ["get", "name1"], 10, ["get", "name2"]],
            textSize: 12
        }
    }
];

module.exports = {
    style,
    // eventName: 'layerload',
    // renderingCount: 12,
    data: {
        type: 'FeatureCollection',
        features: [
            { type: 'Feature', geometry: { type: 'Point', coordinates: [0.5, 0.5] }, properties: { name0: '< 5', name1: '>= 5 and < 10', name2: '> 10' } }
        ]
    }
};
