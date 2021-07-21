const maptalks = require('maptalks');

const marker = new maptalks.Marker([0, 0], {
    symbol: {
        textName: '{name}',
        textSize: {
            stops: [[1, 20], [20, 2]]
        },
        textFill: {
            stops: [[1, '#f00'], [10, '#0f0']]
        },
        textOpacity: {
            stops: [[1, 1], [20, 0.1]]
        }
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
