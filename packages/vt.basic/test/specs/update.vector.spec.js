const assert = require('assert');
const { readPixel } = require('../common/Util');
const maptalks = require('maptalks');
const { PointLayer, LineStringLayer, PolygonLayer } = require('@maptalks/vt');
const { GroupGLLayer } = require('@maptalks/gl');
require('../../dist/maptalks.vt.basic');

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
        });
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


    it('should can update properties based text', done => {
        const marker = new maptalks.Marker([0, 0], {
            symbol: {
                textName: '_'
            }
        });

        const layer = new PointLayer('point', marker);
        assertChangeStyle(done, layer, [255, 0, 0, 255], [0, 0], () => {
            marker.setProperties({
                content: '■■■'
            });
            marker.updateSymbol({
                textName: '{content}',
                textFill: '#f00',
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
        layer.on('canvasisdirty', () => {
            count++;
            if (count === 1) {
                line.setCoordinates([[-1, 1], [1, 1]]);
            } else if (count === 3) {
                let pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2 - 50);
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
                assert.deepEqual(pixel, [0, 0, 0, 0]);
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
