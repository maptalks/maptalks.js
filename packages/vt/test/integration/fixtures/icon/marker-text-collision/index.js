const style = [
    {
        filter: true,
        renderPlugin: {
            type: 'icon',
            dataConfig: {
                type: 'point'
            },
            sceneConfig: {
                collision: true,
                fading: false
            }
        },
        symbol: {
            markerType: 'ellipse',
            markerWidth: 20,
            markerHeight: 20,
            markerLineWidth: 0,
            textName: '{content}',
            textFill: '#f00',
            textSize: 30
        }
    }
];

module.exports = {
    style,
    data: {
        type: 'FeatureCollection',
        features: [
            { type: 'Feature', geometry: { type: 'Point', coordinates: [0.5, 0.5] }, properties: { content: 'hello' } }
        ]
    },
    view: {
        center: [0, 0],
        zoom: 6
    }
};
