const maptalks = require('maptalks');
const options = require('../options.js');

const polygon = new maptalks.Polygon([
    [0, 0], [1, 0], [1, 1], [0, 1], [0, 0]
], {
    symbol: {
        polygonFill: '#f00',
        polygonOpacity: 0.4
    }
});

module.exports = Object.assign({}, JSON.parse(JSON.stringify(options)), {
    data: [polygon]
});

