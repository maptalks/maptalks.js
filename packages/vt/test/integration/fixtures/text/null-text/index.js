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
            textName: null,
            textSize: 30
        }
    }
];

module.exports = {
    style,
    eventName: 'layerload',
    renderingCount: 1,
    data: {
        type: 'FeatureCollection',
        features: [
            { type: 'Feature', geometry: { type: 'Point', coordinates: [0.5, 0.5] }, properties: { type: 1 } },
            { type: 'Feature', geometry: { type: 'Point', coordinates: [0.5, 0.5] }, properties: { type: 2 } }
        ]
    }
};
