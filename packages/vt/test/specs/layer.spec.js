const assert = require('assert');
const maptalks = require('maptalks');
const { GeoJSONVectorTileLayer, VectorTileLayer } = require('../../dist/maptalks.vt.js');


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
                levels: 3000,
                foo: 'bar'
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

    it('getRenderedFeatures()', done => {
        map = new maptalks.Map(container, DEFAULT_VIEW);
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: polygon,
            features: true
        });
        let count = 0;
        layer.on('canvasisdirty', () => {
            count++;
            if (count === 2) {
                const rendredFeatures = layer.getRenderedFeatures();
                assert(rendredFeatures.length > 0);
                assert(rendredFeatures[0].current);
                const featureCount = rendredFeatures.reduce((count, currentValue) => count + currentValue.features.length, 0);
                assert(featureCount > 0);
                done();
            }
        });
        layer.addTo(map);
    });

    it('getRenderedFeaturesAsync()', done => {
        map = new maptalks.Map(container, DEFAULT_VIEW);
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: polygon,
            features: true
        });
        let count = 0;
        layer.on('canvasisdirty', () => {
            count++;
            if (count === 2) {
                layer.getRenderedFeaturesAsync().then(rendredFeatures => {
                    assert(rendredFeatures.length > 0);
                    assert(rendredFeatures[0].current);
                    const featureCount = rendredFeatures.reduce((count, currentValue) => count + currentValue.features.length, 0);
                    assert(featureCount > 0);
                    done();
                })
            }
        });
        layer.addTo(map);
    });

    it('transient features', done => {
        map = new maptalks.Map(container, DEFAULT_VIEW);
        const layer = new GeoJSONVectorTileLayer('gvt', {
            features: 'transient',
            data: polygon,
            style: [
                {
                    filter: true,
                    renderPlugin: {
                        type: 'fill',
                        dataConfig: {
                            type: 'fill'
                        }
                    },
                    symbol: {
                        polygonFill: '#f00',
                        polygonOpacity: {
                            type: 'interval',
                            property: 'levels',
                            stops: [
                                [0, 1],
                                [200, 1]
                            ]
                        }
                    }
                }
            ]
        });
        let hasFeatures = false;
        let hit = false;
        layer.on('tileload', e => {
            if (!hasFeatures && e.tileImage && e.tileImage.features) {
                hasFeatures = true;
                assert(e.tileImage.features.length > 0);
            }
        })
        layer.on('_transientfeature', e => {
            if (!hit) {
                assert(hasFeatures);
                hit = true;
                const feature = e.tileImage.data[0].features[0].feature;
                // 保存了fn-type所需要的properties
                assert(feature.properties['__original_properties'].levels === 3000);
                assert(feature.properties['__original_properties'].foo === undefined);
                done();
            }

        });
        layer.addTo(map);
    });
});
