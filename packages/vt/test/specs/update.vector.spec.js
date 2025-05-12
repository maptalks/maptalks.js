const path = require('path');
const assert = require('assert');
const { readPixel, compareExpected } = require('../common/Util');
const maptalks = require('maptalks');
const { PointLayer, LineStringLayer, PolygonLayer, ExtrudePolygonLayer, GeoJSONVectorTileLayer } = require('../../dist/maptalks.vt.js');
const { GroupGLLayer } = require('@maptalks/gl');


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


describe('vector layers update style specs', () => {
    let container, map;
    before(() => {
        container = document.createElement('div');
        container.style.width = '128px';
        container.style.height = '128px';
        document.body.appendChild(container);
    });

    beforeEach(() => {
        map = new maptalks.Map(container, DEFAULT_VIEW);
    });

    afterEach(() => {
        map.remove();
    });

    it('should can update markerFill and markerOpacity', done => {
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

        const layer = new PointLayer('point', marker);
        assertChangeStyle(done, layer, [0, 255, 0, 127], () => {
            marker.updateSymbol({
                markerFill: '#0f0',
                markerOpacity: 0.5
            });
            return 4;
        });
    });

    it('should draw correctly when updating spatial reference, maptalks/issues#388', done => {
        const marker = new maptalks.Marker([0, 0.25], {
            symbol: {
                markerType: 'ellipse',
                markerFill: '#f00',
                markerWidth: 30,
                markerHeight: 30,
                markerVerticalAlignment: 'middle',
                markerOpacity: 1
            }
        });

        const layer = new PointLayer('point', marker);
        assertChangeStyle(done, layer, [255, 0, 0, 255], () => {
            map.setSpatialReference({
                projection: 'EPSG:4326'
            });
            return 3;
        });
    });

    it('should can update marker zIndex', done => {
        const marker0 = new maptalks.Marker([0, 0], {
            symbol: {
                markerType: 'ellipse',
                markerFill: '#0f0',
                markerWidth: 30,
                markerHeight: 30,
                markerVerticalAlignment: 'middle',
                markerOpacity: 1
            }
        });
        const marker1 = new maptalks.Marker([0, 0], {
            symbol: {
                markerType: 'ellipse',
                markerFill: '#f00',
                markerWidth: 30,
                markerHeight: 30,
                markerVerticalAlignment: 'middle',
                markerOpacity: 1
            }
        });
        const layer = new PointLayer('point', [marker0, marker1]);
        assertChangeStyle(done, layer, [0, 255, 0, 255], [0, 0], () => {
            marker0.setZIndex(1);
            marker1.setZIndex(0);
            return 3;
        }, null, false);
    });

    it('should can updateSymbol for PointLayer', done => {
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

        const layer = new PointLayer('point', marker);
        assertChangeStyle(done, layer, [0, 255, 0, 127], () => {
            marker.updateSymbol({
                markerFill: '#0f0',
                markerOpacity: 0.5
            });
            return 4;
        });
    });

    it('should can update markerDx', done => {
        const marker = new maptalks.Marker([0, 0], {
            symbol: {
                markerType: 'ellipse',
                markerFill: '#f00',
                markerWidth: 30,
                markerHeight: 30,
                markerVerticalAlignment: 'middle'
            }
        });

        const layer = new PointLayer('point', marker);
        assertChangeStyle(done, layer, [0, 0, 0, 0], () => {
            marker.updateSymbol({
                markerDx: 50,
            });
        });
    });

    it('should can update markerWidth', done => {
        const marker = new maptalks.Marker([0, 0], {
            symbol: {
                markerType: 'ellipse',
                markerFill: '#f00',
                markerWidth: 30,
                markerHeight: 30,
                markerVerticalAlignment: 'middle'
            }
        });

        const layer = new PointLayer('point', marker);
        assertChangeStyle(done, layer, [255, 0, 0, 255], () => {
            marker.updateSymbol({
                markerWidth: 120,
                markerDx: 50
            });
        });
    });

    it('should can call PointLayer.updateSymbol', done => {
        const marker = new maptalks.Marker([0, 0]);

        const layer = new PointLayer('point', marker, {
            style: [
                {
                    filter: true,
                    symbol: {
                        markerType: 'ellipse',
                        markerFill: '#f00',
                        markerWidth: 30,
                        markerHeight: 30,
                        markerVerticalAlignment: 'middle'
                    }
                }
            ]
        });
        assertChangeStyle(done, layer, [0, 255, 0, 127], () => {
            layer.updateSymbol(0, {
                markerFill: '#0f0',
                markerOpacity: 0.5
            });
        });
    });

    it('should can update textName', done => {
        const marker = new maptalks.Marker([0, 0], {
            symbol: {
                textName: '_'
            }
        });

        const layer = new PointLayer('point', marker);
        assertChangeStyle(done, layer, [0, 0, 0, 255], [0, 0], () => {
            marker.updateSymbol({
                textName: '■■■',
            });
        }, false, [0, 0, 0, 0]);
    });

    it('should can update textStyle', done => {
        const marker = new maptalks.Marker([0, 0], {
            symbol: {
                textName: '■■■',
            }
        });

        const layer = new PointLayer('point', marker);
        assertChangeStyle(done, layer, [0, 0, 0, 255], [0, 0], () => {
            marker.updateSymbol({
                textStyle: 'italic',
            });
        }, false, [0, 0, 0, 255]);
    });

    it('should can update textWeight', done => {
        const marker = new maptalks.Marker([0, 0], {
            symbol: {
                textName: '■■■',
            }
        });

        const layer = new PointLayer('point', marker);
        assertChangeStyle(done, layer, [0, 0, 0, 255], [0, 0], () => {
            marker.updateSymbol({
                textWeight: 'bold',
            });
        }, false, [0, 0, 0, 255]);
    });

    it('should can update textFaceName', done => {
        const marker = new maptalks.Marker([0, 0], {
            symbol: {
                textName: '■■■',
            }
        });

        const layer = new PointLayer('point', marker);
        assertChangeStyle(done, layer, [0, 0, 0, 255], [0, 0], () => {
            marker.updateSymbol({
                textFaceName: 'monospace',
            });
        }, false, [0, 0, 0, 255]);
    });


    it('should can update properties based text', done => {
        const marker = new maptalks.Marker([0, 0], {
            symbol: {
                textName: '_'
            }
        });

        const layer = new PointLayer('point', marker);
        assertChangeStyle(done, layer, [0, 0, 0, 255], [0, 0], () => {
            marker.setProperties({
                content: '■■■'
            });
            marker.updateSymbol({
                textName: '{content}'
            });
        }, false, [0, 0, 0, 0]);
    });

    it('should can update textHaloRadius', done => {
        const marker = new maptalks.Marker([0, 0], {
            symbol: {
                textName: '■■■',
                textFill: '#f00',
                textSize: 30
            }
        });

        const layer = new PointLayer('point', marker);
        assertChangeStyle(done, layer, [0, 255, 0, 255], [27, 0], () => {
            marker.updateSymbol({
                textHaloRadius: 2,
                textHaloFill: '#0f0'
            });
        });
    });

    it('should can set style to pointlayer', done => {
        const marker = new maptalks.Marker([0, 0]);
        const layer = new PointLayer('vector', marker, {
            style: [
                {
                    filter: true,
                    symbol: {
                        markerType: 'ellipse',
                        markerFill: '#f00',
                        markerWidth: 30,
                        markerHeight: 30,
                        markerVerticalAlignment: 'middle'
                    }
                }
            ]
        });
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        layer.once('canvasisdirty', () => {
            const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
            assert.deepEqual(pixel, [255, 0, 0, 255]);
            done();
        });
        layer.addTo(map);
    });

    //添加Geometry
    it('should can add marker to pointlayer', done => {
        const marker = new maptalks.Marker([0, 0]);
        const layer = new PointLayer('vector', {
            style: [
                {
                    filter: true,
                    symbol: {
                        markerType: 'ellipse',
                        markerFill: '#f00',
                        markerWidth: 30,
                        markerHeight: 30,
                        markerVerticalAlignment: 'middle'
                    }
                }
            ]
        });
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        layer.once('canvasisdirty', () => {
            const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
            assert.deepEqual(pixel, [255, 0, 0, 255]);
            done();
        });
        layer.addTo(map);
        layer.addGeometry(marker);
    });

    //更新坐标
    it('should can update marker coordinates', done => {
        const marker = new maptalks.Marker([0, 0]);
        const layer = new PointLayer('vector', marker, {
            style: [
                {
                    filter: true,
                    symbol: {
                        markerType: 'ellipse',
                        markerFill: '#f00',
                        markerWidth: 30,
                        markerHeight: 30,
                        markerVerticalAlignment: 'middle'
                    }
                }
            ]
        });
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        let count = 0;
        layer.on('canvasisdirty', () => {
            count++;
            if (count === 1) {
                marker.setCoordinates([1, 0]);
            } else if (count === 3) {
                let pixel = readPixel(layer.getRenderer().canvas, x / 2 + 50, y / 2);
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                assert.deepEqual(pixel, [0, 0, 0, 0]);
                done();
            }
        });
        layer.addTo(map);
    });

    //删除Geometry
    it('should can remove marker from pointlayer', done => {
        const markers = [
            new maptalks.Marker([0, 0]),
            new maptalks.Marker([0, 1]),
        ];
        const layer = new PointLayer('vector', markers, {
            style: [
                {
                    filter: true,
                    symbol: {
                        markerType: 'ellipse',
                        markerFill: '#f00',
                        markerWidth: 30,
                        markerHeight: 30,
                        markerVerticalAlignment: 'middle'
                    }
                }
            ]
        });
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        let count = 0;
        layer.on('canvasisdirty', () => {
            count++;
            if (count === 1) {
                markers[0].remove();
            } else if (count === 2) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                //marker with [0, 1]
                const pixel2 = readPixel(layer.getRenderer().canvas, x / 2, y / 2 - 50);
                assert.deepEqual(pixel2, [255, 0, 0, 255]);
            } else if (count === 3) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                assert.deepEqual(pixel, [0, 0, 0, 0]);
                //marker with [0, 1]
                const pixel2 = readPixel(layer.getRenderer().canvas, x / 2, y / 2 - 50);
                assert.deepEqual(pixel2, [255, 0, 0, 255]);
                done();
            }
        });
        layer.addTo(map);
    });


    it('should can set style to LineStringLayer', done => {
        const line = new maptalks.LineString([[-1, 0], [1, 0]]);
        const layer = new LineStringLayer('vector', line, {
            style: [
                {
                    filter: true,
                    symbol: {
                        lineColor: '#f00',
                        lineWidth: 20
                    }
                }
            ]
        });
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        layer.once('canvasisdirty', () => {
            const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
            assert.deepEqual(pixel, [255, 0, 0, 255]);
            done();
        });
        layer.addTo(map);
    });

    it('should can update symbol.lineGradientProperty, maptalks/issues#782', done => {
        const line = new maptalks.LineString([[-1, 0], [1, 0]], {
            symbol: {
                lineGradientProperty: 'gradients',
                lineWidth: 20
            },
            properties: {
                gradients: [0, 'red', 0.7, 'yellow', 1, 'green']
            }
        });
        const layer = new LineStringLayer('vector', line);
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        layer.once('canvasisdirty', () => {
            const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
            assert.deepEqual(pixel, [255, 184, 0, 255]);
            layer.once('canvasisdirty', () => {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                assert.deepEqual(pixel, [0, 0, 255, 255]);
                done();
            });
            line.setProperties({
                gradients: [0, 'blue', 0.7, 'blue', 1, 'blue']
            });

        });
        layer.addTo(map);
    });

    it('should can update symbol with function-type lineColor, fuzhenn/maptalks-ide#3099', done => {
        const line = new maptalks.LineString([[-1, 0], [1, 0]]);
        line.setSymbol({
            lineColor: {
              "type": "exponential",
              "default": [
                1,
                0,
                0,
                1
              ],
              "stops": [
                [
                  16,
                  [
                    1,
                    0,
                    0,
                    1
                  ]
                ]
              ]
            },
            lineWidth: 20,
            lineOpacity: 0.5
        });
        const layer = new LineStringLayer('vector', line);
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        let count = 0;
        layer.on('canvasisdirty', () => {
            count++;
            if (count === 1) {
                line.updateSymbol({
                    lineOpacity: 1
                });
            } else if (count === 3) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                done();
            }
        });
        layer.addTo(map);
    });


    it('should can update symbol with function-type markerWidth, fuzhenn/maptalks-ide#3060', done => {
        const marker = new maptalks.Marker([0, 0]);
        marker.setSymbol({
            "markerWidth": {
              "type": "exponential",
              "default": 20,
              "stops": [
                [
                  16,
                  100
                ]
              ]
            },
            markerHeight: 200,
            markerType: 'ellipse',
            markerFill: '#f00'
        });
        const layer = new PointLayer('points', marker);
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        let count = 0;
        layer.on('canvasisdirty', () => {
            count++;
            if (count === 1) {
                marker.updateSymbol({
                    markerOpacity: 0.5
                });
            } else if (count === 3) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2 - 10);
                assert.deepEqual(pixel, [255, 0, 0, 127]);
                done();
            }
        });
        layer.addTo(map);
    });


    //添加Geometry
    it('should can add lineString to LineStringLayer', done => {
        const line = new maptalks.LineString([[-1, 0], [1, 0]]);
        const layer = new LineStringLayer('vector', {
            style: [
                {
                    filter: true,
                    symbol: {
                        lineColor: '#f00',
                        lineWidth: 20
                    }
                }
            ]
        });
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        layer.once('canvasisdirty', () => {
            const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
            assert.deepEqual(pixel, [255, 0, 0, 255]);
            done();
        });
        layer.addTo(map);
        layer.addGeometry(line);
    });

    //更新坐标
    it('should can update LineString coordinates', done => {
        const line = new maptalks.LineString([[-1, 0], [1, 0]]);
        const layer = new LineStringLayer('vector', line, {
            style: [
                {
                    filter: true,
                    symbol: {
                        lineColor: '#f00',
                        lineWidth: 20
                    }
                }
            ]
        });
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        let count = 0;
        let partialUpdate = false;
        layer.on('partialupdate', () => {
            partialUpdate = true;
        });
        layer.on('canvasisdirty', () => {
            count++;
            if (count === 1) {
                line.setCoordinates([[-1, 1], [1, 1], [1.1, 1]]);
            } else if (count === 3) {
                let pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2 - 50);
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                assert.deepEqual(pixel, [0, 0, 0, 0]);
                assert(!partialUpdate);
                done();
            }
        });
        layer.addTo(map);
    });

    it('should can translate LineString', done => {
        const line = new maptalks.LineString([[-1, 0], [1, 0]]);
        const layer = new LineStringLayer('vector', line, {
            style: [
                {
                    filter: true,
                    symbol: {
                        lineColor: '#f00',
                        lineWidth: 20
                    }
                }
            ]
        });
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        let count = 0;
        let partialUpdate = false;
        layer.on('partialupdate', () => {
            partialUpdate = true;
        });
        layer.on('canvasisdirty', () => {
            count++;
            if (count === 1) {
                line.translate(0, 1);
            } else if (count === 3) {
                let pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2 - 50);
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                assert.deepEqual(pixel, [0, 0, 0, 0]);
                assert(partialUpdate);
                done();
            }
        });
        layer.addTo(map);
    });

    //删除Geometry
    it('should can remove lineString from LineStringLayer', done => {
        const lines = [
            new maptalks.LineString([[-1, 0], [1, 0]]),
            new maptalks.LineString([[-1, 1], [1, 1]]),
        ];
        const layer = new LineStringLayer('vector', lines, {
            style: [
                {
                    filter: true,
                    symbol: {
                        lineColor: '#f00',
                        lineWidth: 20
                    }
                }
            ]
        });
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        let count = 0;
        layer.on('canvasisdirty', () => {
            count++;
            if (count === 1) {
                lines[0].remove();
            } else if (count === 2) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                const pixel2 = readPixel(layer.getRenderer().canvas, x / 2, y / 2 - 50);
                assert.deepEqual(pixel2, [255, 0, 0, 255]);
            } else if (count === 3) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                assert.deepEqual(pixel, [0, 0, 0, 0]);
                const pixel2 = readPixel(layer.getRenderer().canvas, x / 2, y / 2 - 50);
                assert.deepEqual(pixel2, [255, 0, 0, 255]);
                done();
            }
        });
        layer.addTo(map);
    });

    it('should can update LineString dasharray', done => {
        const line = new maptalks.LineString([[-1, 0], [1, 0]], {
            symbol: {
                lineColor: '#f00',
                lineWidth: 20,
                lineDasharray: [0, 0, 0, 0]
            }
        });
        const layer = new LineStringLayer('vector', line);
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        let count = 0;
        layer.on('canvasisdirty', () => {
            count++;
            if (count === 1) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                line.updateSymbol({
                    lineDasharray: [24, 24, 0, 0]
                });
            } else if (count === 3) {
                let pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                pixel = readPixel(layer.getRenderer().canvas, x / 2 + 20, y / 2);
                assert.deepEqual(pixel, [0, 0, 0, 0]);
                line.updateSymbol({
                    lineDasharray: [0, 0, 0, 0]
                });
            } else if (count === 5) {
                let pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                pixel = readPixel(layer.getRenderer().canvas, x / 2 + 20, y / 2);
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                done();
            }
        });
        layer.addTo(map);
    });

    it('should can update lineString lineJoin', done => {
        const line = new maptalks.LineString([[-1, 0], [0, 0], [0, 1]], {
            symbol: {
                lineColor: '#f00',
                lineWidth: 20,
                lineJoin: 'round',
                lineDasharray: [0, 0, 0, 0]
            }
        });
        const layer = new LineStringLayer('vector', line);
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        let count = 0;
        layer.on('canvasisdirty', () => {
            count++;
            if (count === 1) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                line.updateSymbol({
                    lineJoin: 'bevel'
                });
            } else if (count === 3) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                line.updateSymbol({
                    lineJoin: 'miter'
                });

            } else if (count === 5) {
                let pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                done();
            }
        });
        layer.addTo(map);
    });

    it('should can update lineString lineCap', done => {
        const line = new maptalks.LineString([[-1, 0], [0, 0]], {
            symbol: {
                lineColor: '#f00',
                lineWidth: 20,
                lineCap: 'butt',
                lineDasharray: [0, 0, 0, 0]
            }
        });
        const layer = new LineStringLayer('vector', line);
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        let count = 0;
        layer.on('canvasisdirty', () => {
            count++;
            if (count === 1) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2 - 5, y / 2);
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                line.updateSymbol({
                    lineCap: 'square'
                });
            } else if (count === 3) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                line.updateSymbol({
                    lineCap: 'round'
                });

            } else if (count === 5) {
                let pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                done();
            }
        });
        layer.addTo(map);
    });


    //更新坐标
    it('should can update Polygon coordinates', done => {
        const polygon = new maptalks.Polygon([[[-1, 1], [1, 1], [1, -1], [-1, -1], [-1, 1]]]);
        const layer = new PolygonLayer('vector', polygon, {
            style: [
                {
                    filter: true,
                    symbol: {
                        polygonFill: '#f00'
                    }
                }
            ]
        });
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        let count = 0;
        let partialUpdate = false;
        layer.on('partialupdate', () => {
            partialUpdate = true;
        });
        layer.on('canvasisdirty', () => {
            count++;
            if (count === 1) {
                polygon.setCoordinates([[[-1, 2], [1, 2], [1, 0], [-1, 0], [-1, 2]]]);
            } else if (count === 3) {
                let pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2 - 50);
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                assert.deepEqual(pixel, [0, 0, 0, 0]);
                assert(!partialUpdate);
                done();
            }
        });
        layer.addTo(map);
    });

    it('should can translate Polygon', done => {
        const polygon = new maptalks.Polygon([[[-1, 1], [1, 1], [1, -1], [-1, -1], [-1, 1]]]);
        const layer = new PolygonLayer('vector', polygon, {
            style: [
                {
                    filter: true,
                    symbol: {
                        polygonFill: '#f00'
                    }
                }
            ]
        });
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        let count = 0;
        let partialUpdate = false;
        layer.on('partialupdate', () => {
            partialUpdate = true;
        });
        layer.on('canvasisdirty', () => {
            count++;
            if (count === 1) {
                polygon.translate(0, 1);
            } else if (count === 3) {
                let pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2 - 50);
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2 + 20);
                assert.deepEqual(pixel, [0, 0, 0, 0]);
                assert(partialUpdate);
                done();
            }
        });
        layer.addTo(map);
    });

    it('should can update Polygon opacity from 0.5 to 1, fuzhenn/maptalks-studio#2413', done => {
        const polygon = new maptalks.Polygon([[[-1, 1], [1, 1], [1, -1], [-1, -1], [-1, 1]]], {
            symbol: {
                polygonFill: '#f00',
                polygonOpacity: 0.5
            }
        });
        const layer = new PolygonLayer('vector', polygon);
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        let count = 0;
        layer.on('canvasisdirty', () => {
            count++;
            if (count === 1) {
                polygon.updateSymbol({
                    polygonOpacity: 1
                });
            } else if (count === 4) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                done();
            }
        });
        layer.addTo(map);
    });

    it('should can update MultiPolygon coordinates', done => {
        const polygon = new maptalks.MultiPolygon([
            [[[-1, 1], [-0.5, 1], [-0.5, -1], [-1, -1], [-1, 1]]],
            [[[0.5, 1], [1, 1], [1, -1], [0.5, -1], [0.5, 1]]],
        ]);
        const layer = new PolygonLayer('vector', polygon, {
            style: [
                {
                    filter: true,
                    symbol: {
                        polygonFill: '#f00'
                    }
                }
            ]
        });
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        let count = 0;
        let partialUpdate = false;
        layer.on('partialupdate', () => {
            partialUpdate = true;
        });
        layer.on('canvasisdirty', () => {
            count++;
            if (count === 1) {
                let pixel = readPixel(layer.getRenderer().canvas, x / 2 + 40, y / 2);
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                polygon.setCoordinates([
                    [[[-1, 2], [-0.5, 2], [-0.5, 0], [-1, 0], [-1, 2]]],
                    [[[0.5, 2], [1, 2], [1, 0], [0.5, 0], [0.5, 2]]],
                ]);
            } else if (count === 3) {
                let pixel = readPixel(layer.getRenderer().canvas, x / 2 + 40, y / 2);
                assert.deepEqual(pixel, [0, 0, 0, 0]);
                assert(!partialUpdate);
                done();
            }
        });
        layer.addTo(map);
    });

    it('should can translate MultiPolygon', done => {
        const polygon = new maptalks.MultiPolygon([
            [[[-1, 1], [-0.5, 1], [-0.5, -1], [-1, -1], [-1, 1]]],
            [[[0.5, 1], [1, 1], [1, -1], [0.5, -1], [0.5, 1]]],
        ]);
        const layer = new PolygonLayer('vector', polygon, {
            style: [
                {
                    filter: true,
                    symbol: {
                        polygonFill: '#f00'
                    }
                }
            ]
        });
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        let count = 0;
        let partialUpdate = false;
        layer.on('partialupdate', () => {
            partialUpdate = true;
        });
        layer.on('canvasisdirty', () => {
            count++;
            if (count === 1) {
                let pixel = readPixel(layer.getRenderer().canvas, x / 2 + 40, y / 2);
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                polygon.translate(new maptalks.Coordinate(0, 100));
            } else if (count === 3) {
                let pixel = readPixel(layer.getRenderer().canvas, x / 2 + 40, y / 2);
                assert.deepEqual(pixel, [0, 0, 0, 0]);
                assert(partialUpdate);
                done();
            }
        });
        layer.addTo(map);
    });

    it('vector should can outlineAll', done => {
        const marker = new maptalks.Marker(map.getCenter(), {
            id: 0,
            symbol: {
                markerType: 'ellipse',
                markerFill: '#f00',
                markerWidth: 30,
                markerHeight: 30,
                markerVerticalAlignment: 'middle',
                markerOpacity: 1
            }
        });

        const layer = new PointLayer('point', marker);
        const sceneConfig = {
            postProcess: {
                enable: true,
                outline: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        layer.on('canvasisdirty', () => {
            count++;
        });
        let outlined = false;
        group.on('layerload', () => {
            if (count >= 1 && !outlined) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                layer.outlineAll();
                outlined = true;
            } else if (outlined) {
                const pixel = readPixel(renderer.canvas, x / 2, y / 2);
                //变成高亮的绿色
                assert(pixel[1] > 10);
                done();
            }
        });
        group.addTo(map);
    });

    it('layer should can outlineAll after remove', done => {
        const center = map.getCenter();
        const ring = [[center.x, center.y - 0.5], [center.x, center.y + 0.5], [center.x + 0.5, center.y + 0.5], [center.x + 0.5, center.y - 0.5], [center.x, center.y - 0.5]];
        const polygon = new maptalks.Polygon([ring], {
            symbol: {
                lineColor: '#000',
                lineWidth: 6,
                polygonFill: '#f00'
            }
        });
        const layer = new PolygonLayer('polygon', polygon);
        const sceneConfig = {
            postProcess: {
                enable: true,
                outline: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        layer.on('canvasisdirty', () => {
            count++;
        });
        let outlined = false;
        let removed = false;
        group.on('layerload', () => {
            if (count >= 1 && !removed) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2 + 5, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                polygon.remove();
                removed = true;
            } else if (outlined) {
                const pixel = readPixel(renderer.canvas, x / 2 + 5, y / 2);
                assert(pixel[3] === 0);
                done();
            } else if (removed) {
                layer.outlineAll();
                outlined = true;
            }
        });
        group.addTo(map);
    });

    it('vector should can outline features', done => {
        const marker = new maptalks.Marker(map.getCenter(), {
            id: 0,
            symbol: {
                markerType: 'ellipse',
                markerFill: '#f00',
                markerWidth: 30,
                markerHeight: 30,
                markerVerticalAlignment: 'middle',
                markerOpacity: 1
            }
        });

        const layer = new PointLayer('point', marker);
        const sceneConfig = {
            postProcess: {
                enable: true,
                outline: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        layer.on('canvasisdirty', () => {
            count++;
        });
        let outlined = false;
        let finished = false;
        group.on('layerload', () => {
            if (count >= 1 && !outlined) {
                if (finished) {
                    return;
                }
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                layer.outline([0]);
                outlined = true;
            } else if (outlined) {
                const pixel = readPixel(renderer.canvas, x / 2, y / 2);
                //变成高亮的绿色
                assert(pixel[1] > 10);
                finished = true;
                done();
            }
        });
        group.addTo(map);
    });

    it('vector should can cancelOutline', done => {
        const marker = new maptalks.Marker(map.getCenter(), {
            id: 0,
            symbol: {
                markerType: 'ellipse',
                markerFill: '#f00',
                markerWidth: 30,
                markerHeight: 30,
                markerVerticalAlignment: 'middle',
                markerOpacity: 1
            }
        });

        const layer = new PointLayer('point', marker);
        const sceneConfig = {
            postProcess: {
                enable: true,
                outline: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        layer.on('canvasisdirty', () => {
            count++;
        });
        let outlined = false;
        let canceled = false;
        group.on('layerload', () => {
            if (count >= 1 && !outlined) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                layer.outline([0]);
                outlined = true;
            } else if (outlined && !canceled) {
                const pixel = readPixel(renderer.canvas, x / 2, y / 2);
                //变成高亮的绿色
                assert(pixel[1] > 10);
                layer.cancelOutline();
                canceled = true;
            } else if (canceled) {
                const pixel = readPixel(renderer.canvas, x / 2, y / 2);
                //变成高亮的绿色
                assert(pixel[1] === 0);
                done();
            }
        });
        group.addTo(map);
    });

    it('marker should can hide and show', done => {
        const marker = new maptalks.Marker(map.getCenter(), {
            id: 0,
            symbol: {
                markerType: 'ellipse',
                markerFill: '#f00',
                markerWidth: 30,
                markerHeight: 30,
                markerVerticalAlignment: 'middle',
                markerOpacity: 1
            }
        });

        const layer = new PointLayer('point', marker);
        const sceneConfig = {
            postProcess: {
                enable: true,
                outline: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        layer.on('canvasisdirty', () => {
            count++;
        });
        let hided = false;
        let showed = false;
        group.on('layerload', () => {
            if (count >= 1 && !hided) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                marker.hide();
                hided = true;
            } else if (hided && !showed) {
                const pixel = readPixel(renderer.canvas, x / 2, y / 2);
                //变成高亮的绿色
                assert(pixel[3] === 0);
                marker.show();
                showed = true;
            } else if (showed) {
                const pixel = readPixel(renderer.canvas, x / 2, y / 2);
                //变成高亮的绿色
                assert(pixel[3] > 0);
                done();
            }
        });
        group.addTo(map);
    });

    it('PointLayer in GroupGLLayer remove and add again to map, maptalks/issues#256', done => {
        const marker = new maptalks.Marker(map.getCenter(), {
            id: 0,
            symbol: {
                markerType: 'ellipse',
                markerFill: '#f00',
                markerWidth: 30,
                markerHeight: 30,
                markerVerticalAlignment: 'middle',
                markerOpacity: 1
            }
        });

        const layer = new PointLayer('point', marker);
        const sceneConfig = {
            postProcess: {
                enable: true,
                outline: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        group.addTo(map);
        setTimeout(() => {
            group.remove();
            setTimeout(() => {
                group.addTo(map);
                setTimeout(() => {
                    const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                    assert.deepEqual(pixel, [255, 0, 0, 255]);
                    done();
                }, 200);
            }, 200);
        }, 200);
    });

    it('LineStringLayer in GroupGLLayer remove and add again to map, maptalks/issues#256', done => {
        const line = new maptalks.LineString([[-1, 0], [1, 0]]);
        const layer = new LineStringLayer('vector', line, {
            style: [
                {
                    filter: true,
                    symbol: {
                        lineColor: '#f00',
                        lineWidth: 20
                    }
                }
            ]
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                outline: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        group.addTo(map);
        setTimeout(() => {
            group.remove();
            setTimeout(() => {
                group.addTo(map);
                setTimeout(() => {
                    const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                    assert.deepEqual(pixel, [255, 0, 0, 255]);
                    done();
                }, 200);
            }, 200);
        }, 200);
    });

    it('PolygonLayer in GroupGLLayer remove and add again to map, maptalks/issues#256', done => {
        const polygon = new maptalks.Polygon([[[-1, 1], [1, 1], [1, -1], [-1, -1], [-1, 1]]]);
        const layer = new PolygonLayer('vector', polygon, {
            style: [
                {
                    filter: true,
                    symbol: {
                        polygonFill: '#f00'
                    }
                }
            ]
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                outline: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        group.addTo(map);
        setTimeout(() => {
            group.remove();
            setTimeout(() => {
                group.addTo(map);
                setTimeout(() => {
                    const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                    assert.deepEqual(pixel, [255, 0, 0, 255]);
                    done();
                }, 200);
            }, 200);
        }, 200);
    });

    it('line should can hide and show', done => {
        const line = new maptalks.LineString([[-1, 0], [1, 0]]);
        const layer = new LineStringLayer('vector', line, {
            style: [
                {
                    filter: true,
                    symbol: {
                        lineColor: '#f00',
                        lineWidth: 20
                    }
                }
            ]
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                outline: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        layer.on('canvasisdirty', () => {
            count++;
        });
        let hided = false;
        let showed = false;
        group.on('layerload', () => {
            if (count >= 1 && !hided) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                line.hide();
                hided = true;
            } else if (hided && !showed) {
                const pixel = readPixel(renderer.canvas, x / 2, y / 2);
                //变成高亮的绿色
                assert(pixel[3] === 0);
                line.show();
                showed = true;
            } else if (showed) {
                const pixel = readPixel(renderer.canvas, x / 2, y / 2);
                //变成高亮的绿色
                assert(pixel[3] > 0);
                done();
            }
        });
        group.addTo(map);
    });


    it('polygon should can hide and show', done => {
        const polygon = new maptalks.Polygon([[[-1, 1], [1, 1], [1, -1], [-1, -1], [-1, 1]]]);
        const layer = new PolygonLayer('vector', polygon, {
            style: [
                {
                    filter: true,
                    symbol: {
                        polygonFill: '#f00'
                    }
                }
            ]
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                outline: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        layer.on('canvasisdirty', () => {
            count++;
        });
        let hided = false;
        let showed = false;
        group.on('layerload', () => {
            if (count >= 1 && !hided) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                polygon.hide();
                hided = true;
            } else if (hided && !showed) {
                const pixel = readPixel(renderer.canvas, x / 2, y / 2);
                //变成高亮的绿色
                assert(pixel[3] === 0);
                polygon.show();
                showed = true;
            } else if (showed) {
                const pixel = readPixel(renderer.canvas, x / 2, y / 2);
                //变成高亮的绿色
                assert(pixel[3] > 0);
                done();
            }
        });
        group.addTo(map);
    });

    it('polygon should can update bloom, fuzhenn/maptalks-ide#3360', done => {
        const polygon = new maptalks.Polygon([[[-1, 1], [1, 1], [1, -1], [-1, -1], [-1, 1]]]);
        const layer = new PolygonLayer('vector', polygon, {
            style: [
                {
                    filter: true,
                    symbol: {
                        polygonFill: '#f00'
                    }
                }
            ]
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                outline: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        layer.on('canvasisdirty', () => {
            count++;
        });
        let finished = false;
        group.on('layerload', () => {
            if (count >= 1 && !finished) {
                finished = true;
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                layer.config('enableBloom', true);
                done();
            }
        });
        group.addTo(map);
    });

    it('marker should can update textName', done => {
        const marker = new maptalks.Marker(map.getCenter(), {
            id: 0,
            symbol: {
                markerType: 'ellipse',
                markerFill: '#f00',
                markerWidth: 30,
                markerHeight: 30,
                markerVerticalAlignment: 'middle',
                markerOpacity: 1
            }
        });

        const layer = new PointLayer('point', marker);
        const sceneConfig = {
            postProcess: {
                enable: true,
                outline: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        layer.on('canvasisdirty', () => {
            count++;
        });
        let updated = false;
        group.on('layerload', () => {
            if (count >= 1 && !updated) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                marker.setProperties({
                    content: '■■■'
                });
                marker.updateSymbol({
                    textName: '{content}',
                    textFill: '#00f',
                    textSize: 24
                });
                updated = true;
            } else if (updated && count >= 3) {
                const pixel = readPixel(renderer.canvas, x / 2, y / 2);
                //变成高亮的绿色
                assert.deepEqual(pixel, [0, 0, 255, 255]);
                done();
            }
        });
        group.addTo(map);
    });

    it('should can turn on/off sceneConfig.collision', done => {
        const symbol = { markerType: 'ellipse', markerWidth: 10, markerHeight: 10 };
        const marker0 = new maptalks.Marker([0, 0], { symbol });
        const marker1 = new maptalks.Marker([0.15, 0], { symbol });
        const layer = new PointLayer('point', [marker1, marker0], { collision: true });
        let count = 0;
        const canvas = map.getRenderer().canvas;
        layer.on('canvasisdirty', () => {
            count++;
            if (count === 1) {
                const expectedPath = path.join(__dirname, 'fixtures', 'collision', 'collision.png');
                compareExpected(canvas, { expectedPath });
                layer.options.sceneConfig.collision = false;
                layer.getRenderer().setToRedraw();
            } else if (count === 2) {
                const expectedPath = path.join(__dirname, 'fixtures', 'collision', 'no-collision.png');
                compareExpected(canvas, { expectedPath });
                layer.options.sceneConfig.collision = true;
                layer.getRenderer().setToRedraw();
            } else if (count === 3) {
                const expectedPath = path.join(__dirname, 'fixtures', 'collision', 'collision.png');
                compareExpected(canvas, { expectedPath }, done);
            }
        });
        layer.addTo(map);
    });

    it('should can turn on/off layer.collision, fuzhenn/maptalks-ide#3098', done => {
        const symbol = { markerType: 'ellipse', markerWidth: 10, markerHeight: 10 };
        const marker0 = new maptalks.Marker([0, 0], { symbol });
        const marker1 = new maptalks.Marker([0.15, 0], { symbol });
        const layer = new PointLayer('point', [marker1, marker0], { collision: false });
        let count = 0;
        const canvas = map.getRenderer().canvas;
        layer.on('canvasisdirty', () => {
            count++;
            if (count === 1) {
                const expectedPath = path.join(__dirname, 'fixtures', 'collision', 'no-collision.png');
                compareExpected(canvas, { expectedPath });
                layer.options.collision = true;
                layer.getRenderer().setToRedraw();
            } else if (count === 2) {
                const canvas = map.getRenderer().canvas;
                const expectedPath = path.join(__dirname, 'fixtures', 'collision', 'collision.png');
                compareExpected(canvas, { expectedPath });
                layer.options.collision = false;
                layer.getRenderer().setToRedraw();
            } else if (count === 3) {
                const canvas = map.getRenderer().canvas;
                const expectedPath = path.join(__dirname, 'fixtures', 'collision', 'no-collision.png');
                compareExpected(canvas, { expectedPath }, done);
            }
        });
        layer.addTo(map);
    });

    it('fuzhenn/memo#65, correct symbol', done => {
        const symbol = [
            {
              markerFile: 'file://' + path.resolve(__dirname, 'fixtures/marker-symbols/station-orange.png'),
              markerWidth: {
                stops: [
                  [4, 21],
                  [8, 28]
                ]
              },
              markerHeight: {
                stops: [
                  [4, 24],
                  [8, 32]
                ]
              }
            },
            {
              markerFile: 'file://' + path.resolve(__dirname, 'fixtures/marker-symbols/oil-4.png'),
              markerWidth: {
                stops: [
                  [4, 7],
                  [8, 14]
                ]
              },
              markerHeight: {
                stops: [
                  [4, 15],
                  [8, 30]
                ]
              },
              markerDx: {
                stops: [
                  [4, 20],
                  [8, 30]
                ]
              }
            }
          ];
        const marker0 = new maptalks.Marker([0, 0], { symbol });
        const layer = new PointLayer('point').addTo(map);
        const canvas = map.getRenderer().canvas;
        layer.once('canvasisdirty', () => {
            const expectedPath = path.join(__dirname, 'fixtures', 'marker-symbols', 'expected.png');
            compareExpected(canvas, { expectedPath });
            done();
        });
        layer.addGeometry([marker0]);
    });

    it('marker should can update textFill with 2 markers, fuzhenn/maptalks-studio#2375', done => {
        const marker0 = new maptalks.Marker(map.getCenter(), {
            id: 0,
            symbol: {
                markerType: 'ellipse',
                markerFill: '#0f0',
                markerVerticalAlignment: 'middle',
                // 设成145后，aMarkerWidth 的类型会变成 Uint16rray
                markerWidth: 145,
                markerHeight: 145
            }
        });

        const marker1 = new maptalks.Marker(map.getCenter(), {
            id: 1,
            symbol: {
                markerType: 'ellipse',
                markerFill: '#00f',
                markerVerticalAlignment: 'middle',
                markerWidth: 77,
                markerHeight: 77,
                textName: '■■■',
                textFill: [1, 0, 0, 1]
            }
        });

        const layer = new PointLayer('point', [marker0, marker1]);
        const sceneConfig = {
            postProcess: {
                enable: true,
                outline: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        layer.on('canvasisdirty', () => {
            count++;
        });
        let updated = false;
        group.on('layerload', () => {
            if (count >= 1 && !updated) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                marker1.updateSymbol({
                    textFill: [1, 1, 0, 1],
                });
                updated = true;
            } else if (updated && count >= 3) {
                const pixel = readPixel(renderer.canvas, x / 2, y / 2);
                const pixel1 = readPixel(renderer.canvas, x / 2, y / 2 + 10);
                assert.deepEqual(pixel, [255, 255, 0, 255]);
                assert.deepEqual(pixel1, [0, 0, 255, 255]);
                done();
            }
        });
        group.addTo(map);
    });

    it('z index of PointLayer and VectorTileLayer', done => {
        const symbol = { markerType: 'ellipse', markerWidth: 10, markerHeight: 10, markerFill: '#f00', markerVerticalAlignment: 'middle' };
        const marker0 = new maptalks.Marker([0, 0], { symbol });
        const pointData = { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] } }] };
        const style = {
            style: [
                {
                  "renderPlugin": {
                    "type": "icon",
                    "dataConfig": {
                      "type": "point"
                    }
                  },
                  "symbol": {
                      markerType: 'ellipse',
                      markerWidth: 20,
                      markerHeight: 20,
                      markerFill: '#00f'
                  }
                }
            ]
        }
        const layer = new PointLayer('point', [marker0]);
        const vtLayer = new GeoJSONVectorTileLayer('vt', {
            data: pointData,
            style
        });
        const sceneConfig = { postProcess: { enable: true, antialias: { enable: true } } };
        const group = new GroupGLLayer('group', [vtLayer, layer], { sceneConfig });
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        let count = 0;
        let finished = false;
        vtLayer.on('canvasisdirty', () => {
            count++;
            if (!finished && count === 2) {
                const pixel = readPixel(renderer.canvas, x / 2, y / 2);
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                finished = true;
                done();
            }
        });
        group.addTo(map);
    });

    it('should can clear PointLayer, maptalks/issues#180', done => {
        const redMarker = new maptalks.Marker(
          map.getCenter(),
          {
            symbol: [
              {
                markerType: 'square',
                markerVerticalAlignment: 'middle',
                markerFill: '#f00',
                markerOpacity: 0.7,
                markerTextFit: 'both',
                markerTextFitPadding: [3, 3, 3, 3],

                textName: 'MARKER的文字',
                textFaceName: '微软雅黑, monospace',
                textSize: 16,
                textFill: '#000'
              },
            ]
          }
        );
        //// PointLayer
        const pointLayer = new PointLayer('pointLayer');
        pointLayer.addGeometry(redMarker);

        const groupLayer = new GroupGLLayer("group", [pointLayer]);
        groupLayer.addTo(map);

        setTimeout(() => {
            pointLayer.remove();
            assert(groupLayer.getLayers().length === 0);
            pointLayer.addTo(groupLayer);
            pointLayer.clear();
            done();
        }, 500);

    });

    it('should can remove PointLayer and add again, maptalks/issues#180', done => {
        const redMarker = new maptalks.Marker(
          map.getCenter(),
          {
            symbol: [
              {
                markerType: 'ellipse',
                markerVerticalAlignment: 'middle',
                markerFill: '#f00',
                markerWidth: 20,
                markerHeight: 20,
              },
            ]
          }
        );
        //// PointLayer
        const pointLayer = new PointLayer('pointLayer');
        pointLayer.addGeometry(redMarker);

        const groupLayer = new GroupGLLayer("group", [pointLayer]);
        groupLayer.addTo(map);

        setTimeout(() => {
            pointLayer.remove();
            pointLayer.addTo(groupLayer);
            const pixel = readPixel(groupLayer.getRenderer().canvas, map.width / 2, map.height / 2);
                //开始是红色
            assert.deepEqual(pixel, [255, 0, 0, 255]);
            done();
        }, 500);

    });

    it('should can clear PointLayer after removed, maptalks/issues#178', done => {
        const redMarker = new maptalks.Marker(
          map.getCenter(),
          {
            symbol: [
              {
                markerType: 'ellipse',
                markerVerticalAlignment: 'middle',
                markerFill: '#f00',
                markerWidth: 20,
                markerHeight: 20,
              },
            ]
          }
        );
        //// PointLayer
        const pointLayer = new PointLayer('pointLayer');
        pointLayer.addGeometry(redMarker);

        const groupLayer = new GroupGLLayer("group", [pointLayer]);
        groupLayer.addTo(map);

        setTimeout(() => {
            groupLayer.removeLayer(pointLayer);
            groupLayer.addLayer(pointLayer);
            pointLayer.clear();
            done();
        }, 500);

    });

    it('should can remove text marker with markerTextFit, maptalks/issues#113', done => {
        //// GroupGLLayer
        const sceneConfig = {
          postProcess: {
            enable: true,
            antialias: { enable: false } // 关闭抗锯齿，文字更清楚
          }
        };
        const groupLayer = new GroupGLLayer('groupLayer', [], { sceneConfig });
        groupLayer.addTo(map);

        //// PointLayer
        let pointLayer = new PointLayer('pointLayer', {
          sceneConfig: {
            depthFunc: '<=',
            renderToPointRenderTarget: false
          }
        }).addTo(groupLayer);
        let center = map.getCenter();

        // redMarker
        let redMarkers = [];
        const redMarker = new maptalks.Marker(
          center,
          {
            symbol: [
              {
                markerType: 'square',
                markerVerticalAlignment: 'middle',
                markerFill: '#f00',
                markerOpacity: 0.7,
                markerTextFit: 'both',
                markerTextFitPadding: [3, 3, 3, 3],

                textName: 'MARKER的文字',
                textFaceName: '微软雅黑, monospace',
                textSize: 16,
                textFill: '#000'
              },
            ]
          }
        );
        redMarkers.push(redMarker);

        // blueMarker
        let blueMarkers = [];
        const blueMarker = new maptalks.Marker(
          center.add(0, 0.1),
          {
            symbol: [
              {
                markerType: 'square',
                markerVerticalAlignment: 'middle',
                markerFill: '#00f',
                markerOpacity: 0.7,
                markerTextFit: 'both',
                markerTextFitPadding: [3, 3, 3, 3],

                textName: 'MARKER的文字',
                textFaceName: '微软雅黑, monospace',
                textSize: 16,
                textFill: '#000'
              },
            ]
          }
        );
        blueMarkers.push(blueMarker);

        let redMarkerShown = false;
        function toggleRed(){
          if(redMarkerShown){
            redMarkerShown = false;
            pointLayer.removeGeometry(redMarkers);
          }else{
            redMarkerShown = true;
            pointLayer.addGeometry(redMarkers);
          }
        }
        let blueMarkerShown = false;
        function toggleBlue(){
          if(blueMarkerShown){
            blueMarkerShown = false;
            pointLayer.removeGeometry(blueMarkers);
          }else{
            blueMarkerShown = true;
            pointLayer.addGeometry(blueMarkers);
          }
        }
        // 同时存在两组marker时，移除任一组都会报错；只有一组marker时不会报错
        toggleRed();
        toggleBlue();

        setTimeout(() => {
            toggleRed();
            done();
        }, 300);
    });

    it('should can update marker opacity, fuzhenn/maptalks-ide#3060', done => {
        const layerJSON = {
          "type": "PointLayer",
          "id": "point0",
          "options": {
            "collision": false
          },
          "geometries": [
            {
              "feature": {
                "type": "Feature",
                "geometry": {
                  "type": "Point",
                  "coordinates": [-74.00794082715453, 40.71149086790459]
                },
                "id": "data0",
                "properties": null
              },
              "options": {
                "maxMarkerHeight": 255,
                "maxMarkerWidth": 255
              },
              "symbol": {
                "markerFill": [0.53, 0.77, 0.94, 1],
                "markerFillOpacity": 1,
                "markerHeight": {
                  "type": "exponential",
                  "default": 20,
                  "stops": [[16, 20]]
                },
                "markerHorizontalAlignment": "middle",
                "markerIgnorePlacement": false,
                "markerLineColor": [1, 1, 1, 1],
                "markerLineDasharray": [0, 0, 0, 0],
                "markerLineOpacity": 1,
                "markerLineWidth": 3,
                "markerOpacity": 0.82,
                "markerPitchAlignment": "viewport",
                "markerPlacement": "point",
                "markerRotationAlignment": "viewport",
                "markerType": "ellipse",
                "markerVerticalAlignment": "middle",
                "markerWidth": 20
              }
            }
          ]
        };
        map.setCenter([-74.00794082715453, 40.71149086790459]);
        const pointLayer = maptalks.Layer.fromJSON(layerJSON);
        const geo = pointLayer.getGeometries()[0];
        let count = 0;
        pointLayer.on('canvasisdirty', () => {
            count++;
            geo.updateSymbol({
              markerOpacity: 0.7
            });
            if (count === 2) {
                done();
            }

        });
        pointLayer.addTo(map);
    });

        //更新坐标
    it('should can update Polygon coordinates immediately, maptalks/issues#301', () => {
        const polygon = new maptalks.Polygon([[[-1, 1], [1, 1], [1, -1], [-1, -1], [-1, 1]]]);
        const layer = new PolygonLayer('vector', polygon, {
            style: [
                {
                    filter: true,
                    symbol: {
                        polygonFill: '#f00'
                    }
                }
            ]
        });
        const groupLayer = new GroupGLLayer("group", [layer]);
        groupLayer.addTo(map);
        const coord = polygon.getCoordinates()[0];
        const coord2 = coord.map((s) => {
          s.z = 500;
          return s;
        })

        polygon.setCoordinates([coord2]);
    });


    it('LineString with altitude on Polygon, maptalks/issues#266', done => {
        const symbol = { lineColor: '#f00', lineWidth: 4 };
        const line = new maptalks.LineString([[0.5, 0.5, 10000], [1, 0.5, 10000]], { symbol });
        const polygon = new maptalks.Polygon([
            [0, 0], [1, 0], [1, 1], [0, 1], [0, 0]
        ], {
            symbol: {
                polygonFill: '#0f0'
            }
        });

        const layer = new LineStringLayer('lines', [line]);
        const polygonLayer = new PolygonLayer('polygons', [polygon]);
        const group = new GroupGLLayer('group', [layer, polygonLayer]);
        let count = 0;
        const canvas = map.getRenderer().canvas;
        group.on('layerload', () => {
            count++;
            if (count === 1) {
                const expectedPath = path.join(__dirname, 'fixtures', 'line-altitude', 'expected.png');
                compareExpected(canvas, { expectedPath }, done);
            }
        });
        group.addTo(map);
    });

    it('update PointLayer with style, maptalks/issues#263', done => {
        container.style.width = '512px';
        container.style.height = '512px';
        map.setView({
            center: [121.4954, 31.2385],
            zoom: 14,
        });

        const pointLayer = new PointLayer("point");

        pointLayer.setStyle({
            symbol: [
              {
                markerFill: "#000",
                markerFillOpacity: 0.1,
                markerType: "ellipse",
                markerWidth: 200,
                markerHeight: 200,
              },
              {
                textFaceName: "sans-serif",
                textName: "300",
                textFill: "#22be9e",
                textHorizontalAlignment: "right",
                textSize: 40,
                textDx: 40,
                textDy: -90,
              },
            ],
          });

          const marker1 = new maptalks.Marker([121.475542, 31.233812], {
            id: 100,
            properties: {
              count: 100,
            },
          });

          const marker2 = new maptalks.Marker([121.495542, 31.233812], {
            id: 200,
            properties: {
              count: 200,
            },
          });

          const marker3 = new maptalks.Marker([121.515542, 31.233812], {
            id: 300,
            properties: {
              count: 300,
            },
          });

          pointLayer.addGeometry([marker1, marker2, marker3]);
          const groupLayer = new GroupGLLayer("group", [pointLayer]);
          setTimeout(() => {
            pointLayer.hide();
            pointLayer.setStyle({
              symbol: [
                {
                  markerFill: "#000",
                  markerFillOpacity: 0.1,
                  markerType: "ellipse",
                  markerWidth: 200,
                  markerHeight: 200,
                },
                {
                  textFaceName: "sans-serif",
                  textName: "300",
                  textFill: "#22be9e",
                  textHorizontalAlignment: "right",
                  textSize: 40,
                  textDx: 40,
                  textDy: -90,
                },
              ],
            });
            pointLayer.show();
            setTimeout(() => {
                const canvas = groupLayer.getRenderer().canvas;
                const pixel = readPixel(canvas, canvas.width / 2 + 200, canvas.height / 2);
                assert(pixel[3] > 0);
                done();
            }, 60);

          }, 60);
          groupLayer.addTo(map);
    });

    it('should can update ExtrudePolygonLayer dataConfig', done => {
        map.setPitch(80);
        const polygon = new maptalks.Polygon([
            [0, 0], [1, 0], [1, 1], [0, 1], [0, 0]
        ], {
            symbol: {
                polygonFill: '#0f0'
            },
            properties: {
                height: 80000
            }
        });

        const layer = new ExtrudePolygonLayer('polygons', [polygon]);
        const group = new GroupGLLayer('group', [layer]);
        let count = 0;
        group.on('layerload', () => {
            count++;
            if (count === 2) {
                const canvas = group.getRenderer().canvas;
                const pixel = readPixel(canvas, canvas.width / 2 + 20, canvas.height / 2 - 30);
                assert(pixel[3] === 0);
                layer.updateDataConfig({
                    altitudeProperty: 'height'
                });
            } else if (count === 4) {
                const canvas = group.getRenderer().canvas;
                const pixel = readPixel(canvas, canvas.width / 2 + 20, canvas.height / 2 - 30);
                assert(pixel[3] > 0);
                done();
            }
        });
        group.addTo(map);
    });

    it('should can update ExtrudePolygonLayer material', done => {
        map.setPitch(60);
        const polygon = new maptalks.Polygon([
            [0, 0], [1, 0], [1, 1], [0, 1], [0, 0]
        ], {
            symbol: {
                polygonFill: '#fff'
            },
            properties: {
                height: 20000
            }
        });

        const layer = new ExtrudePolygonLayer('polygons', [polygon], {
            dataConfig: { altitudeProperty: 'height' }
        });
        const group = new GroupGLLayer('group', [layer]);
        let count = 0;
        group.on('layerload', () => {
            count++;
            if (count === 2) {
                const canvas = group.getRenderer().canvas;
                const pixel = readPixel(canvas, canvas.width / 2 + 20, canvas.height / 2 - 20);
                assert(pixel[0] > 0);
                assert(pixel[0] === pixel[1]);
                layer.updateMaterial({
                    baseColorFactor: [1, 0, 0, 1]
                });
            } else if (count === 3) {
                const canvas = group.getRenderer().canvas;
                const pixel = readPixel(canvas, canvas.width / 2 + 20, canvas.height / 2 - 20);
                assert(pixel[0] !== pixel[1]);
                done();
            }
        });
        group.addTo(map);
    });

    it('should can update uvOffsetAnim in ExtrudePolygonLayer', done => {
        map.setPitch(60);
        map.setLights({
            ambient: {
                color: [0.5, 0.5, 0.5]
            },
            directional: {
                color: [0.1, 0.1, 0.1],
                direction: [1, 0, -1],
            }
        });
        const polygon = new maptalks.Polygon([
            [0, 0], [1, 0], [1, 1], [0, 1], [0, 0]
        ], {
            symbol: {
                polygonFill: '#fff'
            },
            properties: {
                height: 20000
            }
        });

        const layer = new ExtrudePolygonLayer('polygons', [polygon], {
            dataConfig: { altitudeProperty: 'height' },
            material: {
                baseColorTexture: 'file://' + path.resolve(__dirname, '../integration/resources/avatar.jpg'),
                uvScale: [0.001, 0.0013],
            }
        });
        const group = new GroupGLLayer('group', [layer]);
        let count = 0;
        let pixel;
        group.on('layerload', () => {
            count++;
            if (count === 3) {
                const canvas = group.getRenderer().canvas;
                pixel = readPixel(canvas, canvas.width / 2 + 20, canvas.height / 2 - 20);
                assert(pixel[3] === 255);
                layer.updateMaterial({
                    uvOffsetAnim: [1, 1]
                });
            } else if (count === 10) {
                const canvas = group.getRenderer().canvas;
                const pixel1 = readPixel(canvas, canvas.width / 2 + 20, canvas.height / 2 - 20);
                assert(pixel1[3] === 255);
                assert.notDeepEqual(pixel1,  pixel);
                done();
            }
        });
        group.addTo(map);
    });

    it('should can update texture in ExtrudePolygonLayer', done => {
        map.setPitch(60);
        const polygon = new maptalks.Polygon([
            [0, 0], [1, 0], [1, 1], [0, 1], [0, 0]
        ], {
            symbol: {
                polygonFill: '#fff'
            },
            properties: {
                height: 20000
            }
        });

        const layer = new ExtrudePolygonLayer('polygons', [polygon], {
            dataConfig: { altitudeProperty: 'height' }
        });
        const group = new GroupGLLayer('group', [layer]);
        let count = 0;
        group.on('layerload', () => {
            count++;
            if (count === 2) {
                layer.updateMaterial({
                    baseColorTexture: 'file://' + path.resolve(__dirname, '../integration/resources/avatar.jpg'),
                });
            } else if (count === 4) {
                const canvas = group.getRenderer().canvas;
                const pixel = readPixel(canvas, canvas.width / 2 + 20, canvas.height / 2 - 20);
                assert(pixel[3] === 255);
                assert(pixel[2] < 100);
                assert(pixel[1] < 100);
                assert(pixel[0] < 100);
                done();
            }
        });
        group.addTo(map);
    });

    it('polygon should can updateSymbol in ExtrudePolygonLayer', done => {
        map.setPitch(60);
        const polygon = new maptalks.Polygon([
            [0, 0], [1, 0], [1, 1], [0, 1], [0, 0]
        ], {
            symbol: {
                polygonFill: '#fff'
            },
            properties: {
                height: 20000
            }
        });

        const layer = new ExtrudePolygonLayer('polygons', [polygon], {
            dataConfig: { altitudeProperty: 'height' }
        });
        const group = new GroupGLLayer('group', [layer]);
        let count = 0;
        group.on('layerload', () => {
            count++;
            if (count === 2) {
                polygon.updateSymbol({
                    polygonFill: '#f00'
                });
            } else if (count === 4) {
                const canvas = group.getRenderer().canvas;
                const pixel = readPixel(canvas, canvas.width / 2 + 20, canvas.height / 2 - 20);
                assert(pixel[1] < 10 && pixel[2] < 10);
                done();
            }
        });
        group.addTo(map);
    });

    it('polygon should can updateSymbol in ExtrudePolygonLayer with shadow, fix fuzhenn/maptalks-ide#3233', done => {
        map.setPitch(60);
        const polygon = new maptalks.Polygon([
            [0, 0], [1, 0], [1, 1], [0, 1], [0, 0]
        ], {
            symbol: {
                polygonFill: '#fff'
            },
            properties: {
                height: 20000
            }
        });

        const layer = new ExtrudePolygonLayer('polygons', [polygon], {
            dataConfig: { altitudeProperty: 'height' }
        });
        const sceneConfig = {
            shadow: {
                type: 'esm',
                enable: true,
                quality: 'high',
                opacity: 1,
                color: [0, 0, 0],
                blurOffset: 1
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        group.on('layerload', () => {
            count++;
            if (count === 2) {
                polygon.updateSymbol({
                    polygonFill: '#f00'
                });
            } else if (count === 4) {
                const canvas = group.getRenderer().canvas;
                const pixel = readPixel(canvas, canvas.width / 2 + 20, canvas.height / 2 - 20);
                assert(pixel[1] < 10 && pixel[2] < 10);
                done();
            }
        });
        group.addTo(map);
    });

    it('should can outline in ExtrudePolygonLayer', done => {
        map.setPitch(60);
        const polygon = new maptalks.Polygon([
            [0, 0], [1, 0], [1, 1], [0, 1], [0, 0]
        ], {
            id: 0,
            symbol: {
                polygonFill: '#f00'
            },
            properties: {
                height: 20000
            }
        });

        const layer = new ExtrudePolygonLayer('polygons', [polygon], {
            dataConfig: { altitudeProperty: 'height' }
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                outline: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        group.on('layerload', () => {
            count++;
            if (count === 2) {
                layer.outline([0]);
            } else if (count === 3) {
                const canvas = group.getRenderer().canvas;
                const pixel = readPixel(canvas, canvas.width / 2 + 20, canvas.height / 2 - 10);
                assert(pixel[0] > 100);
                done();
            }
        });
        group.addTo(map);
    });

    it('should can translate ExtrudePolygon', done => {
        map.setPitch(60);
        const polygon = new maptalks.Polygon([
            [0, 0], [1, 0], [1, 1], [0, 1], [0, 0]
        ], {
            symbol: {
                polygonFill: '#fff'
            },
            properties: {
                height: 20000
            }
        });

        const layer = new ExtrudePolygonLayer('polygons', [polygon], {
            dataConfig: { altitudeProperty: 'height' }
        });
        const group = new GroupGLLayer('group', [layer]);
        let count = 0;
        group.on('layerload', () => {
            count++;
            if (count === 2) {
                const canvas = group.getRenderer().canvas;
                const pixel = readPixel(canvas, canvas.width / 2 + 20, canvas.height / 2 - 10);
                assert(pixel[0] > 0);
                polygon.translate(1, 0);
            } else if (count === 3) {
                const canvas = group.getRenderer().canvas;
                let pixel = readPixel(canvas, canvas.width / 2 + 20, canvas.height / 2 - 10);
                assert(pixel[0] === 0);
                // 移动到了新的位置
                pixel = readPixel(canvas, canvas.width / 2 + 60, canvas.height / 2 - 10);
                assert(pixel[0] > 0);
                done();
            }
        });
        group.addTo(map);
    });

    it('should can update ExtrudePolygon coordinates', done => {
        map.setPitch(60);
        const polygon = new maptalks.Polygon([
            [0, 0], [1, 0], [1, 1], [0, 1], [0, 0]
        ], {
            symbol: {
                polygonFill: '#fff'
            },
            properties: {
                height: 20000
            }
        });

        const layer = new ExtrudePolygonLayer('polygons', [polygon], {
            dataConfig: { altitudeProperty: 'height' }
        });
        const group = new GroupGLLayer('group', [layer]);
        let count = 0;
        group.on('layerload', () => {
            count++;
            if (count === 2) {
                const canvas = group.getRenderer().canvas;
                const pixel = readPixel(canvas, canvas.width / 2 + 20, canvas.height / 2 - 10);
                assert(pixel[0] > 0);
                polygon.setCoordinates([
                    [[1, 0], [2, 0], [2, 1], [1, 1], [1, 0]]
                ]);
            } else if (count === 4) {
                const canvas = group.getRenderer().canvas;
                let pixel = readPixel(canvas, canvas.width / 2 + 20, canvas.height / 2 - 10);
                assert(pixel[0] === 0);
                // 移动到了新的位置
                pixel = readPixel(canvas, canvas.width / 2 + 60, canvas.height / 2 - 10);
                assert(pixel[0] > 0);
                done();
            }
        });
        group.addTo(map);
    });

    it('should can update coordinates of ExtrudePolygon with sideMaterial', done => {
        map.setPitch(60);
        const polygon = new maptalks.Polygon([
            [0, 0], [1, 0], [1, 1], [0, 1], [0, 0]
        ], {
            symbol: {
                polygonFill: '#fff'
            },
            properties: {
                height: 20000
            }
        });

        const material = {
            baseColorFactor: [1, 1, 1, 1]
        };
        const sideMaterial = {
            baseColorFactor: [1, 1, 1, 1]
        };
        const layer = new ExtrudePolygonLayer('polygons', [polygon], {
            dataConfig: { altitudeProperty: 'height' },
            material,
            sideMaterial
        });
        const group = new GroupGLLayer('group', [layer]);
        let count = 0;
        group.on('layerload', () => {
            count++;
            if (count === 2) {
                const canvas = group.getRenderer().canvas;
                const pixel = readPixel(canvas, canvas.width / 2 + 20, canvas.height / 2 - 10);
                assert(pixel[0] > 0);
                polygon.setCoordinates([
                    [[1, 0], [2, 0], [2, 1], [1, 1], [1, 0]]
                ]);
            } else if (count === 4) {
                const canvas = group.getRenderer().canvas;
                let pixel = readPixel(canvas, canvas.width / 2 + 20, canvas.height / 2 - 10);
                assert(pixel[0] === 0);
                // 移动到了新的位置
                pixel = readPixel(canvas, canvas.width / 2 + 60, canvas.height / 2 - 10);
                assert(pixel[0] > 0);
                done();
            }
        });
        group.addTo(map);
    });

    it('should can reset ExtrudePolygonLayer sideMaterial, fuzhenn/maptalks-ide#3299', done => {
        map.setPitch(60);
        const polygon = new maptalks.Polygon([
            [0, 0], [1, 0], [1, 1], [0, 1], [0, 0]
        ], {
            symbol: {
                polygonFill: '#fff'
            },
            properties: {
                height: 20000
            }
        });

        const material = {
            baseColorFactor: [1, 1, 1, 1]
        };
        const sideMaterial = {
            baseColorFactor: [1, 0, 0, 1]
        };
        const layer = new ExtrudePolygonLayer('polygons', [polygon], {
            dataConfig: { altitudeProperty: 'height' },
            material,
            sideMaterial
        });
        const group = new GroupGLLayer('group', [layer]);
        let count = 0;
        group.on('layerload', () => {
            count++;
            if (count === 2) {
                const canvas = group.getRenderer().canvas;
                const pixel = readPixel(canvas, canvas.width / 2 + 20, canvas.height / 2 - 10);
                assert(pixel[1] < 50);
                layer.updateSideMaterial(null);
            } else if (count === 3) {
                const canvas = group.getRenderer().canvas;
                const pixel = readPixel(canvas, canvas.width / 2 + 20, canvas.height / 2 - 10);
                assert(pixel[1] > 50);
                done();
            }
        });
        group.addTo(map);
    });

    it('should can update ExtrudePolygonLayer sideMaterial from none, fuzhenn/maptalks-ide#3299', done => {
        map.setPitch(60);
        const polygon = new maptalks.Polygon([
            [0, 0], [1, 0], [1, 1], [0, 1], [0, 0]
        ], {
            symbol: {
                polygonFill: '#fff'
            },
            properties: {
                height: 20000
            }
        });

        const material = {
            baseColorFactor: [1, 0, 0, 1]
        };
        const sideMaterial = {
            baseColorFactor: [1, 1, 1, 1]
        };
        const layer = new ExtrudePolygonLayer('polygons', [polygon], {
            dataConfig: { altitudeProperty: 'height' },
            material
        });
        const group = new GroupGLLayer('group', [layer]);
        let count = 0;
        group.on('layerload', () => {
            count++;
            if (count === 2) {
                const canvas = group.getRenderer().canvas;
                const pixel = readPixel(canvas, canvas.width / 2 + 20, canvas.height / 2 - 10);
                assert(pixel[1] < 50);
                layer.updateSideMaterial(sideMaterial);
            } else if (count === 3) {
                const canvas = group.getRenderer().canvas;
                const pixel = readPixel(canvas, canvas.width / 2 + 20, canvas.height / 2 - 10);
                assert(pixel[1] > 50);
                done();
            }
        });
        group.addTo(map);
    });

    function assertChangeStyle(done, layer, expectedColor, offset, changeFun, isSetStyle, firstColor) {
        if (typeof offset === 'function') {
            changeFun = offset;
            offset = [0, 0];
            isSetStyle = changeFun;
        }
        let dirty = false;
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width, y = renderer.canvas.height;
        layer.once('canvasisdirty', () => {
            dirty = true;
        });
        let endCount = 3;
        //因为是setStyle时，数据会被清空重绘，所以需要监听两次canvasisdirty
        layer.on(isSetStyle ? 'canvasisdirty' : 'layerload', () => {
            if (!dirty) {
                return;
            }
            count++;
            if (count === 1) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, firstColor || [255, 0, 0, 255]);
                endCount = changeFun(layer) || 3;
            } else if (count === endCount) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2 + offset[0], y / 2 + offset[1]);
                //变成绿色
                assert.deepEqual(pixel, expectedColor);
                done();
            }
        });
        layer.addTo(map);
    }
});
