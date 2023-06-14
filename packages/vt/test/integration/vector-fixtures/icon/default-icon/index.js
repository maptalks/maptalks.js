const path = require('path');
const maptalks = require('maptalks');

const marker = new maptalks.Marker([0, 0], {
    symbol: {
        markerFile: 'file://' + path.resolve(__dirname, '../../../resources/marker.png')
    }
});

module.exports = {
    data: [marker],
    view: {
        center: [0, 0],
        zoom: 6
    }
};
