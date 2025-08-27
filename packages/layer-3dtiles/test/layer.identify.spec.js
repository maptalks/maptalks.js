const maptalks = require('maptalks');
require('@maptalks/gl');
require('@maptalks/transcoders.draco');
require('@maptalks/transcoders.ktx2');
require('@maptalks/transcoders.crn');
const { Geo3DTilesLayer } = require('../dist/maptalks.3dtiles');
const assert = require('assert');
const startServer = require('./server.js');

const PORT = 39887;
describe('3dtiles identify specs', () => {
    let container, map;
    let server;
    before(done => {
        server = startServer(PORT, done);
    });

    after(() => {
        server.close();
    });

    function createMap(center) {
        const option = {
            zoom: 17,
            center: center || [0, 0],
            devicePixelRatio: 1
        };
        map = new maptalks.Map(container, option);

    }

    beforeEach(() => {
        container = document.createElement('div');
        container.style.width = '800px';
        container.style.height = '600px';
        document.body.appendChild(container);
        createMap();
    });

    afterEach(() => {
        map.remove();
        document.body.innerHTML = '';
    });

    it('can identify b3dm data', done => {
        const resPath = 'Cesium3DTiles/Batched/BatchedWithBatchTable';
        const layer = new Geo3DTilesLayer('3d-tiles', {
            services: [{
                url : `http://localhost:${PORT}/integration/fixtures/${resPath}/tileset.json`,
                shader: 'pbr',
                opacity: 1
            }]
        });
        layer.on('loadtileset', () => {
            const extent = layer.getExtent(0);
            map.fitExtent(extent, 0, { animation: false });
        });

        layer.once('canvasisdirty', () => {
            setTimeout(() => {
                const hits = layer.identify([-75.6123142489637, 40.042239032448684]);
                assert(hits[0].data.batchId === 8);
                assert(hits[0].coordinate[0] !== 0);
                done();
            }, 500);
        });

        layer.addTo(map);
    }).timeout(5000);

    it('can identify i3dm data', done => {
        const resPath = 'Cesium3DTiles/Instanced/InstancedWithBatchIds';
        const layer = new Geo3DTilesLayer('3d-tiles', {
            services: [{
                url : `http://localhost:${PORT}/integration/fixtures/${resPath}/tileset.json`,
                shader: 'pbr',
                opacity: 1
            }]
        });
        layer.on('loadtileset', () => {
            const extent = layer.getExtent(0);
            map.fitExtent(extent, 0, { animation: false });
        });
        layer.addTo(map);
        setTimeout(() => {
            const hits = layer.identify([-75.61309745399603, 40.042169210140145]);
            assert(hits[0].data.batchId === 5);
            assert(hits[0].data.Height === 20);
            assert(hits[0].coordinate[0] !== 0);
            done();
        }, 1000);
    });

    it('can identify batched pnts data', done => {
        const resPath = 'Cesium3DTiles/PointCloud/PointCloudConstantColor';
        const layer = new Geo3DTilesLayer('3d-tiles', {
            services: [{
                url : `http://localhost:${PORT}/integration/fixtures/${resPath}/tileset.json`,
                pointSize: 12,
                opacity: 1
            }]
        });
        layer.on('loadtileset', () => {
            const extent = layer.getExtent(0);
            map.fitExtent(extent, 0, { animation: false });
        });
        layer.addTo(map);
        setTimeout(() => {
            const hits = layer.identify([-75.61209122255298, 40.04252824941395]);
            assert(hits[0].coordinate[0] !== 0);
            done();
        }, 1000);
    });

    it('can identify pnts data with properties', done => {
        const resPath = 'Cesium3DTiles/PointCloud/PointCloudWithPerPointProperties';
        const layer = new Geo3DTilesLayer('3d-tiles', {
            services: [{
                url : `http://localhost:${PORT}/integration/fixtures/${resPath}/tileset.json`,
                pointSize: 12,
                opacity: 1
            }]
        });
        layer.on('loadtileset', () => {
            const extent = layer.getExtent(0);
            map.fitExtent(extent, 0, { animation: false });
        });
        layer.addTo(map);
        setTimeout(() => {
            const hits = layer.identify([-75.61209061982572, 40.042528301338535]);
            assert(hits[0].data.batchId > 0);
            assert(hits[0].coordinate[0] !== 0);
            done();
        }, 1000);
    });


});
