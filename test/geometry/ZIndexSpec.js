describe('Geometry.zindex', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var layer;

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center);
        container = setups.container;
        map = setups.map;
        layer = new maptalks.VectorLayer('canvas');
        map.addLayer(layer);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });
    var red, green, blue;
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
                counter++;
            } else {
                expect(layer.getGeometries()).to.be.eql([green, blue, red]);
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
                counter++;
            } else {
                expect(layer.getGeometries()).to.be.eql([blue, red, green]);
                expect(layer).to.be.painted(0, 0, [0, 255, 0]);
                done();
            }
        });
        layer.addGeometry(markers);
    });

    it('can bringToBack and bringToFront', function (done) {
        var markers = getMarkers();
        var counter = 0;
        layer.on('layerload', function () {
            if (counter === 0) {
                expect(layer).to.be.painted(0, 0, [0, 0, 255]);
                blue.bringToBack();
                red.bringToFront();
                counter++;
            } else {
                expect(layer.getGeometries()).to.be.eql([blue, green, red]);
                expect(layer).to.be.painted(0, 0, [255, 0, 0]);
                expect(layer.getGeoMaxZIndex()).to.be.eql(1);
                expect(layer.getGeoMinZIndex()).to.be.eql(-1);
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
                counter++;
            } else {
                expect(layer.getGeometries()).to.be.eql([blue, green, red]);
                expect(layer).to.be.painted(0, 0, [255, 0, 0]);
                done();
            }
        });
        layer.addGeometry(markers);
    });

    it('zIndex in options', function (done) {
        var red = new maptalks.Marker(map.getCenter(), {
            symbol : {
                'markerType' : 'ellipse',
                'markerWidth' : 10,
                'markerHeight' : 10,
                'markerFill' : '#f00'
            },
            zIndex : 1,
        });
        var green = new maptalks.Marker(map.getCenter(), {
            symbol : {
                'markerType' : 'ellipse',
                'markerWidth' : 10,
                'markerHeight' : 10,
                'markerFill' : '#0f0'
            },
            zIndex : 0
        });
        layer.on('layerload', function () {
            expect(layer).to.be.painted(0, 0, [255, 0, 0]);
            expect(layer.getGeometries()).to.be.eql([green, red]);
            done();
        });
        layer.addGeometry([red, green]);
    });

    it('zIndex in ser/dser', function (done) {
        var red = new maptalks.Marker(map.getCenter(), {
            symbol : {
                'markerType' : 'ellipse',
                'markerWidth' : 10,
                'markerHeight' : 10,
                'markerFill' : '#f00'
            }
        });
        var green = new maptalks.Marker(map.getCenter(), {
            symbol : {
                'markerType' : 'ellipse',
                'markerWidth' : 10,
                'markerHeight' : 10,
                'markerFill' : '#0f0'
            }
        });
        layer.addGeometry([red, green]);
        red.bringToFront();
        var json = layer.toJSON();

        var layer2 = maptalks.Layer.fromJSON(json);
        layer2.setId('canvas2');

        layer2.on('layerload', function () {
            expect(layer).to.be.painted(0, 0, [255, 0, 0]);
            done();
        });
        map.addLayer(layer2);
    });
});
