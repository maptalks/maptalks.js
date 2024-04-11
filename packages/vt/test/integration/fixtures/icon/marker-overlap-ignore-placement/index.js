const path = require('path');

const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [0.5, 0.5] }, properties: { type: 1 } },
        { type: 'Feature', geometry: { type: 'Point', coordinates: [0.6, 0.6] }, properties: { type: 2 } }
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
                collision: true,
                fading: false
            }
        },
        symbol: {
            markerFile: 'file://' + path.resolve(__dirname, '../../../resources/plane-min.png'),
            markerWidth: 30,
            markerHeight: 30,
            markerOpacity: 1,
            markerIgnorePlacement: true,
            markerAllowOverlap: true
        }
    }
];

module.exports = {
    style,
    data,
    view: {
        center: [0, 0],
        zoom: 6
    }
};
