const path = require('path');
const maptalks = require('maptalks');

const polygon0 = new maptalks.Polygon([
    [0, 0], [1, 0], [1, 1], [0, 1], [0, 0]
], {
    symbol: {
        polygonPatternFile: 'file://' + path.resolve(__dirname, '../../../resources/1.png'),
        polygonOpacity: 1
    }
});

const polygon1 = new maptalks.Polygon([
    [1, 1], [2, 1], [2, 2], [1, 2], [1, 1]
], {
    symbol: {
        polygonPatternFile: 'file://' + path.resolve(__dirname, '../../../resources/avatar.jpg'),
        polygonOpacity: 1
    }
});

module.exports = {
    data: [polygon0, polygon1],
    view: {
        center: [1, 1],
        zoom: 6
    },
};
