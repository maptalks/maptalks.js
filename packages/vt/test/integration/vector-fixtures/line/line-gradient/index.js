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
    symbol: {
        lineWidth: 20,
        lineColor: '#000'
    }
});

const line2 = new maptalks.LineString([[0, 0.5], [1, 0.5]], {
    symbol: {
        lineGradientProperty: 'gradients',
        lineWidth: 20,
    },
    properties: {
        gradients: [0, 'red', 0.1, 'yellow', 1, 'green']
    }
});

const line3 = new maptalks.LineString([[0, 0], [1, 0]], {
    symbol: {
        lineGradientProperty: 'gradients',
        lineWidth: 20,
    },
    properties: {
        gradients: [0, 'red', 0.5, 'yellow', 1, 'green']
    }
});

module.exports = {
    data: [line, line1, line2, line3],
    view: {
        center: [0, 0],
        zoom: 6
    }
};
