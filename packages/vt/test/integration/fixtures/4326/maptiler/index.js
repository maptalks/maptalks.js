const { VectorTileLayer } = require('../../../../../dist/maptalks.vt.js');

module.exports = {
    tileSize: 512,
    tileSystem: [1, -1, -180, 90],
    spatialReference: {
        projection: 'EPSG:4326',
        fullExtent: {
            'top': 90,
            'left': -180,
            'bottom': -90,
            'right': 180
        },
        resolutions: (function () {
            const resolutions = [];
            for (let i = 0; i < 25; i++) {
                resolutions[i] = 180 / 4 / (Math.pow(2, i) * 128);
            }
            return resolutions;
        })()
    },
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
