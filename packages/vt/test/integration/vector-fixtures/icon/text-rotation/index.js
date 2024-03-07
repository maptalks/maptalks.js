const maptalks = require('maptalks');

const marker = new maptalks.Marker([0, 0], {
    symbol: {
        textName: '{name}',
        textFill: [1, 0, 0, 1],
        textSize: 30,
        textRotation: 60
    },
    properties: {
        name: 'test'
    }
});

const marker2 = new maptalks.Marker([0, 0.2], {
    symbol: {
        textName: '{name}',
        textSize: 30,
        textFill: '#0f0',
        textRotation: 10
    },
    properties: {
        name: 'test2'
    }
});

module.exports = {
    data: [marker2, marker],
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
