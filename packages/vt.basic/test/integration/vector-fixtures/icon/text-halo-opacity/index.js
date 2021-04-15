const maptalks = require('maptalks');

const marker = new maptalks.Marker([0, 0], {
    symbol: {
        textName: '{name}',
        textSize: 30,
        textHaloRadius: 3,
        textHaloFill: '#f00',
        textHaloOpacity: 0.3
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
    }
};
