const maptalks = require('maptalks');

const marker = new maptalks.Marker([0, 0], {
    symbol: {
        markerType: 'ellipse',
        markerVerticalAlignment: 'middle',
        markerWidth: 300,
        markerHeight: 300,
        markerOpacity: 1
    }
});

module.exports = {
    data: [marker],
    containerHeight: 512,
    containerWidth: 512,
    view: {
        center: [0, 0],
        zoom: 6
    }
};
