const path = require('path');
const maptalks = require('maptalks');

const line = new maptalks.LineString([[0, 0], [1, 0]], {
    symbol: {
        linePatternFile: 'file://' + path.resolve(__dirname, '../../../resources/plane-min.png'),
        lineWidth: 20
    }
});

module.exports = {
    data: [line],
    view: {
        center: [0, 0],
        zoom: 6
    }
};
