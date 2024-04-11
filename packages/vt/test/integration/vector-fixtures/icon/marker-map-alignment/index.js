const path = require('path');
const maptalks = require('maptalks');

const marker1 = new maptalks.Marker([0, 0], {
    symbol: {
        markerFile: 'file://' + path.resolve(__dirname, '../../../resources/plane-min.png'),
        markerWidth: 60,
        markerHeight: 60,
        markerOpacity: 1,
        markerPitchAlignment: 'map',
        markerRotationAlignment: 'map'
    }
});

module.exports = {
    data: [marker1],
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
        zoom: 6,
        pitch: 60,
        bearing: 45
    }
};
