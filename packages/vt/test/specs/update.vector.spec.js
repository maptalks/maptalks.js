const path = require('path');
const assert = require('assert');
const { readPixel, compareExpected } = require('../common/Util');
const maptalks = require('maptalks');
const { PointLayer, LineStringLayer, PolygonLayer, GeoJSONVectorTileLayer } = require('../../dist/maptalks.vt.js');
const { GroupGLLayer } = require('@maptalks/gl');


const DEFAULT_VIEW = {
    center: [0, 0],
    zoom: 6,
    pitch: 0,
    bearing: 0,
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
        assertChangeStyle(done, layer, [0, 255, 0, 63], () => {
            marker.updateSymbol({
                markerFill: '#0f0',
                markerOpacity: 0.5
            });
            return 4;
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
        assertChangeStyle(done, layer, [0, 255, 0, 63], () => {
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
        assertChangeStyle(done, layer, [0, 255, 0, 63], () => {
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
        const layer = new LineStringLayer('vector', line,);
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
        const layer = new LineStringLayer('vector', line,);
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
        const layer = new LineStringLayer('vector', line,);
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
                assert(partialUpdate);
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
                assert(partialUpdate);
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
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                polygon.remove();
                removed = true;
            } else if (outlined) {
                const pixel = readPixel(renderer.canvas, x / 2, y / 2);
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
        group.on('layerload', () => {
            if (count >= 1 && !outlined) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                //开始是红色
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                layer.outline([0]);
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
        const layer = new PointLayer('point', [marker0, marker1], { collision: true });
        let count = 0;
        const canvas = map.getRenderer().canvas;
        layer.on('canvasisdirty', () => {
            count++;
            if (count === 1) {
                const expectedPath = path.join(__dirname, 'fixtures', 'collision', 'no-collision.png');
                compareExpected(canvas, { expectedPath });
                layer.options.sceneConfig.collision = true;
                layer.getRenderer().setToRedraw();
            } else if (count === 2) {
                const canvas = map.getRenderer().canvas;
                const expectedPath = path.join(__dirname, 'fixtures', 'collision', 'collision.png');
                compareExpected(canvas, { expectedPath });
                layer.options.sceneConfig.collision = false;
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
