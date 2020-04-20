const maptalks = require('maptalks');

const line = new maptalks.LineString([[0, 0], [1, 0]]);

module.exports = {
    data: [line],
    view: {
        center: [0, 0],
        zoom: 6
    }
};
