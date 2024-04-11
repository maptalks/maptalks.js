const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-1, 0.0], [-0.4, 0.0], [0, -0.5]] }, properties: { type: 3 } }
    ]
};

const style = [
    {
        renderPlugin: {
            type: 'line',
            dataConfig: {
                type: 'line',
                altitudeOffset: 40000
            },
            sceneConfig: {
            }
        },
        symbol: {
            lineWidth: 12,
            lineColor: '#f00'
        }
    }
];

module.exports = {
    style,
    data: data,
    view: {
        center: [0, 0],
        pitch: 50,
        zoom: 7
    }
};
