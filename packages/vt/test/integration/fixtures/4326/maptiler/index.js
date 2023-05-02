const { VectorTileLayer } = require('../../../../../dist/maptalks.vt.js');

module.exports = {
    tileSize: 512,
    tileSystem: [1, -1, -180, 90],
    spatialReference: 'preset-maptiler-4326',
    urlTemplate: 'http://localhost:4398/maptiler/{z}/{x}/{y}.pbf',
    view: {
        center: [0, 0],
        zoom: 1,
        spatialReference: {
            projection: 'EPSG:4326'
        }
    },
    ctor: VectorTileLayer,
    containerWidth: 512,
    containerHeight: 512
};
