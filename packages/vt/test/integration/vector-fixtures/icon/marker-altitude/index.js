const path = require('path');
const maptalks = require('maptalks');

const marker = new maptalks.Marker([0, 0, 80000], {
    symbol: {
        markerFile: 'file://' + path.resolve(__dirname, '../../../resources/plane-min.png'),
        markerWidth: 30,
        markerHeight: 30,
        markerOpacity: 1
    }
});

module.exports = {
    data: [marker],
    view: {
        center: [0, 0],
        zoom: 6,
        pitch: 20
    }
};
