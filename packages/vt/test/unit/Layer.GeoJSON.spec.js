const maptalks = require('maptalks');
const assert = require('assert');
const { GeoJSONVectorTileLayer } = require('../../dist/maptalks.vt.js');
// const deepEqual = require('fast-deep-equal');

const points = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [114.25814, 30.58595] }, properties: { type: 1 } }
    ]
};

describe('GeoJSONVectorTileLayer', () => {
    let map, container;
    beforeEach(() => {
        container = document.createElement('div');
        container.style.width = '400px';
        container.style.height = '300px';
        document.body.appendChild(container);
        map = new maptalks.Map(container, {
            center: [114.25814, 30.58595],
            zoom: 19
        });
    });

    afterEach(() => {
        map.remove();
        document.body.removeChild(container);
    });

    it('should stringify input geojson data', () => {
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: points
        }).addTo(map);
        const target = JSON.parse(JSON.stringify(points));
        target.features.forEach((f, index) => {
            f.id = index;
        });
        assert.ok(layer.options.data === JSON.stringify(target));
        assert.ok(points.features[0].id === undefined);
    });

    it('should fire workerready event', (done) => {
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: points
        }).addTo(map);
        layer.on('workerready', e => {
            assert.ok(e);
            done();
        });
    });
});
