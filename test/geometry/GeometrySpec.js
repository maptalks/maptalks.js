import {
    commonSetupMap,
    removeContainer,
    genAllTypeGeometries
} from '../SpecCommon';
import Coordinate from 'geo/Coordinate';
import Extent from 'geo/Extent';
import Size from 'geo/Size';
import {
    Marker,
    Polygon,
    MultiPolygon,
    Geometry
} from 'geometry';
import VectorLayer from 'layer/VectorLayer';

describe('#Geometry', function () {

    var container;
    var map;
    var center = new Coordinate(118.846825, 32.046534);
    var layer;
    var context = {
        map: map,
        layer: layer
    };

    beforeEach(function () {
        var setups = commonSetupMap(center);
        container = setups.container;
        map = setups.map;
        layer = new VectorLayer('canvas');
        map.addLayer(layer);
        context.map = map;
        context.layer = layer;
    });

    afterEach(function () {
        map.removeLayer(layer);
        removeContainer(container);
    });

    it('constructor options', function () {
        it('some common options', function () {
            var symbol = {
                markerFile: 'file',
                // markerWidth: 10,
                markerWidth: 15
            };
            var properties = {
                foo1: 1,
                foo2: 'test',
                foo3: true
            };
            var id = '1';
            var marker = new Marker([0, 0], {
                id: id,
                symbol: symbol,
                properties: properties
            });

            expect(marker.getProperties()).to.be.eql(properties);
            expect(marker.getSymbol()).to.be.eql(symbol);
            expect(marker.getId()).to.be.eql(id);
        });
    });

    // 测试所有类型Geometry的公共方法
    var geometries = genAllTypeGeometries();

    for (var i = 0, len = geometries.length; i < len; i++) {
        registerGeometryCommonTest.call(this, geometries[i], context);
    }

});
//测试Geometry的公共方法
function registerGeometryCommonTest(geometry, _context) {
    function setupGeometry() {
        // var layer = new VectorLayer('common_test_layer');
        if (geometry.getLayer()) {
            geometry.remove();
        }
        _context.layer.addGeometry(geometry);
        // map.addLayer(layer);
    }

    function teardownGeometry() {
        geometry.remove();
        // map.removeLayer('common_test_layer');
    }

    var type = geometry.getType();
    context(type + ':getter and setters.', function () {
        it('id', function () {
            geometry.setId('id');
            var id = geometry.getId();
            expect(id).to.be('id');
            geometry.setId(null);
            expect(geometry.getId()).to.not.be.ok();
        });

        it('Layer', function () {
            expect(geometry.getLayer()).to.not.be.ok();
            var layer = new VectorLayer('id');
            layer.addGeometry(geometry);
            expect(geometry.getLayer()).to.be.ok();
            //delete
            geometry.remove();
            expect(geometry.getLayer()).to.not.be.ok();
        });

        it('Map', function () {
            setupGeometry();

            expect(geometry.getMap()).to.be.ok();

            teardownGeometry();

            expect(geometry.getMap()).to.not.be.ok();
        });

        it('Type', function () {
            var type = geometry.getType();
            expect(type).to.not.be.empty();
        });

        it('flash', function (done) {
            geometry.flash(100, 4, function () {
                done();
            });
        });

        it('Properties', function () {
            var oldProps = geometry.getProperties();

            var propsTest = {
                'foo_num': 1,
                'foo_str': 'str',
                'foo_bool': false
            };
            geometry.setProperties(propsTest);

            var props = geometry.getProperties();
            expect(props).to.eql(propsTest);

            geometry.setProperties(oldProps);
            expect(geometry.getProperties()).to.not.eql(propsTest);
        });

    });

    context(type + ':can be measured.', function () {
        it('it has geodesic length', function () {
            var length = geometry.getLength();
            if (geometry instanceof Marker) {
                expect(length === 0).to.be.ok();
            } else {
                expect(length > 0).to.be.ok();
            }

        });

        it('it has geodesic area', function () {
            var types = [Polygon, MultiPolygon];
            var area = geometry.getArea();
            var hit = false;
            for (var i = 0, len = types.length; i < len; i++) {
                if (geometry instanceof types[i]) {
                    hit = true;
                    break;
                }
            }
            if (!hit) {
                expect(area === 0).to.be.ok();
            } else {
                expect(area > 0).to.be.ok();
            }

        });

        it('it has extent', function () {
            setupGeometry();

            var extent = geometry.getExtent();
            expect(extent).to.be.a(Extent);
            expect(extent).to.not.be.empty();

            teardownGeometry();
        });

        it('it has size', function () {
            setupGeometry();

            var size = geometry.getSize();
            expect(size).to.be.a(Size);
            expect(size.width).to.be.above(0);
            expect(size.height).to.be.above(0);

            teardownGeometry();
        });

        it('it has center', function () {
            var center = geometry.getCenter();
            expect(center).to.be.a(Coordinate);
            expect(center.x).to.be.a('number');
            expect(center.y).to.be.a('number');

            setupGeometry();

            center = geometry.getCenter();
            expect(center).to.be.a(Coordinate);
            expect(center.x).to.be.a('number');
            expect(center.y).to.be.a('number');

            teardownGeometry();
        });
    });

    context(type + ':can show and hide.', function () {
        it('show and hide', function () {
            geometry.show();
            expect(geometry.isVisible()).to.be.ok();
            geometry.hide();
            expect(geometry.isVisible()).to.not.be.ok();

            setupGeometry();

            geometry.show();
            expect(geometry.isVisible()).to.be.ok();
            geometry.hide();
            expect(geometry.isVisible()).to.not.be.ok();

            teardownGeometry();

            geometry.show();
            expect(geometry.isVisible()).to.be.ok();
        });
    });

    context(type + ':copy', function () {
        it('copy', function () {
            var json = geometry.toJSON();

            var cloned = geometry.copy();

            var clonedJson = cloned.toJSON();

            expect(clonedJson).to.eql(json);
        });
    });

    // context(type+':has crs',function() {
    //     it ('can read crs from json',function() {
    //         var json = geometry.toGeoJSON();
    //         json.crs = {
    //             "type" : "cnCoordinateType",
    //             "properties" : {
    //                 "name" : "gcj02"
    //             }
    //         };
    //         var parsed = GeoJSON.toGeometry(json);

    //         expect(parsed.getCRS()).to.eql(json.crs);
    //     });

    //     it ('has crs',function() {
    //         var coordinateType = CRS.GCJ02;
    //         var json = geometry.setCRS(coordinateType).toGeoJSON();
    //         expect(json['crs']).to.be.ok();
    //         expect(json['crs']).to.eql({"type":"cnCoordinateType","properties":{"name":"gcj02"}});
    //     });
    // });

    context(type + ':remove', function () {
        it('remove from layer', function () {
            //layer not on map
            var layer = new VectorLayer('svg');
            layer.addGeometry(geometry);
            expect(geometry.getLayer()).to.be.ok();
            expect(geometry.getMap()).to.not.be.ok();
            geometry.remove();
            expect(geometry.getLayer()).to.not.be.ok();

            setupGeometry();

            expect(geometry.getLayer()).to.be.ok();
            expect(geometry.getMap()).to.be.ok();
            geometry.remove();
            expect(geometry.getLayer()).to.not.be.ok();

            var canvasLayer = new VectorLayer('event_test_canvas', {
                'render': 'canvas'
            });
            canvasLayer.addGeometry(geometry);
            _context.map.addLayer(canvasLayer);

            expect(geometry.getLayer()).to.be.ok();
            expect(geometry.getMap()).to.be.ok();
            geometry.remove();
            expect(geometry.getLayer()).to.not.be.ok();

            teardownGeometry();
        });
    });

    context(type + ':some internal methods should be tested.', function () {
        it('painter', function () {
            setupGeometry();

            var painter = geometry._getPainter();
            expect(painter).to.be.ok();
            geometry.remove();

            var canvasLayer = new VectorLayer('event_test_canvas', {
                'render': 'canvas'
            });
            canvasLayer.addGeometry(geometry);
            _context.map.addLayer(canvasLayer);

            painter = geometry._getPainter();
            expect(painter).to.be.ok();

            teardownGeometry();
        });

        it('getExternalResources', function () {
            var type = geometry.getType();
            var symbol, resource;
            if (type === Geometry.TYPE_POINT) {
                symbol = {
                    'markerFile': 'http://foo.com/foo.png'
                };
                geometry.setSymbol(symbol);
                resource = geometry._getExternalResources();
                expect(resource).to.have.length(1);
                expect(resource[0][0]).to.be(symbol['markerFile']);
            } else {
                symbol = {
                    'polygonPatternFile': 'url(\'http://foo.com/foo.png\')',
                    'linePatternFile': 'url(\'http://foo.com/foo2.png\')',
                };
                geometry.setSymbol(symbol);
                resource = geometry._getExternalResources();
                expect(resource).to.have.length(2);
                expect(resource[0][0]).to.be('http://foo.com/foo.png');
                expect(resource[1][0]).to.be('http://foo.com/foo2.png');
            }
        });

        it('getProjection', function () {
            var projection = geometry._getProjection();
            expect(projection).not.to.be.ok();

            setupGeometry();

            projection = geometry._getProjection();
            expect(projection.code).to.be(_context.map.getProjection().code);

            teardownGeometry();
        });

        it('getMeasurer', function () {
            var measurer = geometry._getMeasurer();
            expect(measurer).to.be(measurer.WGS84Sphere);

            geometry.config('measure', 'identity');

            measurer = geometry._getMeasurer();
            expect(measurer).to.be(measurer.Identity);

            geometry.config('measure', 'baidu');

            measurer = geometry._getMeasurer();
            expect(measurer).to.be(measurer.BaiduSphere);
        });
    });
    var spy;
    context(type + ':map events listeners', function () {
        it('removeZoomCache', function () {
            var map = _context.map;
            map.config('zoomAnimation', false);
            setupGeometry();
            spy = sinon.spy(geometry, '_removeZoomCache');
            map.zoomOut();
            expect(spy.called).to.be.ok();
        });
    });
}
