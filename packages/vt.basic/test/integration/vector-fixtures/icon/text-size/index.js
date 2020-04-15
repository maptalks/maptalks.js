const maptalks = require('maptalks');

const marker = new maptalks.Marker([0, 0], {
    symbol: {
        textName: '{name}',
        textSize: 30,
        textHaloRadius: 1,
        textHaloFill: '#f00'
    },
    properties: {
        name: 'test'
    }
});

const marker2 = new maptalks.Marker([0, 0.2], {
    symbol: {
        textName: '{name}',
        textSize: 15,
        textHaloRadius: 1,
        textHaloFill: '#0f0'
    },
    properties: {
        name: 'test'
    }
});

module.exports = {
    data: [marker, marker2],
    view: {
        center: [0, 0],
        zoom: 6
    }
};
