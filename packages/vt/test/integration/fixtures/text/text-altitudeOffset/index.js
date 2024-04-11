const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [0.5, 0.5] }, properties: { type: 1, height: 20000 } }
    ]
};

const style = [
    {
        renderPlugin: {
            type: 'text',
            dataConfig: {
                type: 'point',
                altitudeOffset: 20000
            },
            sceneConfig: {
                collision: false
            }
        },
        symbol: {
            textName: '{height}'
        }
    }
];

module.exports = {
    style,
    data,
    view: {
        center: [0, 0],
        zoom: 7,
        pitch: 50
    }
};
