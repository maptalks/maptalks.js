const maptalks = require('maptalks');

const line = new maptalks.MultiLineString([
    [[0, 0], [1, 0]],
    [[0, 1], [1, 1]]
], {
    symbol: {
        lineColor: '#f00',
        lineWidth: 20,
        lineOpacity: 0.4
    }
});

module.exports = {
    data: [line],
    view: {
        center: [0, 0],
        zoom: 6
    }
};
