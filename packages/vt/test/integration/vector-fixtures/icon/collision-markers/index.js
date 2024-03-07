const path = require('path');
const maptalks = require('maptalks');

const marker1 = new maptalks.Marker([0, 0], {
    symbol: {
        markerFile: 'file://' + path.resolve(__dirname, '../../../resources/plane-min.png'),
        markerWidth: 30,
        markerHeight: 30,
        markerOpacity: 1,
        markerPitchAlignment: 'map',
        markerRotationAlignment: 'map'
    }
});

const marker2 = new maptalks.Marker([0, 0.2], {
    symbol: {
        markerFile: 'file://' + path.resolve(__dirname, '../../../resources/plane-min.png'),
        markerWidth: 30,
        markerHeight: 30,
        markerOpacity: 1
    }
});

module.exports = {
    data: [marker2, marker1],
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
        pitch: 30,
        bearing: 60
    }
};
