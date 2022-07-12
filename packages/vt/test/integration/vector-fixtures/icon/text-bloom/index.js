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

module.exports = {
    data: [marker],
    view: {
        center: [0, 0],
        zoom: 6
    },
    options: {
        enableBloom: true
    }
};
