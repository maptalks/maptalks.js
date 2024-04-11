const maptalks = require('maptalks');

const line = new maptalks.LineString([[0, 0], [1, 0]], {
    symbol: [
        null,
        {
            lineColor: '#f00',
            lineWidth: 20,
            lineOpacity: 0.4,
            lineDasharray: [0, 0, 0, 0]
        }
    ]
});

module.exports = {
    data: [line],
    view: {
        center: [0, 0],
        zoom: 6
    }
};
