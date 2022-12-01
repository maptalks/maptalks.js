const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: { type: 1 } }
    ]
};

const style = [
    {
        filter: ['==', 'type', 1],
        renderPlugin: {
            type: 'native-point',
            dataConfig: {
                type: 'native-point',
                altitudeOffset: 80000
            }
        },
        symbol: {
            markerSize: 30,
            markerFill: '#f00',
            markerOpacity: 0.5
        }
    }
];

module.exports = {
    style,
    data,
    view: {
        center: [0, 0],
        zoom: 6,
        pitch: 50
    }
};
