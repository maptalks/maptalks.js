describe('Remove and Hide Geometry', function() {

    var container;
    var map;
    var tile;
    var center = new Z.Coordinate(118.846825, 32.046534);
    var layer;
    var context = {
    };

    beforeEach(function() {
        container = document.createElement('canvas');
        container.style.width = '800px';
        container.style.height = '600px';
        document.body.appendChild(container);
        var option = {
            zoom: 17,
            center: center
        };
        map = new Z.Map(container, option);

        layer = new Z.VectorLayer('canvas');
        map.addLayer(layer);
        context.layer = layer;
        context.container = container;
    });

    afterEach(function() {
        map.removeLayer(layer);
        removeContainer(container);
    });

    // 测试所有类型Geometry的公共方法
    var geometries = genAllTypeGeometries();

    for (var i=0, len = geometries.length;i<len;i++){
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
        if (maptalks.Util.isArray(p)) {
            for (var i = 0; i < p.length; i++) {
                if (isDrawn(p[i], canvas)) {
                    return true;
                }
            }
            return false;
        }
        var context = canvas.getContext('2d');
        for (var i = -1; i <= 1; i++) {
            for (var ii = -1; ii <= 1; ii++) {
                var imgData = context.getImageData(p.x+i, p.y+ii, 1, 1).data;
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
        if (geometry instanceof maptalks.Polygon || geometry instanceof maptalks.LineString) {
            geometry.setSymbol({
                'lineWidth' : 2,
                'lineColor' : '#000000',
                'lineOpacity' : 1,
                'polygonFill' : '#000000',
                'polygonOpacity' : 1
            });
        }
        var testPoints = getTestPoints(geometry);
        layer.once('layerload', function() {
            if (layer.isEmpty()) {
                return;
            }
            expect(isDrawn(testPoints, _context.container)).to.be.ok();
            layer.once('layerload', function() {
                expect(isDrawn(testPoints, _context.container)).not.to.be.ok();
                done();
            });
            layer.once('remove', function() {
                expect(isDrawn(testPoints, _context.container)).not.to.be.ok();
                done();
            });
            layer.once('hide', function() {
                expect(isDrawn(testPoints, _context.container)).not.to.be.ok();
                done();
            });
            fn();
        });

        layer.addGeometry(geometry);
    }

    var type = geometry.getType();
    context('Type of ' + type+' geometry',function() {
        it('should be removed', function(done) {
            test(function() {
                geometry.remove();
            }, done);
        });

        it('should be removed by layer', function(done) {
            test(function() {
                _context.layer.removeGeometry(geometry);
            }, done);
        });

        it('should be cleared by layer', function(done) {
            test(function() {
                _context.layer.clear();
            }, done);
        });

        it('should be hided with layer', function(done) {
            test(function() {
                _context.layer.hide();
            }, done);
        });

        it('should be removed with layer', function(done) {
            test(function() {
                _context.layer.remove();
            }, done);
        });

        it('should be removed with layer by map', function(done) {
            test(function() {
                var map = _context.layer.getMap();
                map.removeLayer(_context.layer);
            }, done);
        });

        it('should be hided',function(done) {
             test(function() {
                geometry.hide();
            }, done);
        });

        it('should be removed when it is being edited', function(done) {
            setupGeometry();
            var layer = _context.layer,
                map = layer.getMap();
            layer.clear();
            map.setCenter(geometry.getFirstCoordinate());
            if (geometry instanceof maptalks.Polygon || geometry instanceof maptalks.LineString) {
                geometry.setSymbol({
                    'lineWidth' : 5,
                    'lineColor' : '#000000',
                    'lineOpacity' : 1,
                    'polygonFill' : '#000000',
                    'polygonOpacity' : 1
                });
            }
            var testPoints = getTestPoints(geometry);
            geometry._enableRenderImmediate();
            layer.addGeometry(geometry);
            geometry.once('editstart', function() {
                if (layer.isEmpty()) {
                    return;
                }
                expect(isDrawn(testPoints, _context.container)).to.be.ok();
                geometry.once('remove', function() {
                    expect(isDrawn(testPoints, _context.container)).not.to.be.ok();
                    done();
                });
                geometry.remove();
            });
            geometry.startEdit();
        });
    });
}
