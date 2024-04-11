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
            textFaceName: 'Arial',
            textWeight: 'bold',
            textStyle: 'italic',
            textSize: 30,
            textFill: '#f00',
            textOpacity: 1
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
