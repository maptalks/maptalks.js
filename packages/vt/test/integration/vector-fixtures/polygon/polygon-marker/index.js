const maptalks = require('maptalks');

const polygon = new maptalks.Polygon([
    [0, 0], [1, 0], [1, 1], [0, 1], [0, 0]
], {
    symbol: {
        markerType: 'ellipse',
        markerVerticalAlignment: 'middle',
        markerWidth: 30,
        markerHeight: 30,
        markerOpacity: 1,
        polygonFill: '#f00',
        polygonOpacity: 0.4
    }
});

module.exports = {
    data: [polygon],
    renderingCount: 1,
    view: {
        center: [0, 0],
        zoom: 6
    }
};
