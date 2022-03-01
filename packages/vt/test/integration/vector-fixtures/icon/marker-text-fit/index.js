const maptalks = require('maptalks');

const marker = new maptalks.Marker([0, 0], {
    symbol: {
        markerType: 'square',
        markerWidth: 128,
        markerHeight: 128,
        markerLineWidth: 0,
        markerVerticalAlignment: 'middle',
        markerTextFit: 'both',
        markerTextFitPadding: [0, 0, 15, 20],

        textName: '{name}',
        textSize: 30,
        textFill: '#0f0'
    },
    properties: {
        name: 'test'
    }
});

module.exports = {
    data: [marker],
    view: {
        center: [0, 0],
        zoom: 6
    }
};
