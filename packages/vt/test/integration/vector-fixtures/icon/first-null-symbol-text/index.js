const maptalks = require('maptalks');

const marker = new maptalks.Marker([0, 0], {
    symbol: [
        null,
        {
            textName: '{name}',
            textSize: 20,
            textFill: '#f00',
            textOpacity: {
                stops: [[1, 1], [20, 0.1]]
            }
        }
    ],
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
