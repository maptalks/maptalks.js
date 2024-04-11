const maptalks = require('maptalks');

const line = new maptalks.LineString([[0, 0, 0], [0, 0, 300]], {
    symbol: {
        lineColor: '#f00',
        lineWidth: 20
    }
});

module.exports = {
    data: [line],
    view: {
        center: [0, 0],
        zoom: 14,
        bearing: 90,
        pitch: 40
    }
};
