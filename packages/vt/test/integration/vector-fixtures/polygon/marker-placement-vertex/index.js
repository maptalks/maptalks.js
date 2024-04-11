const maptalks = require('maptalks');

const polygon = new maptalks.Polygon([
    [0, 0], [1, 0], [1, 1], [0, 1], [0, 0]
], {
    symbol: {
        markerType: 'ellipse',
        markerWidth: 6,
        markerHeight: 6,
        markerPlacement: 'vertex'
    }
});

module.exports = {
    data: [polygon],
    view: {
        center: [0, 0],
        zoom: 6
    }
};
