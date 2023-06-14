const path = require('path');

const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [0.5, 0.5] }, properties: { type: 1 } }
    ]
};

const style = [
    {
        renderPlugin: {
            type: 'icon',
            dataConfig: {
                type: 'point',
                altitudeOffset: 20000
            },
            sceneConfig: {
                collision: false
            }
        },
        symbol: {
            markerFile: 'file://' + path.resolve(__dirname, '../../../resources/plane-min.png'),
            markerWidth: 15,
            markerHeight: 15

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
