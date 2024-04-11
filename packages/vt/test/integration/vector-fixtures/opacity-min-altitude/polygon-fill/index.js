const maptalks = require('maptalks');

const polygon = new maptalks.Polygon([
    [0, 0], [1, 0], [1, 1], [0, 1], [0, 0]
], {
    symbol: {
        polygonFill: '#f00',
        polygonOpacity: 1
    }
});

module.exports = {
    data: [polygon],
    view: {
        center: [0, 0],
        zoom: 6
    },
    layerClass: 'PolygonLayer'
};
