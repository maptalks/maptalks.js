describe('Geometry.Altitude', function () {
    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var layer;

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center);
        container = setups.container;
        map = setups.map;
        layer = new maptalks.VectorLayer('id', { 'enableAltitude' : true });
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    describe('render geometry with altitude', function () {
        it('circle', function (done) {
            var circle = new maptalks.Circle(map.getCenter(), 2, {
                properties : { altitude : 200 },
                symbol : {
                    'polygonFill' : '#f00'
                }
            });
            layer.addGeometry(circle);
            map.setPitch(60);
            layer.once('layerload', function () {
                expect(layer).not.to.be.painted(0, 0);
                expect(layer).to.be.painted(0, -192);
                done();
            });
            map.addLayer(layer);
        });

        it('marker', function (done) {
            var marker = new maptalks.Marker(map.getCenter(), {
                properties : { altitude : 100 },
                symbol : {
                    'markerType' : 'ellipse',
                    'markeraltitude' : 6,
                    'markerWidth' : 6
                }
            });
            layer.addGeometry(marker);
            map.setPitch(60);
            layer.once('layerload', function () {
                expect(layer).not.to.be.painted(0, 0);
                expect(layer).to.be.painted(0, -93);
                done();
            });
            map.addLayer(layer);
        });
    });

    describe('draw altitude', function () {
        it('draw altitude of line string', function (done) {
            map.setPitch(60);
            var center = map.getCenter();
            layer.config('drawAltitude', {
                lineWidth : 5,
                lineColor : '#000',
                polygonFill : '#000'
            });
            var line = new maptalks.LineString([center.sub(0.01, 0), center.add(0.01, 0)], {
                properties : { altitude : 20 },
                symbol : {
                    'polygonFill' : '#f00'
                }
            });
            layer.addGeometry(line);
            layer.once('layerload', function () {
                expect(layer).to.be.painted(0, -2, [0, 0, 0]);
                expect(layer).to.be.painted(0, -10, [0, 0, 0]);
                done();
            });
            map.addLayer(layer);
        });

        it('draw altitude of marker', function (done) {
            var marker = new maptalks.Marker(map.getCenter(), {
                properties : { altitude : 100 },
                symbol : {
                    'markerType' : 'ellipse',
                    'markeraltitude' : 6,
                    'markerWidth' : 6
                }
            });
            layer.config('drawAltitude', {
                lineWidth : 5,
                lineColor : '#000'
            });
            layer.addGeometry(marker);
            map.setPitch(60);
            layer.once('layerload', function () {
                expect(layer).to.be.painted(0, -1, [0, 0, 0]);
                expect(layer).to.be.painted(0, -10, [0, 0, 0]);
                done();
            });
            map.addLayer(layer);
        });

        it('draw altitude of marker without altitude prop', function (done) {
            var marker = new maptalks.Marker(map.getCenter(), {
                // properties : { altitude : 100 },
                symbol : {
                    'markerType' : 'ellipse',
                    'markeraltitude' : 6,
                    'markerWidth' : 6
                }
            });
            layer.config('drawAltitude', {
                lineWidth : 5,
                lineColor : '#000'
            });
            layer.addGeometry(marker);
            map.setPitch(60);
            layer.once('layerload', function () {
                expect(layer).to.be.painted(0, 0, [0, 0, 255]);
                expect(layer).not.to.be.painted(0, -10);
                done();
            });
            map.addLayer(layer);
        });
    });
});
