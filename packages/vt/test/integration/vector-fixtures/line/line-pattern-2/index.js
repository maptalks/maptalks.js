const path = require('path');
const maptalks = require('maptalks');

const line = new maptalks.LineString(
  [[108.91773655933662,34.27827298621307],[108.91792644128077,34.27824762908662],[108.91814500410806,34.27824425278797]],
  {
    symbol: {
      'linePatternFile': 'file://' + path.resolve(__dirname, './pattern.png'),
      'lineWidth': 10
    }
  }
);

module.exports = {
    data: [line],
    view: {
        center: [108.91792644128077,34.27824762908662],
        zoom: 18
    }
};
