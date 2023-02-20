const maptalks = require('maptalks');

const polygon = new maptalks.Polygon([
    [0, 0], [1, 0], [1, 1], [0, 1], [0, 0]
], {
    symbol: {
        polygonFill: 'rgba(255, 0, 0, 0.8)',
        lineWidth: 2,
        lineColor: '#34495e'
    }
});

module.exports = {
    data: [polygon],
    view: {
        center: [0, 0],
        zoom: 6
    }
};
