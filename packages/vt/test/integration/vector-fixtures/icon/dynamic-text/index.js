const path = require('path');
const maptalks = require('maptalks');

const marker = new maptalks.Marker([0, 0], {
    symbol: {
        markerFile: 'file://' + path.resolve(__dirname, '../../../resources/plane-min.png'),
        markerWidth: 30,
        markerHeight: 30,
        markerOpacity: 1,
        textName: '{name}',
        textSize: 30,
        textHaloRadius: 1,
        textHaloFill: '#f00',
        textOpacity: 0.3
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
