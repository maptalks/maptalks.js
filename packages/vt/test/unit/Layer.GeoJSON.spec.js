const maptalks = require('maptalks');
const assert = require('assert');
const { GeoJSONVectorTileLayer } = require('../../dist/maptalks.vt.js');
const { GroupGLLayer } = require('@maptalks/gl');
// const deepEqual = require('fast-deep-equal');

const points = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [114.25814, 30.58595] }, properties: { type: 1 } }
    ]
};

describe('GeoJSONVectorTileLayer', () => {
    let map, container;
    beforeEach(() => {
        container = document.createElement('div');
        container.style.width = '400px';
        container.style.height = '300px';
        document.body.appendChild(container);
        map = new maptalks.Map(container, {
            center: [114.25814, 30.58595],
            zoom: 19
        });
    });

    afterEach(() => {
        map.remove();
        document.body.removeChild(container);
    });

    it('should stringify input geojson data', () => {
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: points
        }).addTo(map);
        assert.ok(layer.options.data === points);
        //TODO 改为多图层后，getData返回的数据格式可能会有改变
        assert.equal(layer.getData().features.length, points.features.length);
        assert.ok(points.features[0].id === undefined);
    });

    it('should can setData', () => {
        const layer = new GeoJSONVectorTileLayer('gvt', {
        }).addTo(map);
        layer.setData(points);
        assert.ok(layer.options.data === points);
        //TODO 改为多图层后，getData返回的数据格式可能会有改变
        assert.equal(layer.getData().features.length, points.features.length);
        assert.ok(points.features[0].id === undefined);
    });


    it('should fire workerready event', (done) => {
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: points
        }).addTo(map);
        layer.on('workerready', e => {
            assert.ok(e);
            done();
        });
    });

    it('should can be serialized', done => {
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: points
        });
        const json = layer.toJSON();
        const layer2 = maptalks.Layer.fromJSON(json);
        layer2.on('workerready', e => {
            assert.ok(e);
            assert.ok(layer2.getData().features.length === points.features.length);
            done();
        });
        layer2.addTo(map);
    });

    it('should can serialize GroupGLLayer', done => {
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: points
        });
        const groupLayer = new GroupGLLayer('group', [layer]);
        const json = groupLayer.toJSON();
        const layer2 = maptalks.Layer.fromJSON(json);
        layer2.on('layerload', e => {
            assert.ok(e);
            assert.ok(layer2.getLayers()[0].getData().features.length === points.features.length);
            done();
        });
        layer2.addTo(map);
    });

    it('should can update sceneConfig', () => {
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: points,
            style: [{
                renderPlugin: { type: 'native-point', dataConfig: { type: 'native-point' }, sceneConfig: { foo: 1 } },
                symbol: { markerType: 'square', markerSize: 20 }
            }]
        });
        layer.updateSceneConfig(0, { foo2: 2 });
        assert.deepStrictEqual(layer.options.style[0].renderPlugin.sceneConfig, layer.getComputedStyle()[0].renderPlugin.sceneConfig);
        assert.deepStrictEqual(layer.getStyle()[0].renderPlugin.sceneConfig, layer.getComputedStyle()[0].renderPlugin.sceneConfig);
        assert.deepStrictEqual(layer.options.style[0].renderPlugin.sceneConfig, { foo: 1, foo2: 2 });
    });

    it('should can update sceneConfig with another type of style', () => {
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: points,
            style: {
                $root: '.',
                resources: [],
                style: [
                    {
                        renderPlugin: { type: 'native-point', dataConfig: { type: 'native-point' }, sceneConfig: { foo: 1 } },
                        symbol: { markerType: 'square', markerSize: 20 }
                    }
                ]
            }
        });
        layer.updateSceneConfig(0, { foo2: 2 });
        assert.deepStrictEqual(layer.options.style.style[0].renderPlugin.sceneConfig, layer.getComputedStyle()[0].renderPlugin.sceneConfig);
        assert.deepStrictEqual(layer.getStyle().style[0].renderPlugin.sceneConfig, layer.getComputedStyle()[0].renderPlugin.sceneConfig);
        assert.deepStrictEqual(layer.options.style.style[0].renderPlugin.sceneConfig, { foo: 1, foo2: 2 });
    });

    //TODO 增加url方式的style的测试
});
