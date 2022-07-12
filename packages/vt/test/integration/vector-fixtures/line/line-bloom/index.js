const maptalks = require('maptalks');

const line = new maptalks.LineString([[0, 0], [1, 0]], {
    symbol: {
        lineWidth: 4,
        lineColor: '#f00'
    }
});

module.exports = {
    data: [line],
    view: {
        center: [0, 0],
        zoom: 6
    },
    options: {
        enableBloom: true
    }
};
