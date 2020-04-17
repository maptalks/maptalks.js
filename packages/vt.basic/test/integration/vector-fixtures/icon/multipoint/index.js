const path = require('path');
const maptalks = require('maptalks');

const multiPoint = new maptalks.MultiPoint([[0, 0], [0, 0.2]], {
    symbol: {
        markerFile: 'file://' + path.resolve(__dirname, '../../../resources/plane-min.png'),
        markerWidth: 30,
        markerHeight: 30,
        markerOpacity: 1
    }
});

module.exports = {
    data: [multiPoint],
    options: {
        collision: true,
        debugCollision: true,
        sceneConfig: {
            collision: true,
            fading: false
        }
    },
    view: {
        center: [0, 0],
        zoom: 6
    }
};
