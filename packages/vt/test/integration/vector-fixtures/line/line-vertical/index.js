const maptalks = require('maptalks');

const line = new maptalks.LineString([[0, 0, 0], [0, 0, 40000]], {
    symbol: {
        lineColor: '#f00',
        lineWidth: 20
    }
});

module.exports = {
    data: [line],
    view: {
        center: [0, 0],
        zoom: 6,
        bearing: 90,
        pitch: 40
    }
};
