const maptalks = require('maptalks');

const polygon = new maptalks.Polygon([
    [0, 0], [1, 0], [1, 1], [0, 1], [0, 0]
], {
    symbol: {
        polygonFill: {
            stops: [[1, '#0f0'], [20, '#f00']]
        },
        polygonOpacity: {
            stops: [[1, 0.5], [20, 0.1]]
        }
    }
});

module.exports = {
    data: [polygon],
    view: {
        center: [0, 0],
        zoom: 6
    }
};
