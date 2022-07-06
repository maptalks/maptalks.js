const maptalks = require('maptalks');

const line = new maptalks.LineString([[0, 1], [1, 1]], {
    symbol: {
        lineGradientProperty: 'gradients',
        lineWidth: 20,
    },
    properties: {
        gradients: [0, 'red', 0.7, 'yellow', 1, 'green']
    }
});

const line1 = new maptalks.LineString([[-0.5, 1], [0.5, 1]], {
    symbol: [
        {
            lineWidth: 20,
            lineColor: '#000'
        },
        {
            markerType: 'ellipse',
            markerWidth: 10,
            markerHeight: 10,
        }
    ]
});

module.exports = {
    data: [line, line1],
    view: {
        center: [0, 0],
        zoom: 6
    }
};
