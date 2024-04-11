const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: { type: 1 } },
        { type: 'Feature', geometry: { type: 'Point', coordinates: [0.5, 0.5] }, properties: { type: 2 } }
    ]
};

const style = [
    {
        filter: ['==', 'type', 1],
        renderPlugin: {
            type: 'native-point',
            dataConfig: {
                type: 'native-point'
            }
        },
        symbol: {
            markerSize: 30,
            markerFill: '#f00',
            markerOpacity: 0.5
        }
    },
    {
        renderPlugin: {
            type: 'native-point',
            dataConfig: {
                type: 'native-point'
            }
        },
        symbol: {
            markerType: 'square',
            markerSize: 20,
            markerFill: '#ff0',
            markerOpacity: 0.5
        }
    }
];

module.exports = {
    style,
    data,
    view: {
        center: [0, 0],
        zoom: 5
    }
};
