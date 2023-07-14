const maptalks = require('maptalks');

const line = new maptalks.LineString([[0, 0], [1, 0]], {
    symbol: {
        lineColor: {
            stops: [[1, '#0f0'], [20, '#f00']]
        },
        lineWidth: {
            stops: [[1, 20], [20, 20]]
        },
        lineOpacity: {
            stops: [[1, 0.5], [20, 0.1]]
        }
    }
});

module.exports = {
    data: [line],
    view: {
        center: [0, 0],
        zoom: 6
    },
    options: {
        enableBloom: true
    }
};
