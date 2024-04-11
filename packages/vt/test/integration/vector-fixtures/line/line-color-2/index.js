const maptalks = require('maptalks');

const line = new maptalks.LineString([[0, 0], [1, 0]], {
    symbol: {
        lineColor: [0, 1, 0, 1],
        lineWidth: 10,
        lineStrokeWidth: 10,
        lineStrokeColor: '#f00'
    }
});

module.exports = {
    data: [line],
    view: {
        center: [0, 0],
        zoom: 6
    }
};
