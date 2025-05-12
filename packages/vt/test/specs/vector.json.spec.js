const assert = require('assert');
const { readPixel } = require('../common/Util');
const maptalks = require('maptalks');
const { PointLayer, LineStringLayer, PolygonLayer } = require('../../dist/maptalks.vt.js');


const DEFAULT_VIEW = {
    center: [0, 0],
    zoom: 6,
    pitch: 0,
    bearing: 0,
    devicePixelRatio: 1,
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


describe('vector layers toJSON and fromJSON', () => {
    let container, map;
    before(() => {
        container = document.createElement('div');
        container.style.width = '128px';
        container.style.height = '128px';
        document.body.appendChild(container);
        // const canvas = document.createElement('canvas');
        // canvas.id = 'debug';
        // canvas.width = 128;
        // canvas.height = 128;
        // canvas.style.width = '128px';
        // canvas.style.height = '128px';
        // document.body.appendChild(canvas);
    });

    beforeEach(() => {
        map = new maptalks.Map(container, DEFAULT_VIEW);
    });

    afterEach(() => {
        map.remove();
    });

    it('should can PointLayer.toJSON', done => {
        const marker = new maptalks.Marker([0, 0], {
            symbol: {
                markerType: 'ellipse',
                markerFill: '#f00',
                markerWidth: 30,
                markerHeight: 30,
                markerVerticalAlignment: 'middle',
                markerOpacity: 1
            }
        });
        const style = [
            {
                filter: true,
                symbol: marker.getSymbol()
            }
        ];

        const layer = new PointLayer('vector', marker, {
            style
        });
        const json = layer.toJSON();
        assert(json.type === 'PointLayer');
        assert.deepEqual(json.geometries[0], marker.toJSON());
        assert.deepEqual(json.options.style, style);
        assert(json.id === 'vector');

        const layerCopied = PointLayer.fromJSON(json);
        assertChangeStyle(done, layerCopied, [255, 0, 0, 255]);
    });

    it('should can LineStringLayer.toJSON', done => {
        const lines = [
            new maptalks.LineString([[-1, 0], [1, 0]]),
            new maptalks.LineString([[-1, 1], [1, 1]]),
        ];
        const style = [
            {
                filter: true,
                symbol: {
                    lineColor: '#f00',
                    lineWidth: 20
                }
            }
        ];

        const layer = new LineStringLayer('vector', lines, {
            style
        });
        const json = layer.toJSON();
        assert(json.type === 'LineStringLayer');
        assert.deepEqual(json.geometries[0], lines[0].toJSON());
        assert.deepEqual(json.options.style, style);
        assert(json.id === 'vector');

        const layerCopied = LineStringLayer.fromJSON(json);
        assertChangeStyle(done, layerCopied, [255, 0, 0, 255]);
    });

    it('should can PolygonLayer.toJSON', done => {
        const polygons = [
            new maptalks.Polygon(
                [
                    [[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]]
                ]
            ),
        ];
        const style = [
            {
                filter: true,
                symbol: {
                    polygonFill: '#f00'
                }
            }
        ];

        const layer = new PolygonLayer('vector', polygons, {
            style
        });
        const json = layer.toJSON();
        assert(json.type === 'PolygonLayer');
        assert.deepEqual(json.geometries[0], polygons[0].toJSON());
        assert.deepEqual(json.options.style, style);
        assert(json.id === 'vector');

        const layerCopied = PolygonLayer.fromJSON(json);
        assertChangeStyle(done, layerCopied, [255, 0, 0, 255]);
    });

    function assertChangeStyle(done, layer, expectedColor, offset = [0, 0]) {
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        //因为是setStyle时，数据会被清空重绘，所以需要监听两次canvasisdirty
        layer.once('canvasisdirty', () => {
            const pixel = readPixel(layer.getRenderer().canvas, x / 2 + offset[0], y / 2 + offset[1]);
            //开始是红色
            assert.deepEqual(pixel, expectedColor);
            done();
        });
        layer.addTo(map);
    }

});
