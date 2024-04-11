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
            textName: '貔貅',
            textSize: 30,
            textHaloRadius: 1,
            textHaloFill: [1, 0, 0, 1],
            textHaloOpacity: 0.4
        }
    }
];

module.exports = {
    style,
    data: {
        type: 'FeatureCollection',
        features: [
            { type: 'Feature', geometry: { type: 'Point', coordinates: [0.5, 0.5] } }
        ]
    }
};
