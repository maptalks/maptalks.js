const maptalks = require('maptalks');

const line = new maptalks.LineString([[0, 0], [1, 0]], {
    symbol: {
        lineColor: '#f00',
        lineWidth: 20,
        lineOpacity: 1,
        lineDasharray: [0, 0, 0, 0]
    }
});

module.exports = {
    data: [line],
    layerClass: 'LineStringLayer',
    view: {
        center: [0, 0],
        zoom: 6
    }
};
