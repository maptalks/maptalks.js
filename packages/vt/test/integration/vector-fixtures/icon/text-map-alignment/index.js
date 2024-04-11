const maptalks = require('maptalks');

const marker = new maptalks.Marker([0, 0], {
    symbol: {
        textName: '{name}',
        textFill: '#f00',
        textSize: 30,
        textPitchAlignment: 'map',
        textRotationAlignment: 'map'
    },
    properties: {
        name: 'test'
    }
});

const marker2 = new maptalks.Marker([0, 0.2], {
    symbol: {
        textName: '{name}',
        textSize: 30,
        textFill: '#0f0'
    },
    properties: {
        name: 'test'
    }
});

module.exports = {
    data: [marker2, marker],
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
        bearing: 60,
        pitch: 60
    }
};
