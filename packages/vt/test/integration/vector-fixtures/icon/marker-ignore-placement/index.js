const path = require('path');
const maptalks = require('maptalks');

const marker = new maptalks.Marker([0, 0], {
    symbol: {
        markerFile: 'file://' + path.resolve(__dirname, '../../../resources/plane-min.png'),
        markerWidth: 30,
        markerHeight: 30,
        markerOpacity: 1,
        markerRotation: 30
    }
});

const marker2 = new maptalks.Marker([0, 0], {
    symbol: {
        markerFile: 'file://' + path.resolve(__dirname, '../../../resources/plane-min.png'),
        markerWidth: 30,
        markerHeight: 30,
        markerOpacity: 1,
        markerIgnorePlacement: 1
    }
});


module.exports = {
    data: [marker, marker2],
    view: {
        center: [0, 0],
        zoom: 6
    },
    options: {
        collision: true,
        debugCollision: true,
        sceneConfig: {
            collision: true,
            fading: false
        }
    }
};
