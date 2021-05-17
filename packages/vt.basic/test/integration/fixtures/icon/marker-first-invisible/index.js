const path = require('path');

const style = [
    {
        filter: ['==', 'type', 1],
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
        symbol: [
            {
                visible: false,
                markerType: 'ellipse',
                markerWidth: 36,
                markerHeight: 36
            },
            {
                markerFile: 'file://' + path.resolve(__dirname, '../../../resources/plane-min.png'),
                markerWidth: 30,
                markerHeight: 30,
                markerOpacity: 1
            }
        ]
    }
];

module.exports = {
    style,
    data: {
        type: 'FeatureCollection',
        features: [
            { type: 'Feature', geometry: { type: 'Point', coordinates: [0.5, 0.5] }, properties: { type: 1 } }
        ]
    },
    view: {
        center: [0, 0],
        zoom: 6
    }
};
