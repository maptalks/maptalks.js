const maptalks = require('maptalks');

const line = new maptalks.LineString([[-0.5, 1, 1000], [0.5, 1, 1000]], {
    symbol: {
        lineWidth: 20,
        lineColor: '#000'
    }
});

module.exports = {
    data: [line],
    view: {
        center: [0, 0],
        zoom: 6
    }
};
