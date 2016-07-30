describe('#Geometry.zindex', function() {

    var container;
    var map;
    var tile;
    var center = new Z.Coordinate(118.846825, 32.046534);
    var layer;

    beforeEach(function() {
        var setups = commonSetupMap(center);
        container = setups.container;
        map = setups.map;
        layer = new Z.VectorLayer('canvas');
        map.addLayer(layer);
    });

    afterEach(function() {
        map.removeLayer(layer);
        removeContainer(container)
    });
    var red, green, blue
    function getMarkers() {
        red = new maptalks.Marker(map.getCenter(), {
            symbol : {
                'markerType' : 'ellipse',
                'markerWidth' : 10,
                'markerHeight' : 10,
                'markerFill' : '#f00'
            }
        });
        green = new maptalks.Marker(map.getCenter(), {
            symbol : {
                'markerType' : 'ellipse',
                'markerWidth' : 10,
                'markerHeight' : 10,
                'markerFill' : '#0f0'
            }
        });
        blue = new maptalks.Marker(map.getCenter(), {
            symbol : {
                'markerType' : 'ellipse',
                'markerWidth' : 10,
                'markerHeight' : 10,
                'markerFill' : '#00f'
            }
        });
        return [red, green, blue];
    }

    it('can bringToFront', function (done) {
        var markers = getMarkers();
        var counter = 0;
        layer.on('layerload', function () {
            if (counter === 0) {
                expect(layer).to.be.painted(0, 0, [0, 0, 255]);
                red.bringToFront();
                expect(layer.getGeometries()).to.be.eql([green, blue, red]);
                counter++;
            } else {
                expect(layer).to.be.painted(0, 0, [255, 0, 0]);
                done();
            }
        });
        layer.addGeometry(markers);
    });

    it('can bringToBack', function (done) {
        var markers = getMarkers();
        var counter = 0;
        layer.on('layerload', function () {
            if (counter === 0) {
                expect(layer).to.be.painted(0, 0, [0, 0, 255]);
                blue.bringToBack();
                expect(layer.getGeometries()).to.be.eql([blue, red, green]);
                counter++;
            } else {
                expect(layer).to.be.painted(0, 0, [0, 255, 0]);
                done();
            }
        });
        layer.addGeometry(markers);
    });

    it('can setZIndex', function (done) {
        var markers = getMarkers();
        var counter = 0;
        layer.on('layerload', function () {
            if (counter === 0) {
                expect(layer).to.be.painted(0, 0, [0, 0, 255]);
                blue.setZIndexSilently(-1);
                red.setZIndex(1);
                expect(layer.getGeometries()).to.be.eql([blue, green, red]);
                counter++;
            } else {
                expect(layer).to.be.painted(0, 0, [255, 0, 0]);
                done();
            }
        });
        layer.addGeometry(markers);
    });
});
