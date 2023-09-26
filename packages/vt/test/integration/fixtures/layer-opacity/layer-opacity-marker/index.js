const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [91.14478,29.658272] }, properties: { type: 1 } }
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
            markerFill: '#00f',
            markerWidth: 30,
            markerHeight: 30,
            markerOpacity: 1
        }
    }
];

module.exports = {
    style,
    data
};
