const path = require('path');
const maptalks = require('maptalks');

const line0 = new maptalks.LineString([[490138.785, 4321477.599], [490104.3528, 4321476.7675], [490102.151, 4321530.0699]], {
    symbol: {
        linePatternFile: 'file://' + path.resolve(__dirname, './arrow_left.png'),
        lineWidth: 12
    }
});

module.exports = {
    data: [line0],
    view: {
        center: [490109.53644895, 4321482.87806956],
        zoom: 9.3,
        spatialReference: {
          projection: "identity",
          fullExtent: {
            top: 0,
            left: 0,
            bottom: 0,
            right: 1,
          },
        },
    }
};
