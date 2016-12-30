import {
    removeContainer,
    genAllTypeGeometries
} from '../SpecCommon';
import {
    isArray
} from 'core/util';
import Coordinate from 'geo/Coordinate';
import {
    Marker,
    LineString,
    Polygon,
    MultiPoint,
    GeometryCollection
} from 'geometry';
import VectorLayer from 'layer/VectorLayer';

describe('Remove and Hide Geometry', function () {

    var container;
    var map;
    var center = new Coordinate(118.846825, 32.046534);
    var layer;
    var context = {};

    beforeEach(function () {
        container = document.createElement('canvas');
        container.style.width = '800px';
        container.style.height = '600px';
        document.body.appendChild(container);
        var option = {
            zoom: 17,
            center: center
        };
        map = new Map(container, option);

        layer = new VectorLayer('canvas');
        map.addLayer(layer);
        context.layer = layer;
        context.container = container;
    });

    afterEach(function () {
        map.removeLayer(layer);
        removeContainer(container);
    });

    // 测试所有类型Geometry的公共方法
    var geometries = genAllTypeGeometries();

    for (var i = 0, len = geometries.length; i < len; i++) {
        testRemoveHide.call(this, geometries[i], context);
    }

});

function testRemoveHide(geometry, _context) {
    function setupGeometry() {
        if (geometry.getLayer()) {
            geometry.remove();
        }
    }

    function getTestPoints(geometry) {
        var layer = _context.layer,
            map = layer.getMap();
        var coordinates = [
            geometry.getCenter(),
            geometry.getFirstCoordinate(),
            geometry.getLastCoordinate()
        ];
        var points = [];
        for (var i = 0; i < coordinates.length; i++) {
            points.push(map.coordinateToContainerPoint(coordinates[i]))
        }
        return points;
    }

    function isDrawn(p, canvas) {
        var i;
        if (isArray(p)) {
            for (i = 0; i < p.length; i++) {
                if (isDrawn(p[i], canvas)) {
                    return true;
                }
            }
            return false;
        }
        var context = canvas.getContext('2d');
        for (i = -1; i <= 1; i++) {
            for (var ii = -1; ii <= 1; ii++) {
                var imgData = context.getImageData(p.x + i, p.y + ii, 1, 1).data;
                if (imgData[3] > 0) {
                    return true;
                }
            }
        }
        return false;
    }

    function test(fn, done) {
        setupGeometry();
        var layer = _context.layer,
            map = layer.getMap();
        layer.clear();
        layer._clearAllListeners();
        map.setCenter(geometry.getFirstCoordinate());
        if (geometry instanceof Polygon || geometry instanceof LineString) {
            geometry.setSymbol({
                'lineWidth': 2,
                'lineColor': '#000000',
                'lineOpacity': 1,
                'polygonFill': '#000000',
                'polygonOpacity': 1
            });
        }
        var testPoints = getTestPoints(geometry);
        layer.once('layerload', function () {
            if (layer.isEmpty()) {
                return;
            }
            expect(isDrawn(testPoints, _context.container)).to.be.ok();
            layer.once('layerload', function () {
                expect(isDrawn(testPoints, _context.container)).not.to.be.ok();
                done();
            });
            layer.once('remove', function () {
                expect(isDrawn(testPoints, _context.container)).not.to.be.ok();
                done();
            });
            layer.once('hide', function () {
                expect(isDrawn(testPoints, _context.container)).not.to.be.ok();
                done();
            });
            fn();
        });

        layer.addGeometry(geometry);
    }

    var type = geometry.getType();
    context('Type of ' + type + ' geometry', function () {
        it('should be removed', function (done) {
            test(function () {
                geometry.remove();
            }, done);
        });

        it('should be removed by layer', function (done) {
            test(function () {
                _context.layer.removeGeometry(geometry);
            }, done);
        });

        it('should be cleared by layer', function (done) {
            test(function () {
                _context.layer.clear();
            }, done);
        });

        it('should be hided with layer', function (done) {
            test(function () {
                _context.layer.hide();
            }, done);
        });

        it('should be removed with layer', function (done) {
            test(function () {
                _context.layer.remove();
            }, done);
        });

        it('should be removed with layer by map', function (done) {
            test(function () {
                var map = _context.layer.getMap();
                map.removeLayer(_context.layer);
            }, done);
        });

        it('should be hided', function (done) {
            test(function () {
                geometry.hide();
            }, done);
        });

        it('should be removed when it is being edited', function (done) {
            setupGeometry();
            var layer = _context.layer,
                map = layer.getMap();
            layer.config('drawImmediate', true);
            layer.clear();
            map.setCenter(geometry.getFirstCoordinate());
            if (!(geometry instanceof Marker) && !(geometry instanceof MultiPoint)) {
                geometry.setSymbol({
                    'lineWidth': 5,
                    'lineColor': '#000000',
                    'lineOpacity': 1,
                    'polygonFill': '#000000',
                    'polygonOpacity': 1
                });
            } else {
                geometry.setSymbol({
                    'markerType': 'pie',
                    'markerHeight': 24,
                    'markerWidth': 24,
                    'markerFill': '#de3333',
                    'markerLineColor': '#ffffff',
                    'markerLineWidth': 1,
                    'opacity': 1
                });
            }
            var testPoints = getTestPoints(geometry);
            layer.addGeometry(geometry);
            geometry.startEdit();
            var editLayer = (geometry instanceof GeometryCollection) ? geometry.getGeometries()[0]._editor._editStageLayer : geometry._editor._editStageLayer;
            editLayer.once('layerload', function () {
                if (layer.isEmpty()) {
                    return;
                }
                expect(isDrawn(testPoints, _context.container)).to.be.ok();
                layer.on('layerload', function () {
                    if (layer.isEmpty()) {
                        expect(isDrawn(testPoints, _context.container)).not.to.be.ok();
                        layer._clearListeners();
                        done();
                    }
                });
                geometry.remove();
            });
        });
    });
}
