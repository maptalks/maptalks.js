const path = require('path');
const maptalks = require('maptalks');

const marker = new maptalks.Marker([0, 0], {
    symbol: {
        markerFile: 'file://' + path.resolve(__dirname, '../../../resources/plane-min.png'),
        markerWidth: {
            stops: [[1, 2], [20, 40]]
        },
        markerHeight: {
            stops: [[1, 2], [20, 40]]
        },
        markerOpacity: {
            stops: [[1, 1], [20, 0]]
        }
    }
});

module.exports = {
    data: [marker],
    view: {
        center: [0, 0],
        zoom: 6
    }
};
