const maptalks = require('maptalks');

const marker = new maptalks.Marker([0, 0], {
    symbol: {
        textName: '{name}',
        textSize: 30,
        textHaloRadius: 1,
        textHaloFill: '#f00',
        textOpacity: 1,
        textPitchAlignment: 'map',
        textRotationAlignment: 'map'
    },
    properties: {
        name: 'test'
    }
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
        zoom: 6,
        pitch: 30,
        bearing: 60
    }
};
