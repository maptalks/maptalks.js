const maptalks = require('maptalks');
const options = require('../options.js');

const polygon = new maptalks.MultiPolygon([
    [
        [0, 0], [1, 0], [1, 1], [0, 1], [0, 0],
        [0.3, 0.3], [0.3, 0.7], [0.7, 0.7], [0.7, 0.3], [0.3, 0.3],
    ],
    [
        [0, -1.5], [1, -1.5], [1, -0.5], [0, -0.5], [0, -1.5]
    ]
], {
    symbol: {
        polygonFill: '#f00'
    },
    properties: {
        height: 20000
    }
});

module.exports = Object.assign({}, JSON.parse(JSON.stringify(options)), {
    data: [polygon]
});
