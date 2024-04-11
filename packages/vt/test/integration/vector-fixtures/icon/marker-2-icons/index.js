//#364
const path = require('path');
const maptalks = require('maptalks');

const marker = new maptalks.Marker([0, 0], {
    symbol: {
        markerFile: 'file://' + path.resolve(__dirname, './poi.png'),
        markerWidth: 32,
        markerHeight: 32
    }
});

const marker2 = new maptalks.Marker([0.5, 0], {
    symbol: {
        markerFile: 'file://' + path.resolve(__dirname, './poi1.png'),
        markerWidth: 32,
        markerHeight: 32
    }
});


module.exports = {
    data: [marker, marker2],
    view: {
        center: [0, 0],
        zoom: 6
    }
};
