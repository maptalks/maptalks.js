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
            markerWidth: 12,
            markerHeight: 12,
            markerDy: -20,
            textName: '{content}',
            textRotation: 30,
            textFill: '#f00',
            textSize: 20
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
