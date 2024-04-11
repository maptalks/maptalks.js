const maptalks = require('maptalks');

const line0 = new maptalks.LineString([[-1.5, 0], [1.5, 0]], {
    symbol: {
        lineWidth: 8,
        lineColor: '#f00',
        lineDasharray: [10, 10],
        lineDashColor: '#000'
    }
});

const line1 = new maptalks.LineString([[-1.5, 1], [1.5, 1]], {
    symbol: {
        lineWidth: 8,
        lineColor: '#f00'
    }
});

module.exports = {
    data: [line0, line1],
    view: {
        center: [0, 0],
        zoom: 6
    }
};
