const maptalks = require('maptalks');
const path = require('path');

const line = new maptalks.LineString([[0, 0], [1, 0]], {
    symbol: {
        markerFile: 'file://' + path.resolve(__dirname, '../../../resources/plane-min.png'),
        markerVerticalAlignment: 'middle',
        markerWidth: 30,
        markerHeight: 30,
        markerOpacity: 1,
        textName: 'hello',
        textSize: 14,
        textDy: 30,
        lineColor: '#f00',
        lineWidth: 20,
        lineOpacity: 0.4
    }
});

module.exports = {
    data: [line],
    // renderingCount: 2,
    view: {
        center: [0, 0],
        zoom: 6
    }
};
