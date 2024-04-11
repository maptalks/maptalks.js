const path = require('path');
const maptalks = require('maptalks');

const marker1 = new maptalks.Marker([0, 0], {
    symbol: {
        markerFile: 'file://' + path.resolve(__dirname, '../../../resources/plane-min.png'),
        markerWidth: 30,
        markerHeight: 30,
        markerOpacity: 1
    }
});

const marker2 = new maptalks.Marker([0, 0.1], {
    visible: false,
    symbol: {
        markerFile: 'file://' + path.resolve(__dirname, '../../../resources/plane-min.png'),
        markerWidth: 30,
        markerHeight: 30,
        markerOpacity: 1
    }
});

module.exports = {
    data: [marker1, marker2],
    view: {
        center: [0, 0],
        zoom: 6
    }
};
