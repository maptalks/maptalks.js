const assert = require('assert');
const { readPixel, } = require('../common/Util');
const maptalks = require('maptalks');
const { PointLayer, LineStringLayer, PolygonLayer } = require('../../dist/maptalks.vt.js');
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


describe('vector layers symbol update specs', () => {
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


    it('marker should can update markerWidth and markerHeight', done => {
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

        const layer = new PointLayer('vector', marker);
        const sceneConfig = {
            postProcess: {
                enable: true,
                outline: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig, antialias: false });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width / 2, y = renderer.canvas.height / 2;
        let partialUpdate = false;
        layer.on('partialupdate', () => {
            partialUpdate = true;
        });
        layer.on('canvasisdirty', () => {
            count++;
        });
        let updated = false;
        group.on('layerload', () => {
            if (count >= 1 && !updated) {
                const pixel = readPixel(layer.getRenderer().canvas, x + 20, y);
                //开始中心点往外40，读不到像素
                assert.deepEqual(pixel, [0, 0, 0, 0]);
                marker.updateSymbol({
                    markerWidth: 60,
                    markerHeight: 60
                });
                updated = true;
            } else if (updated && count >= 4) {
                const pixel = readPixel(renderer.canvas, x + 20, y);
                //中心点往外40，能读到像素了
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                assert(!partialUpdate);
                done();
            }
        });
        group.addTo(map);
    });

    it('marker should can update to multiple symbols', done => {
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

        const layer = new PointLayer('vector', marker);
        const sceneConfig = {
            postProcess: {
                enable: true,
                outline: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig, antialias: false });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width / 2, y = renderer.canvas.height / 2;
        layer.on('canvasisdirty', () => {
            count++;
        });
        let updated = false;
        let partialUpdate = false;
        layer.on('partialupdate', () => {
            partialUpdate = true;
        });
        group.on('layerload', () => {
            if (count >= 1 && !updated) {
                const pixel = readPixel(layer.getRenderer().canvas, x + 20, y);
                assert.deepEqual(pixel, [0, 0, 0, 0]);
                const pixel1 = readPixel(renderer.canvas, x, y);
                assert.deepEqual(pixel1, [255, 0, 0, 255]);
                marker.setSymbol([
                    {
                        markerType: 'ellipse',
                        markerFill: '#0f0',
                        markerWidth: 60,
                        markerHeight: 60,
                        markerVerticalAlignment: 'middle',
                        markerOpacity: 1
                    },
                    {
                        markerType: 'ellipse',
                        markerFill: '#f00',
                        markerWidth: 30,
                        markerHeight: 30,
                        markerVerticalAlignment: 'middle',
                        markerOpacity: 1
                    },
                ]);
                updated = true;
            } else if (updated && count >= 3) {
                const pixel = readPixel(renderer.canvas, x + 20, y);
                assert.deepEqual(pixel, [0, 255, 0, 255]);
                const pixel1 = readPixel(renderer.canvas, x, y);
                assert.deepEqual(pixel1, [255, 0, 0, 255]);
                assert(!partialUpdate);
                done();
            }
        });
        group.addTo(map);
    });

    it('marker should can partial update one of multiple symbols', done => {
        const marker = new maptalks.Marker(map.getCenter(), {
            id: 0,
            symbol: [
                {
                    markerType: 'ellipse',
                    markerFill: '#0f0',
                    markerWidth: 60,
                    markerHeight: 60,
                    markerVerticalAlignment: 'middle',
                    markerOpacity: 1
                },
                {
                    markerType: 'ellipse',
                    markerFill: '#f00',
                    markerWidth: 30,
                    markerHeight: 30,
                    markerVerticalAlignment: 'middle',
                    markerOpacity: 1
                }
            ]
        });

        const layer = new PointLayer('vector', marker);
        const sceneConfig = {
            postProcess: {
                enable: true,
                outline: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig, antialias: false });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width / 2, y = renderer.canvas.height / 2;
        layer.on('canvasisdirty', () => {
            count++;
        });
        let updated = false;
        let partialUpdate = false;
        layer.on('partialupdate', () => {
            partialUpdate = true;
        });
        group.on('layerload', () => {
            if (count >= 1 && !updated) {
                const pixel = readPixel(renderer.canvas, x + 38, y);
                assert.deepEqual(pixel, [0, 0, 0, 0]);
                marker.updateSymbol([
                    {
                        markerOpacity: 0.5
                    }
                ]);
                updated = true;
            } else if (updated && count >= 3) {
                const pixel = readPixel(renderer.canvas, x + 20, y);
                assert.deepEqual(pixel, [0, 255, 0, 127]);
                const pixel1 = readPixel(renderer.canvas, x, y);
                assert.deepEqual(pixel1, [255, 0, 0, 255]);
                assert(partialUpdate);
                done();
            }
        });
        group.addTo(map);
    });

    it('marker should can update one of multiple symbols', done => {
        const marker = new maptalks.Marker(map.getCenter(), {
            id: 0,
            symbol: [
                {
                    markerType: 'ellipse',
                    markerFill: '#0f0',
                    markerWidth: 60,
                    markerHeight: 60,
                    markerVerticalAlignment: 'middle',
                    markerOpacity: 1
                },
                {
                    markerType: 'ellipse',
                    markerFill: '#f00',
                    markerWidth: 30,
                    markerHeight: 30,
                    markerVerticalAlignment: 'middle',
                    markerOpacity: 1
                }
            ]
        });

        const layer = new PointLayer('vector', marker);
        const sceneConfig = {
            postProcess: {
                enable: true,
                outline: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig, antialias: false });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width / 2, y = renderer.canvas.height / 2;
        layer.on('canvasisdirty', () => {
            count++;
        });
        let updated = false;
        let partialUpdate = false;
        layer.on('partialupdate', () => {
            partialUpdate = true;
        });
        group.on('layerload', () => {
            if (count >= 1 && !updated) {
                const pixel = readPixel(renderer.canvas, x + 38, y);
                assert.deepEqual(pixel, [0, 0, 0, 0]);
                marker.updateSymbol([
                    {
                        markerWidth: 80
                    }
                ]);
                updated = true;
            } else if (updated && count >= 4) {
                const pixel = readPixel(renderer.canvas, x + 37, y);
                assert.deepEqual(pixel, [0, 255, 0, 255]);
                const pixel1 = readPixel(renderer.canvas, x, y);
                assert.deepEqual(pixel1, [255, 0, 0, 255]);
                assert(!partialUpdate);
                done();
            }
        });
        group.addTo(map);
    });

    it('marker should can partial update with setSymbol', done => {
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

        const layer = new PointLayer('vector', marker);
        const sceneConfig = {
            postProcess: {
                enable: true,
                outline: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig, antialias: false });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width / 2, y = renderer.canvas.height / 2;
        let partialUpdate = false;
        layer.on('partialupdate', () => {
            partialUpdate = true;
        });
        layer.on('canvasisdirty', () => {
            count++;
        });
        let updated = false;
        group.on('layerload', () => {
            if (count >= 1 && !updated) {
                const pixel1 = readPixel(renderer.canvas, x, y);
                assert.deepEqual(pixel1, [255, 0, 0, 255]);
                marker.setSymbol({
                    markerType: 'ellipse',
                    markerFill: '#f00',
                    markerWidth: 30,
                    markerHeight: 30,
                    markerVerticalAlignment: 'middle',
                    // 除了opacity，其他的属性因为会更新atlas，会导致整体更新
                    markerOpacity: 0.5
                });
                updated = true;
            } else if (updated && count >= 3) {
                const pixel = readPixel(renderer.canvas, x, y);
                //中心点往外40，能读到像素了
                assert.deepEqual(pixel, [255, 0, 0, 127]);
                assert(partialUpdate);
                done();
            }
        });
        group.addTo(map);
    });


    it('lineString should can partial update with setSymbol', done => {
        const line = new maptalks.LineString([[-1, 0], [1, 0]], {
            id: 0,
            symbol: {
                lineWidth: 6,
                lineColor: '#f00'
            }
        });

        const layer = new LineStringLayer('vector', line);
        const sceneConfig = {
            postProcess: {
                enable: true,
                outline: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig, antialias: false });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width / 2, y = renderer.canvas.height / 2;
        let partialUpdate = false;
        layer.on('partialupdate', () => {
            partialUpdate = true;
        });
        layer.on('canvasisdirty', () => {
            count++;
        });
        let updated = false;
        group.on('layerload', () => {
            if (count >= 1 && !updated) {
                const pixel = readPixel(layer.getRenderer().canvas, x, y + 6);
                assert.deepEqual(pixel, [0, 0, 0, 0]);
                const pixel1 = readPixel(renderer.canvas, x, y);
                assert.deepEqual(pixel1, [255, 0, 0, 255]);
                line.setSymbol({
                    lineWidth: 18,
                    lineColor: '#0f0'
                });
                updated = true;
            } else if (updated && count >= 3) {
                const pixel = readPixel(renderer.canvas, x, y + 6);
                //中心点往外40，能读到像素了
                assert.deepEqual(pixel, [0, 255, 0, 255]);
                assert(partialUpdate);
                done();
            }
        });
        group.addTo(map);
    });

    it('lineString should can partial update with updateSymbol', done => {
        const line = new maptalks.LineString([[-1, 0], [1, 0]], {
            id: 0,
            symbol: {
                lineWidth: 6,
                lineColor: '#f00'
            }
        });

        const layer = new LineStringLayer('vector', line);
        const sceneConfig = {
            postProcess: {
                enable: true,
                outline: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig, antialias: false });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width / 2, y = renderer.canvas.height / 2;
        let partialUpdate = false;
        layer.on('partialupdate', () => {
            partialUpdate = true;
        });
        layer.on('canvasisdirty', () => {
            count++;
        });
        let updated = false;
        group.on('layerload', () => {
            if (count >= 1 && !updated) {
                const pixel = readPixel(layer.getRenderer().canvas, x, y + 6);
                assert.deepEqual(pixel, [0, 0, 0, 0]);
                const pixel1 = readPixel(renderer.canvas, x, y);
                assert.deepEqual(pixel1, [255, 0, 0, 255]);
                line.updateSymbol({
                    lineWidth: 18,
                    lineColor: '#0f0'
                });
                updated = true;
            } else if (updated && count >= 3) {
                const pixel = readPixel(renderer.canvas, x, y + 6);
                //中心点往外40，能读到像素了
                assert.deepEqual(pixel, [0, 255, 0, 255]);
                assert(partialUpdate);
                done();
            }
        });
        group.addTo(map);
    });

    it('lineString should can update to multiple symbols', done => {
        const line = new maptalks.LineString([[-1, 0], [1, 0]], {
            id: 0,
            symbol: {
                lineWidth: 6,
                lineColor: '#f00'
            }
        });

        const layer = new LineStringLayer('vector', line);
        const sceneConfig = {
            postProcess: {
                enable: true,
                outline: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig, antialias: false });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width / 2, y = renderer.canvas.height / 2;
        let partialUpdate = false;
        layer.on('partialupdate', () => {
            partialUpdate = true;
        });
        layer.on('canvasisdirty', () => {
            count++;
        });
        let updated = false;
        group.on('layerload', () => {
            if (count >= 1 && !updated) {
                const pixel = readPixel(layer.getRenderer().canvas, x, y + 6);
                assert.deepEqual(pixel, [0, 0, 0, 0]);
                const pixel1 = readPixel(renderer.canvas, x, y);
                assert.deepEqual(pixel1, [255, 0, 0, 255]);
                line.setSymbol([
                    {
                        lineWidth: 16,
                        lineColor: '#f00'
                    },
                    {
                        lineWidth: 6,
                        lineColor: '#0f0'
                    }
                ]);
                updated = true;
            } else if (updated && count >= 3) {
                const pixel = readPixel(renderer.canvas, x, y + 6);
                //中心点往外40，能读到像素了
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                const pixel1 = readPixel(renderer.canvas, x, y);
                //中心点往外40，能读到像素了
                assert.deepEqual(pixel1, [0, 255, 0, 255]);
                assert(!partialUpdate);
                done();
            }
        });
        group.addTo(map);
    });

    it('lineString should can partial update to multiple symbols', done => {
        const line = new maptalks.LineString([[-1, 0], [1, 0]], {
            id: 0,
            symbol: [
                {
                    lineWidth: 16,
                    lineColor: '#f00'
                },
                {
                    lineWidth: 6,
                    lineColor: '#0f0'
                }
            ]
        });

        const layer = new LineStringLayer('vector', line);
        const sceneConfig = {
            postProcess: {
                enable: true,
                outline: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig, antialias: false });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width / 2, y = renderer.canvas.height / 2;
        let partialUpdate = false;
        layer.on('partialupdate', () => {
            partialUpdate = true;
        });
        layer.on('canvasisdirty', () => {
            count++;
        });
        let updated = false;
        group.on('layerload', () => {
            if (count >= 1 && !updated) {
                const pixel = readPixel(renderer.canvas, x, y + 6);
                //中心点往外40，能读到像素了
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                const pixel1 = readPixel(renderer.canvas, x, y);
                assert.deepEqual(pixel1, [0, 255, 0, 255]);
                line.updateSymbol([
                    {
                        lineWidth: 16,
                        lineColor: '#00f'
                    }
                ]);
                updated = true;
            } else if (updated && count >= 3) {
                const pixel = readPixel(renderer.canvas, x, y + 6);
                //中心点往外40，能读到像素了
                assert.deepEqual(pixel, [0, 0, 255, 255]);
                const pixel1 = readPixel(renderer.canvas, x, y);
                //中心点往外40，能读到像素了
                assert.deepEqual(pixel1, [0, 255, 0, 255]);
                assert(partialUpdate);
                done();
            }
        });
        group.addTo(map);
    });

    //--------------- Polygons --------------------------------------
    it('polygon should can partial update with setSymbol', done => {
        const polygon = new maptalks.Polygon([[[-1, 1], [1, 1], [1, -1], [-1, -1], [-1, 1]]], {
            id: 0,
            symbol: {
                polygonOpacity: 1,
                polygonFill: '#f00'
            }
        });

        const layer = new PolygonLayer('vector', polygon);
        const sceneConfig = {
            postProcess: {
                enable: true,
                outline: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig, antialias: false });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width / 2, y = renderer.canvas.height / 2;
        let partialUpdate = false;
        layer.on('partialupdate', () => {
            partialUpdate = true;
        });
        layer.on('canvasisdirty', () => {
            count++;
        });
        let updated = false;
        group.on('layerload', () => {
            if (count >= 1 && !updated) {
                const pixel = readPixel(renderer.canvas, x, y);
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                polygon.setSymbol({
                    polygonOpacity: 1,
                    polygonFill: '#0f0'
                });
                updated = true;
            } else if (updated && count >= 3) {
                const pixel = readPixel(renderer.canvas, x, y);
                //中心点往外40，能读到像素了
                assert.deepEqual(pixel, [0, 255, 0, 255]);
                assert(partialUpdate);
                done();
            }
        });
        group.addTo(map);
    });

    it('polygon should can partial update with updateSymbol', done => {
        const polygon = new maptalks.Polygon([[[-1, 1], [1, 1], [1, -1], [-1, -1], [-1, 1]]], {
            id: 0,
            symbol: {
                polygonOpacity: 1,
                polygonFill: '#f00'
            }
        });

        const layer = new PolygonLayer('vector', polygon);
        const sceneConfig = {
            postProcess: {
                enable: true,
                outline: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig, antialias: false });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width / 2, y = renderer.canvas.height / 2;
        let partialUpdate = false;
        layer.on('partialupdate', () => {
            partialUpdate = true;
        });
        layer.on('canvasisdirty', () => {
            count++;
        });
        let updated = false;
        group.on('layerload', () => {
            if (count >= 1 && !updated) {
                const pixel = readPixel(renderer.canvas, x, y);
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                polygon.updateSymbol({
                    polygonOpacity: 1,
                    polygonFill: '#0f0'
                });
                updated = true;
            } else if (updated && count >= 3) {
                const pixel = readPixel(renderer.canvas, x, y);
                //中心点往外40，能读到像素了
                assert.deepEqual(pixel, [0, 255, 0, 255]);
                assert(partialUpdate);
                done();
            }
        });
        group.addTo(map);
    });

    it('polygon should can update to multiple symbols', done => {
        const polygon = new maptalks.Polygon([[[-1, 1], [1, 1], [1, -1], [-1, -1], [-1, 1]]], {
            id: 0,
            symbol: {
                polygonOpacity: 1,
                polygonFill: '#f00'
            }
        });

        const layer = new PolygonLayer('vector', polygon);
        const sceneConfig = {
            postProcess: {
                enable: true,
                outline: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig, antialias: false });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width / 2, y = renderer.canvas.height / 2;
        let partialUpdate = false;
        layer.on('partialupdate', () => {
            partialUpdate = true;
        });
        layer.on('canvasisdirty', () => {
            count++;
        });
        let updated = false;
        group.on('layerload', () => {
            if (count >= 1 && !updated) {
                const pixel = readPixel(renderer.canvas, x, y);
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                polygon.setSymbol([
                    {
                        polygonOpacity: 0.5,
                        polygonFill: '#0f0'
                    },
                    {
                        polygonOpacity: 0.5,
                        polygonFill: '#00f'
                    },
                ]);
                updated = true;
            } else if (updated && count >= 3) {
                const pixel = readPixel(renderer.canvas, x, y);
                //中心点往外40，能读到像素了
                assert(pixel[0] === 0);
                assert(pixel[1] > 50);
                assert(pixel[2] > 50);
                assert(!partialUpdate);
                done();
            }
        });
        group.addTo(map);
    });

    it('polygon should can partial update to multiple symbols', done => {
        const polygon = new maptalks.Polygon([[[-1, 1], [1, 1], [1, -1], [-1, -1], [-1, 1]]], {
            id: 0,
            symbol: [
                {
                    polygonOpacity: 0.5,
                    polygonFill: '#0f0'
                },
                {
                    polygonOpacity: 0.5,
                    polygonFill: '#00f'
                },
            ]
        });

        const layer = new PolygonLayer('vector', polygon);
        const sceneConfig = {
            postProcess: {
                enable: true,
                outline: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig, antialias: false });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width / 2, y = renderer.canvas.height / 2;
        let partialUpdate = false;
        layer.on('partialupdate', () => {
            partialUpdate = true;
        });
        layer.on('canvasisdirty', () => {
            count++;
        });
        let updated = false;
        group.on('layerload', () => {
            if (count >= 1 && !updated) {
                polygon.updateSymbol([
                    null,
                    {
                        polygonOpacity: 0.5,
                        polygonFill: '#f00'
                    }
                ]);
                updated = true;
            } else if (updated && count >= 3) {
                const pixel = readPixel(renderer.canvas, x, y);
                //中心点往外40，能读到像素了
                assert(pixel[0] > 50);
                assert(pixel[1] > 50);
                assert(pixel[2] === 0);
                assert(partialUpdate);
                done();
            }
        });
        group.addTo(map);
    });

    //------- MultiPoint, MultiLineString, MultiPolygon---------------

    it('should can partial update MultiPolygon symbol', done => {
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
        const sceneConfig = {
            postProcess: {
                enable: true,
                outline: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig, antialias: false });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width / 2, y = renderer.canvas.height / 2;
        let partialUpdate = false;
        layer.on('partialupdate', () => {
            partialUpdate = true;
        });
        layer.on('canvasisdirty', () => {
            count++;
        });
        let updated = false;
        group.on('layerload', () => {
            if (count >= 1 && !updated) {
                const pixel = readPixel(layer.getRenderer().canvas, x + 40, y);
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                polygon.updateSymbol({
                    polygonFill: '#0f0'
                });
                updated = true;
            } else if (updated && count === 3) {
                const pixel = readPixel(layer.getRenderer().canvas, x + 40, y);
                assert.deepEqual(pixel, [0, 255, 0, 255]);
                assert(partialUpdate);
                done();
            }
        });
        group.addTo(map);
    });

    it('should can partial update MultiLineString symbol', done => {
        const line = new maptalks.MultiLineString([
            [[-1, 1], [1, 1]],
            [[-1, -1], [1, -1]],
        ]);
        const layer = new LineStringLayer('vector', line, {
            style: [
                {
                    filter: true,
                    symbol: {
                        lineColor: '#f00',
                        lineWidth: 14
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
        const group = new GroupGLLayer('group', [layer], { sceneConfig, antialias: false });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width / 2, y = renderer.canvas.height / 2;
        let partialUpdate = false;
        layer.on('partialupdate', () => {
            partialUpdate = true;
        });
        layer.on('canvasisdirty', () => {
            count++;
        });
        let updated = false;
        group.on('layerload', () => {
            if (count >= 1 && !updated) {
                const pixel = readPixel(layer.getRenderer().canvas, x, y + 40);
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                line.updateSymbol({
                    lineColor: '#0f0'
                });
                updated = true;
            } else if (updated && count === 3) {
                const pixel = readPixel(layer.getRenderer().canvas, x, y + 40);
                assert.deepEqual(pixel, [0, 255, 0, 255]);
                assert(partialUpdate);
                done();
            }
        });
        group.addTo(map);
    });

    it('should can partial update MultiPoint symbol', done => {
        const point = new maptalks.MultiPoint([
            [0, 0], [1, 0]
        ]);
        const layer = new PointLayer('vector', point, {
            style: [
                {
                    filter: true,
                    symbol: {
                        markerType: 'ellipse',
                        markerFill: '#f00',
                        markerWidth: 30,
                        markerHeight: 30,
                        markerVerticalAlignment: 'middle',
                        markerOpacity: 1
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
        const group = new GroupGLLayer('group', [layer], { sceneConfig, antialias: false });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width / 2, y = renderer.canvas.height / 2;
        let partialUpdate = false;
        layer.on('partialupdate', () => {
            partialUpdate = true;
        });
        layer.on('canvasisdirty', () => {
            count++;
        });
        let updated = false;
        group.on('layerload', () => {
            if (count >= 1 && !updated) {
                const pixel = readPixel(layer.getRenderer().canvas, x, y);
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                point.updateSymbol({
                    markerOpacity: 0.5
                });
                updated = true;
            } else if (updated && count === 3) {
                const pixel = readPixel(layer.getRenderer().canvas, x, y);
                assert.deepEqual(pixel, [255, 0, 0, 127]);
                assert(partialUpdate);
                done();
            }
        });
        group.addTo(map);
    });

    it('fn-type symbol is updated', done => {
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

        const layer = new PointLayer('vector', marker);
        const sceneConfig = {
            postProcess: {
                enable: true,
                outline: { enable: true }
            }
        };
        const group = new GroupGLLayer('group', [layer], { sceneConfig, antialias: false });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width / 2, y = renderer.canvas.height / 2;
        let partialUpdate = false;
        layer.on('partialupdate', () => {
            partialUpdate = true;
        });
        layer.on('canvasisdirty', () => {
            count++;
        });
        let updated = false;
        group.on('layerload', () => {
            if (count >= 1 && !updated) {
                const pixel = readPixel(layer.getRenderer().canvas, x + 20, y);
                //开始中心点往外40，读不到像素
                assert.deepEqual(pixel, [0, 0, 0, 0]);
                marker.updateSymbol({
                    markerWidth: { stops: [[1, 140], [20, 1]] },
                    markerHeight: { stops: [[1, 140], [20, 1]] }
                });
                updated = true;
            } else if (updated && count >= 3) {
                const pixel = readPixel(renderer.canvas, x + 20, y);
                //中心点往外40，能读到像素了
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                assert(!partialUpdate);
                done();
            }
        });
        group.addTo(map);
    });

});
