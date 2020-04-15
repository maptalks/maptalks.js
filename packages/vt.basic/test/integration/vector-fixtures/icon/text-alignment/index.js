const maptalks = require('maptalks');

const marker = new maptalks.Marker([0, 0], {
    symbol: {
        textName: '{name}',
        textFill: '#f00',
        textSize: 30,
        textHorizontalAlignment: 'left',
        textVerticalAlignment: 'top'
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
        textHorizontalAlignment: 'right',
        textVerticalAlignment: 'bottom'
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
