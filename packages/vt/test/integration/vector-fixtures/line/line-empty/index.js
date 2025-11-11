const maptalks = require('maptalks');

const line = new maptalks.LineString([], {
    symbol: {
        lineColor: '#f00',
        lineWidth: 20,
        lineOpacity: 0.4,
        lineDasharray: [0, 0, 0, 0]
    }
});

module.exports = {
    data: [line],
    view: {
        center: [0, 0],
        zoom: 6
    }
};
