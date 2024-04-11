const path = require('path');
const maptalks = require('maptalks');

const line = new maptalks.LineString([[-1.5, 0], [1.5, 0]], {
    symbol: {
        lineWidth: 8,
        lineColor: '#f00',
        lineDasharray: [10, 10],
        lineDashColor: '#000'
    }
});

const line2 = new maptalks.LineString([[-1.5, -0.3], [1.5, -0.3]], {
    symbol: {
        lineWidth: 8,
        lineColor: '#f00',
    }
});

const line3 = new maptalks.LineString([[-1.5, -0.6], [1.5, -0.6]], {
    symbol: {
        lineWidth: 8,
        lineColor: '#f00',
        linePatternFile: 'file://' + path.resolve(__dirname, '../../../resources/black.png'),
        linePatternAnimSpeed: 0.001
    }
});

const line4 = new maptalks.LineString([[-1.5, -0.9], [1.5, -0.9]], {
    symbol: {
        lineWidth: 8,
        lineColor: '#f00',
        linePatternFile: 'file://' + path.resolve(__dirname, '../../../resources/black.png'),
        linePatternAnimSpeed: 0
    }
});

module.exports = {
    data: [line, line2, line3, line4],
    view: {
        center: [0, 0],
        zoom: 6
    }
};
