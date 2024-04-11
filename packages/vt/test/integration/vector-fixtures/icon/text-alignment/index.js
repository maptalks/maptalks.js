const maptalks = require('maptalks');

const marker = new maptalks.Marker([0, 0], {
    symbol: {
        textName: '{name}',
        textFill: [1, 0, 0, 1],
        textSize: 18,
        textHorizontalAlignment: 'left',
        textVerticalAlignment: 'top'
    },
    properties: {
        name: 'left-top'
    }
});

const marker2 = new maptalks.Marker([0, 0.2], {
    symbol: {
        textName: '{name}',
        textSize: 18,
        textFill: '#0f0',
        textHorizontalAlignment: 'right',
        textVerticalAlignment: 'bottom'
    },
    properties: {
        name: 'right-bottom'
    }
});

module.exports = {
    data: [marker, marker2],
    view: {
        center: [0, 0],
        zoom: 6
    }
};
