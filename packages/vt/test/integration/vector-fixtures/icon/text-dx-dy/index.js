const maptalks = require('maptalks');

const marker = new maptalks.Marker([0, 0], {
    symbol: {
        textName: 'test',
        textSize: 18,
        textDx: {
            stops: [[2, 10], [20, 10]]
        },
        textDy: {
            stops: [[2, 20], [20, 20]]
        }
    }
});

module.exports = {
    data: [marker],
    view: {
        center: [0, 0],
        zoom: 6
    }
};
