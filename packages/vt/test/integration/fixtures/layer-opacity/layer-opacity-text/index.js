const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [91.14478, 29.668272] }, properties: { type: 1 } }
    ]
};

const style = [
    {
        filter: true,
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
            textName: 'hello',
            textSize: 30
        }
    }
];

module.exports = {
    style,
    data
};
