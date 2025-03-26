//https://github.com/maptalks/issues/issues/827
const { VectorTileLayer } = require('../../../../../dist/maptalks.vt.js');

module.exports = {
    urlTemplate: 'http://localhost:4398/827/{z}/{x}/{y}.pbf',
    style: `http://localhost:4398/827/style.json`,
    view: {
        center: [121.47949936813461, 31.231718721727287],
        zoom: 15
    },
    renderingCount: 12,
    ctor: VectorTileLayer,
    containerWidth: 512,
    containerHeight: 512,
    // debug:true
};
