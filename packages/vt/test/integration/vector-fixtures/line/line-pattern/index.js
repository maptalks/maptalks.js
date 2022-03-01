const path = require('path');
const maptalks = require('maptalks');

const line0 = new maptalks.LineString([[0, 0], [1, 0]], {
    symbol: {
        linePatternFile: 'file://' + path.resolve(__dirname, '../../../resources/1.png'),
        linePatternGap: 1.5,
        lineWidth: 20
    }
});

const line1 = new maptalks.LineString([[0, 1], [1, 1]], {
    symbol: {
        linePatternFile: 'file://' + path.resolve(__dirname, '../../../resources/avatar.jpg'),
        lineWidth: 20
    }
});

module.exports = {
    data: [line0, line1],
    view: {
        center: [0, 0],
        zoom: 6
    }
};
