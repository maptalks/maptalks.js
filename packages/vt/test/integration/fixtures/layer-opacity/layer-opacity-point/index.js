const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [91.14478, 29.668272] }, properties: { type: 1 } }
    ]
};

const style = [
    {
        filter: ['==', '$type', 'Point'],
        renderPlugin: {
            type: 'native-point',
            dataConfig: {
                type: 'native-point'
            }
        },
        symbol: {
            markerSize: 30,
            markerFill: '#f00',
            markerOpacity: 1
        }
    }
];

module.exports = {
    style,
    data
};
