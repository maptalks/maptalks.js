describe('Geometry.RemoveHide', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var layer;
    var context = {
    };

    beforeEach(function () {
        container = document.createElement('canvas');
        container.style.width = '800px';
        container.style.height = '600px';
        container.width = 800;
        container.height = 600;
        document.body.appendChild(container);
        var option = {
            zoom: 17,
            center: center
        };
        map = new maptalks.Map(container, option);

        layer = new maptalks.VectorLayer('canvas');
        map.addLayer(layer);
        context.layer = layer;
        context.container = container;
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    var geometries = GEN_GEOMETRIES_OF_ALL_TYPES();
    //override marker's default symbol by a 10 * 10 ellipse
    geometries[0].setSymbol({
        markerType: 'ellipse',
        markerWidth: 10,
        markerHeight: 10,
        markerFill: '#000'
    });
    for (var i = 0, len = geometries.length; i < len; i++) {
        testRemoveHide.call(this, geometries[i], context);
    }

});

function getTestPoints(geometry, context) {
    var layer = context.layer,
        map = layer.getMap();
    var coordinates = [
        geometry.getCenter(),
        geometry.getFirstCoordinate(),
        geometry.getLastCoordinate()
    ];
    var points = [];
    for (var i = 0; i < coordinates.length; i++) {
        points.push(map.coordinateToContainerPoint(coordinates[i]));
    }
    return points;
}

function isDrawn(p, canvas) {
    var i;
    if (Array.isArray(p)) {
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

function setupGeometry(geometry) {
    if (geometry.getLayer()) {
        geometry.remove();
    }

}

function test(geometry, context, fn, done) {
    setupGeometry(geometry);
    var layer = context.layer,
        map = layer.getMap();
    layer.clear();
    layer._clearAllListeners();
    map.setCenter(geometry.getFirstCoordinate());
    if (geometry instanceof maptalks.Polygon || geometry instanceof maptalks.LineString ||
        geometry instanceof maptalks.MultiLineString || geometry instanceof maptalks.MultiPolygon) {
        geometry.setSymbol({
            'lineWidth': 2,
            'lineColor': '#000000',
            'lineOpacity': 1,
            'polygonFill': '#000000',
            'polygonOpacity': 1
        });
    }
    var testPoints = getTestPoints(geometry, context);
    layer.once('layerload', function () {
        if (layer.isEmpty()) {
            return;
        }
        expect(isDrawn(testPoints, context.container)).to.be.ok();
        layer.once('layerload', function () {
            expect(isDrawn(testPoints, context.container)).not.to.be.ok();
            done();
        });
        layer.once('remove', function () {
            map.once('frameend', function () {
                expect(isDrawn(testPoints, context.container)).not.to.be.ok();
                done();
            })
        });
        layer.once('hide', function () {
            expect(isDrawn(testPoints, context.container)).not.to.be.ok();
            done();
        });
        fn();
    });

    layer.addGeometry(geometry);
}

function testRemoveHide(geometry, _context) {


    var type = geometry.getType();
    context('Type of ' + type + ' geometry', function () {
        it('should be removed', function (done) {
            test(geometry, _context, function () {
                geometry.remove();
            }, done);
        });


        it('should be removed by layer', function (done) {
            test(geometry, _context, function () {
                _context.layer.removeGeometry(geometry);
            }, done);
        });

        it('should be cleared by layer', function (done) {
            test(geometry, _context, function () {
                _context.layer.clear();
            }, done);
        });

        it('should be hided with layer', function (done) {
            test(geometry, _context, function () {
                _context.layer.hide();
            }, done);
        });

        it('should be removed with layer', function (done) {
            test(geometry, _context, function () {
                _context.layer.remove();
            }, done);
        });

        it('should be removed with layer by map', function (done) {
            test(geometry, _context, function () {
                var map = _context.layer.getMap();
                map.removeLayer(_context.layer);
            }, done);
        });

        it('should be hided', function (done) {
            test(geometry, _context, function () {
                geometry.hide();
            }, done);
        });


        it('should be removed when it is being edited', function (done) {
            setupGeometry(geometry);
            var layer = _context.layer,
                map = layer.getMap();
            layer.config('drawImmediate', true);
            layer.clear();
            map.setCenter(geometry.getFirstCoordinate());
            if (!(geometry instanceof maptalks.Marker) && !(geometry instanceof maptalks.MultiPoint)) {
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
            var testPoints = getTestPoints(geometry, _context);
            layer.addGeometry(geometry);
            geometry.startEdit();
            setTimeout(function () {
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
                setTimeout(function () {
                    //layer throws layerload event right after editLayer in current frame
                    //remove the geometry in the next frame
                    geometry.remove();
                }, 1);
            }, 40);
        });
    });
}
