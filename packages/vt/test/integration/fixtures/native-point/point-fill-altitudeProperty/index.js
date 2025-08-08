const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: { type: 1, altitude: 7000 } }
    ]
};

const style = [
    {
        filter: ['==', 'type', 1],
        renderPlugin: {
            type: 'native-point',
            dataConfig: {
                type: 'native-point',
                altitudeOffset: 10000,
                altitudeProperty: 'altitude',
                defaultAltitude: 0,
                altitudeScale: 10,
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
