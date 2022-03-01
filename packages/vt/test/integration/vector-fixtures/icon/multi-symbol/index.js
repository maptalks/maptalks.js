const path = require('path');
const maptalks = require('maptalks');

const marker = new maptalks.Marker([0, 0], {
    symbol: [
        {
            'markerFile': 'file://' + path.resolve(__dirname, '../../../resources/avatar.jpg'),
            'markerWidth': 29,
            'markerHeight': 29,
            'markerDy': -20
        },
        {
            'markerFile': 'file://' + path.resolve(__dirname, '../../../resources/marker.png'),
            'markerWidth': 41,
            'markerHeight': 58
        }
    ]
});

module.exports = {
    data: [marker],
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
