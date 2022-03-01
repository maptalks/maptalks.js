const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: { type: 1 } }
    ]
};

const style = [
    {
        renderPlugin: {
            type: 'icon',
            dataConfig: {
                type: 'point'
            },
            sceneConfig: {
                collision: false,
                fading: false
            }
        },
        symbol: {
            markerType: 'ellipse',
            markerWidth: {
                stops: [
                    [5, 4],
                    [15, 30]
                ]
            },
            markerHeight: {
                stops: [
                    [5, 4],
                    [15, 15]
                ]
            },
            markerFill: '#ff0000',
        }
    }
];

module.exports = {
    style,
    data,
    view: {
        center: [0, 0],
        zoom: 15
    }
};
