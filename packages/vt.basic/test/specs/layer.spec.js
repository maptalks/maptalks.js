const assert = require('assert');
const maptalks = require('maptalks');
const { GeoJSONVectorTileLayer } = require('@maptalks/vt');
require('../../dist/maptalks.vt.basic');

const DEFAULT_VIEW = {
    center: [0, 0],
    zoom: 6,
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
        container.style.width = '512px';
        container.style.height = '512px';
        document.body.appendChild(container);
    });

    beforeEach(() => {
        map = new maptalks.Map(container, DEFAULT_VIEW);
    });

    afterEach(() => {
        map.remove();
    });

    it('valid cached tile data', done => {
        map.setZoom(1);
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: polygon
        });
        layer.on('datareceived', () => {
            const renderer = layer.getRenderer();
            const tileId0 = layer._getTileId(0, 0, 1);
            const tileId1 = layer._getTileId(1, 0, 1);
            const data0 = renderer._getCachedTile(tileId0);
            const data1 = renderer._getCachedTile(tileId1);
            assert(Array.isArray(data0.image.data));
            assert(data0.image.data.length === 1);
            assert(Array.isArray(data1.image.data));
            assert(data1.image.data.length === 1);
            done();
        });
        layer.addTo(map);
        // done();
    });
});
