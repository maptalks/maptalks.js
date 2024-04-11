const maptalks = require('maptalks');

const multiPolygon = new maptalks.MultiPolygon([
    [
        [
            [0, 0], [1, 0], [1, 1], [0, 1], [0, 0]
        ]
    ],
    [
        [
            [-1, -1], [0, -1], [0, 0], [-1, 0], [-1, -1]
        ]
    ],

]);

module.exports = {
    data: [multiPolygon],
    view: {
        center: [0, 0],
        zoom: 6
    }
};
