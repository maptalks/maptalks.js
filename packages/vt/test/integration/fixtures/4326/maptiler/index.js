const { VectorTileLayer } = require('../../../../../dist/maptalks.vt.js');

module.exports = {
    tileSize: 512,
    tms: true,
    urlTemplate: 'http://localhost:4398/maptiler/{z}/{x}/{y}.pbf',
    view: {
        center: [0, 0],
        zoom: 1,
        spatialReference: {
            projection: 'EPSG:4326'
        }
    },
    renderingCount: 20,
    ctor: VectorTileLayer,
    containerWidth: 512,
    containerHeight: 512
};
