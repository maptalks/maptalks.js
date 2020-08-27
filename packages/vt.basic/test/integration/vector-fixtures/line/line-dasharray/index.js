const maptalks = require('maptalks');

const line = new maptalks.LineString([[-1.5, 0], [1.5, 0]], {
    symbol: {
        lineWidth: 8,
        lineColor: '#f00',
        lineDasharray: [10, 10],
        lineDashColor: '#000'
    }
});

module.exports = {
    data: [line],
    view: {
        center: [0, 0],
        zoom: 6
    }
};
