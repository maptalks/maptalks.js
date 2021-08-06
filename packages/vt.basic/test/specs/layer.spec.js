const assert = require('assert');
const maptalks = require('maptalks');
const { GeoJSONVectorTileLayer, VectorTileLayer } = require('@maptalks/vt');
require('../../dist/maptalks.vt.basic');

const DEFAULT_VIEW = {
    center: [0, 0],
    zoom: 1,
    pitch: 0,
    bearing: 0,
    attribution: false,
    lights: {
        ambient: {
            color: [0.1, 0.1, 0.1]
        },
        directional: {
            color: [0.1, 0.1, 0.1],
            direction: [1, 0, -1],
        }
    }
};


const polygon = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [
                    [
                        [-1., 1.0],
                        [1., 1.0],
                        [1., -1.0],
                        [-1., -1],
                        [-1., 1]
                    ],
                    [
                        [-0.5, 0.5],
                        [0.5, 0.5],
                        [0.5, -0.5],
                        [-0.5, -0.5],
                        [-0.5, 0.5]
                    ]
                ]
            },
            properties: {
                levels: 3000
            }
        }
    ]
};

describe('layer related specs', () => {
    let container, map;
    before(() => {
        container = document.createElement('div');
        container.style.width = '1024px';
        container.style.height = '1024px';
        document.body.appendChild(container);
    });

    beforeEach(() => {

    });

    afterEach(() => {
        map.remove();
    });

    it('valid cached tile data', done => {
        map = new maptalks.Map(container, DEFAULT_VIEW);
        map.setZoom(1);
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: polygon
        });
        layer.once('datareceived', () => {
            // const renderer = layer.getRenderer();
            // const tileId0 = layer._getTileId(0, 1, 1);
            // const tileId1 = layer._getTileId(1, 0, 1);
            // const data0 = renderer._getCachedTile(tileId0);
            // const data1 = renderer._getCachedTile(tileId1);
            // assert(Array.isArray(data0.image.data));
            // assert(data0.image.data.length === 1);
            // assert(Array.isArray(data1.image.data));
            // assert(data1.image.data.length === 1);
            done();
        });
        layer.addTo(map);
        // done();
    });

    it('loading 4326 projection tiles', () => {
        map = new maptalks.Map(container, {
            center: [0, 0],
            zoom: 3,
            spatialReference: {
                projection: 'EPSG:4326'
            }
        });

        const MAX_ZOOM = 25;
        const layer = new VectorTileLayer('vt', {
            urlTemplate: '#',
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
                    for (let i = 0; i < MAX_ZOOM; i++) {
                        resolutions[i] = 180 / 4 / (Math.pow(2, i) * 128);
                    }
                    return resolutions;
                })()
            }
        }).addTo(map);
        const tileGrid = layer.getTiles().tileGrids[0];
        const tiles = tileGrid.tiles;
        const extent = tileGrid.extent;
        assert.deepEqual(extent.toJSON(), { xmin: -1024, ymin: -512, xmax: 1024, ymax: 512 });
        const expected = '0,0,1,{"xmin":-1024,"ymin":0,"xmax":-512,"ymax":512}|0,1,1,{"xmin":-1024,"ymin":-512,"xmax":-512,"ymax":0}|1,0,1,{"xmin":-512,"ymin":0,"xmax":0,"ymax":512}|1,1,1,{"xmin":-512,"ymin":-512,"xmax":0,"ymax":0}|2,0,1,{"xmin":0,"ymin":0,"xmax":512,"ymax":512}|2,1,1,{"xmin":0,"ymin":-512,"xmax":512,"ymax":0}|3,0,1,{"xmin":512,"ymin":0,"xmax":1024,"ymax":512}|3,1,1,{"xmin":512,"ymin":-512,"xmax":1024,"ymax":0}';
        const actual = tiles.map(function (t) {
            return [t.idx, t.idy, t.z, JSON.stringify(t.extent2d.toJSON())].join();
        }).sort().join('|');
        assert.equal(actual, expected);
    });
});
