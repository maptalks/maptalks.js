// maptalks/issues#532

const path = require('path');
const maptalks = require('maptalks');

const marker1 = new maptalks.Marker([-1, 0], {
    symbol: {
        markerFile: 'file://' + path.resolve(__dirname, '../../../resources/plane-min.png'),
        markerWidth: 30,
        markerHeight: 30,
        markerOpacity: 1,
        markerPitchAlignment: 'map',
        markerRotationAlignment: 'map'
    }
});

const marker2 = new maptalks.Marker([1, 0], {
    symbol: {
        textName: 'hello',
        textSize: 14
    }
});

module.exports = {
    data: [marker1, marker2],
    options: {
        collision: true,
        debugCollision: true
    },
    view: {
        center: [0, 0],
        zoom: 6
    }
};
