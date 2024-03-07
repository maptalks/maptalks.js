//#364
const path = require('path');
const maptalks = require('maptalks');

const marker = new maptalks.Marker([0.1, 0], {
    zIndex: 1,
    symbol: {
        markerFile: 'file://' + path.resolve(__dirname, './blue.png'),
        markerWidth: 32,
        markerHeight: 32
    }
});

const marker2 = new maptalks.Marker([0, 0], {
    zIndex: 2,
    symbol: {
        markerFile: 'file://' + path.resolve(__dirname, './red.png'),
        markerWidth: 32,
        markerHeight: 32
    }
});

const marker3 = new maptalks.Marker([0, 0.1], {
    symbol: {
        markerType: 'ellipse',
        markerWidth: 32,
        markerHeight: 32
    }
});

module.exports = {
    options: { collision: true, debugCollision: true },
    data: [marker, marker2, marker3],
    view: {
        center: [0, 0],
        zoom: 6
    }
};
