const maptalks = require('maptalks');

// maptalks/issues#452

const marker = new maptalks.Marker([0, 0], {
    symbol: {
        textName: '测\n试',
        textSize: {
            stops: [[0, 30], [20, 30]]
        },
        // textSize: 30,
        textFill: '#f00'
    }
});

module.exports = {
    data: [marker],
    view: {
        center: [0, 0],
        zoom: 6
    }
};
