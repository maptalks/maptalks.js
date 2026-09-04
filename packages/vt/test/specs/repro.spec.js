const path = require('path');
const assert = require('assert');
const { readPixel } = require('../common/Util');
const maptalks = require('maptalks');
const { GeoJSONVectorTileLayer, PointLayer } = require('../../dist/maptalks.vt.js');
require('@maptalks/gpu');

// 本 spec 专门验证 WebGPU(renderer:'gpu') 下 marker/text 单类型渲染 bug，
// 无需外部 mapRenderer 变量，直接固定 gpu renderer 运行：
//   npx electron-mocha -t 12000 --show-window --renderer ./test/specs/repro.spec.js
maptalks.Map.mergeOptions({
    renderer: 'gpu',
    preserveGpuDrawingBuffer: true
});

const point = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', id: 0, geometry: { type: 'Point', coordinates: [0, 0] }, properties: { type: 1 } }
    ]
};

describe('repro: single-type marker (text-only / icon-only)', () => {
    let container, map;
    before(() => {
        container = document.createElement('div');
        container.style.width = '128px';
        container.style.height = '128px';
        document.body.appendChild(container);
    });
    beforeEach(() => {
        map = new maptalks.Map(container, {
            center: [0, 0],
            zoom: 6,
            pitch: 0,
            bearing: 0,
            attribution: false,
            devicePixelRatio: 1,
            lights: {
                ambient: { color: [0.1, 0.1, 0.1] },
                directional: { color: [0.1, 0.1, 0.1], direction: [1, 0, -1] }
            }
        });
    });
    afterEach(() => {
        map.remove();
    });
    after(() => {
        document.body.removeChild(container);
    });

    it('text-only symbol should be drawn (text plugin)', done => {
        const style = [
            {
                filter: { title: '所有数据', value: ['==', 'type', 1] },
                renderPlugin: {
                    type: 'text',
                    dataConfig: { type: 'point', only2D: true },
                    sceneConfig: { collision: false, fading: false }
                },
                symbol: { textOpacity: 1, textSize: 20, textFill: 'rgba(64,92,143,1)', textName: '■', textHaloRadius: 2, textHaloFill: '#f00' }
            }
        ];
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: point,
            style,
            loadingLimit: 0
        });
        layer.once('canvasisdirty', () => {
            setTimeout(() => {
                const canvas = layer.getRenderer().canvas;
                const pixel = readPixel(canvas, canvas.width / 2 + 3, canvas.height / 2);
                console.log('REPRO text pixel', pixel);
                try {
                    assert.deepEqual(pixel, [64, 92, 143, 255]);
                    done();
                } catch (e) {
                    done(e);
                }
            }, 300);
        });
        layer.addTo(map);
    });

    it('icon-only symbol should be drawn (icon plugin)', done => {
        const style = [
            {
                filter: { title: '所有数据', value: ['==', 'type', 1] },
                renderPlugin: {
                    type: 'icon',
                    dataConfig: { type: 'point' },
                    sceneConfig: { collision: false }
                },
                symbol: {
                    markerFile: 'file://' + path.resolve(__dirname, '../integration/resources/plane-min.png'),
                    markerWidth: 30,
                    markerHeight: 30,
                    markerOpacity: 1
                }
            }
        ];
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: point,
            style,
            loadingLimit: 0
        });
        layer.once('canvasisdirty', () => {
            setTimeout(() => {
                const canvas = layer.getRenderer().canvas;
                const pixel = readPixel(canvas, canvas.width / 2, canvas.height / 2);
                console.log('REPRO icon pixel', pixel);
                try {
                    assert(pixel[3] > 0, 'icon center pixel should be opaque, but got ' + JSON.stringify(pixel));
                    done();
                } catch (e) {
                    done(e);
                }
            }, 300);
        });
        layer.addTo(map);
    });
});

describe('repro: PointLayer single-type marker (marker.html demo)', () => {
    let container, map;
    before(() => {
        container = document.createElement('div');
        container.style.width = '128px';
        container.style.height = '128px';
        document.body.appendChild(container);
    });
    beforeEach(() => {
        map = new maptalks.Map(container, {
            center: [0, 0],
            zoom: 6,
            pitch: 0,
            bearing: 0,
            attribution: false,
            devicePixelRatio: 1,
            lights: {
                ambient: { color: [0.1, 0.1, 0.1] },
                directional: { color: [0.1, 0.1, 0.1], direction: [1, 0, -1] }
            }
        });
    });
    afterEach(() => {
        map.remove();
    });
    after(() => {
        document.body.removeChild(container);
    });

    function checkCenterPixel(colorName, pixel, done) {
        console.log('REPRO-PL ' + colorName + ' pixel', pixel);
        // red 椭圆 markerFill: red / markerFillOpacity 0.9
        try {
            assert(pixel[3] > 0, colorName + ' center pixel should be drawn, but got ' + JSON.stringify(pixel));
            assert(pixel[0] > 200 && pixel[1] < 80 && pixel[2] < 80, colorName + ' center pixel should be red-ish, but got ' + JSON.stringify(pixel));
            done();
        } catch (e) {
            done(e);
        }
    }

    it('PointLayer: icon-only symbol (no text config) should be drawn', done => {
        const marker = new maptalks.Marker([0, 0], {
            symbol: {
                markerType: 'ellipse',
                markerFill: 'red',
                markerFillOpacity: 0.9,
                markerWidth: 40,
                markerHeight: 40,
                markerLineWidth: 0
            }
        });
        const layer = new PointLayer('vector', [marker]);
        layer.once('canvasisdirty', () => {
            setTimeout(() => {
                const renderer = layer.getRenderer();
                const meshes = renderer._markerMeshes || [];
                for (let i = 0; i < meshes.length; i++) {
                    const mesh = meshes[i];
                    const geoProps = mesh && mesh.geometry && mesh.geometry.properties;
                    const geoData = mesh && mesh.geometry && mesh.geometry.data;
                    console.log('REPRO-PL icon-only mesh#' + i + ' data keys', geoData && Object.keys(geoData));
                    console.log('REPRO-PL icon-only data.aColorOpacity', geoData && geoData.aColorOpacity && Array.from(geoData.aColorOpacity.array || geoData.aColorOpacity.data || geoData.aColorOpacity));
                    console.log('REPRO-PL icon-only data.aMarkerWidth', geoData && geoData.aMarkerWidth && Array.from(geoData.aMarkerWidth.array || geoData.aMarkerWidth.data || geoData.aMarkerWidth));
                    console.log('REPRO-PL icon-only data.aPickingId', geoData && geoData.aPickingId && Array.from(geoData.aPickingId.array || geoData.aPickingId.data || geoData.aPickingId));
                    console.log('REPRO-PL icon-only mesh#' + i + ' fn props', geoProps && Object.keys(geoProps).filter(k => k.indexOf('_fn_type_') === 0 || k.indexOf('aMarker') === 0 || k === '__markerFnStorageRecords' || k === 'aPickingId'));
                    if (geoProps && geoProps.__markerFnStorageRecords) {
                        console.log('REPRO-PL icon-only records', Array.from(geoProps.__markerFnStorageRecords));
                    }
                    console.log('REPRO-PL icon-only mesh#' + i + ' props', {
                        iconAtlas: geoProps && !!geoProps.iconAtlas,
                        glyphAtlas: geoProps && !!geoProps.glyphAtlas,
                        isEmpty: geoProps && !!geoProps.isEmpty,
                        markerFnStorageMode: geoProps && !!geoProps.markerFnStorageMode,
                        elements: geoProps && geoProps.visElemts && geoProps.visElemts.count,
                        vertexCount: mesh && mesh.geometry && mesh.geometry.getVertexCount && mesh.geometry.getVertexCount()
                    });
                    if (mesh && mesh.defines) {
                        console.log('REPRO-PL icon-only mesh#' + i + ' defines', mesh.defines);
                    }
                }
                const canvas = layer.getRenderer().canvas;
                const pixel = readPixel(canvas, canvas.width / 2, canvas.height / 2);
                checkCenterPixel('icon', pixel, done);
            }, 300);
        });
        layer.addTo(map);
    });

    it('PointLayer: text-only symbol (no marker config) should be drawn', done => {
        const marker = new maptalks.Marker([0, 0], {
            symbol: {
                textFaceName: 'sans-serif',
                textName: 'MapTalks',
                textFill: '#34495e',
                textHaloFill: '#fff',
                textHaloRadius: 2,
                textSize: 20
            }
        });
        const layer = new PointLayer('vector', [marker]);
        layer.once('canvasisdirty', () => {
            setTimeout(() => {
                const canvas = layer.getRenderer().canvas;
                const pixel = readPixel(canvas, canvas.width / 2, canvas.height / 2);
                console.log('REPRO-PL text pixel', pixel);
                try {
                    assert(pixel[3] > 0, 'text center pixel should be drawn, but got ' + JSON.stringify(pixel));
                    done();
                } catch (e) {
                    done(e);
                }
            }, 300);
        });
        layer.addTo(map);
    });

    it('PointLayer: icon + text symbol should be drawn', done => {
        const marker = new maptalks.Marker([0, 0], {
            symbol: {
                markerType: 'ellipse',
                markerFill: 'red',
                markerFillOpacity: 0.9,
                markerWidth: 40,
                markerHeight: 40,
                markerLineWidth: 0,
                textName: 'MapTalks',
                textFill: '#34495e',
                textSize: 20
            }
        });
        const layer = new PointLayer('vector', [marker]);
        layer.once('canvasisdirty', () => {
            setTimeout(() => {
                const canvas = layer.getRenderer().canvas;
                // 文字（'MapTalks'）渲染在 icon 之上并覆盖中心点，中心像素为文本色 [#34495e]，
                // 因此在 icon 上半部（偏离中心）采样红色椭圆像素
                const pixel = readPixel(canvas, canvas.width / 2 - 12, canvas.height / 2 - 12);
                console.log('REPRO-PL icon+text pixel', pixel);
                try {
                    assert(pixel[3] > 0, 'icon+text center pixel should be drawn, but got ' + JSON.stringify(pixel));
                    assert(pixel[0] > 200 && pixel[1] < 80 && pixel[2] < 80, 'icon+text pixel should be red-ish, but got ' + JSON.stringify(pixel));
                    done();
                } catch (e) {
                    done(e);
                }
            }, 300);
        });
        layer.addTo(map);
    });
});
