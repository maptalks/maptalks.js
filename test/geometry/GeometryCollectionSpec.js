describe('#GeometryCollection', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var layer;

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center);
        container = setups.container;
        map = setups.map;
        layer = new maptalks.VectorLayer('id');
        map.addLayer(layer);
    });

    afterEach(function () {
        map.removeLayer(layer);
        REMOVE_CONTAINER(container);
    });

    it('getCenter', function () {
        var geometries = GEN_GEOMETRIES_OF_ALL_TYPES();
        var collection = new maptalks.GeometryCollection(geometries);

        expect(collection.getCenter()).to.not.be(null);
    });

    it('getExtent', function () {
        var geometries = GEN_GEOMETRIES_OF_ALL_TYPES();
        var collection = new maptalks.GeometryCollection(geometries);

        var extent = collection.getExtent();
        expect(extent.getWidth()).to.be.above(0);
        expect(extent.getHeight()).to.be.above(0);
    });

    it('getSize', function () {
        var geometries = GEN_GEOMETRIES_OF_ALL_TYPES();
        var collection = new maptalks.GeometryCollection(geometries);
        layer.addGeometry(collection);
        var size = collection.getSize();

        expect(size.width).to.be.above(0);
        expect(size.height).to.be.above(0);
    });

    it('remove', function () {
        var geometries = GEN_GEOMETRIES_OF_ALL_TYPES();
        var collection = new maptalks.GeometryCollection(geometries);
        layer.addGeometry(collection);
        collection.remove();

        expect(collection.getLayer()).to.be(null);
    });

    it('getGeometries/setGeometries', function () {
        var collection = new maptalks.GeometryCollection([]);

        expect(collection.getGeometries()).to.be.empty();

        var geometries = GEN_GEOMETRIES_OF_ALL_TYPES();
        collection.setGeometries(geometries);

        expect(collection.getGeometries()).to.eql(geometries);
    });

    it('isEmpty', function () {
        var collection = new maptalks.GeometryCollection([]);

        expect(collection.isEmpty()).to.be.ok();

        var geometries = GEN_GEOMETRIES_OF_ALL_TYPES();
        collection.setGeometries(geometries);

        expect(collection.isEmpty()).to.not.be.ok();
    });

    it('getExternalResource', function () {
        var collection = new maptalks.GeometryCollection([new maptalks.Marker(center)]);
        var resources = collection._getExternalResources();
        expect(resources).to.have.length(1);
    });

    describe('constructor', function () {

        it('normal constructor', function () {
            var geometries = GEN_GEOMETRIES_OF_ALL_TYPES();
            var collection = new maptalks.GeometryCollection(geometries);
            expect(collection.getGeometries()).to.have.length(geometries.length);
        });

        it('can be empty.', function () {
            var collection = new maptalks.GeometryCollection();
            expect(collection.getGeometries()).to.have.length(0);
            expect(collection.isEmpty()).to.be.ok();
        });

    });

    describe('collection add to layer', function () {
        var layers = [
            new maptalks.VectorLayer('geometrycollection_test_svg'),
            new maptalks.VectorLayer('geometrycollection_test_canvas', { 'render':'canvas' })
        ];
        layers.forEach(function (layer) {
            it('can be add to layer', function () {
                var geometries = GEN_GEOMETRIES_OF_ALL_TYPES();
                var collection = new maptalks.GeometryCollection(geometries);
                layer.addGeometry(collection);
                map.addLayer(layer);
            });

            it('can be add to layer already on map', function () {
                map.addLayer(layer);
                var geometries = GEN_GEOMETRIES_OF_ALL_TYPES();
                var collection = new maptalks.GeometryCollection(geometries);
                layer.addGeometry(collection);
            });
        });
    });

    describe('update collection', function () {
        it('setSymbol to children geometries', function () {
            var points = genPoints();
            var collection = new maptalks.GeometryCollection(points);
            var symbol = {
                'markerFile' : 'test',
                'markerWidth' : 40,
                'markerHeight' : 50
            };
            var expected = {
                'markerFile' : 'http://localhost:9876/test',
                'markerWidth' : 40,
                'markerHeight' : 50
            };

            collection.setSymbol(symbol);

            var counter = 0;
            collection.forEach(function (geometry) {
                counter++;
                expect(geometry.getSymbol()).to.be.eql(expected);
            });
            expect(counter).to.be.eql(points.length);
        });

        it('can be updated', function () {
            var geometries = GEN_GEOMETRIES_OF_ALL_TYPES();
            var collection = new maptalks.GeometryCollection(geometries);
            collection.setGeometries([]);
            expect(collection.getGeometries()).to.have.length(0);
        });

        var layers = [
            new maptalks.VectorLayer('geometrycollection_test_svg'),
            new maptalks.VectorLayer('geometrycollection_test_canvas', { 'render':'canvas' })
        ];
        layers.forEach(function (layer) {
            it('can be updated after added to layer', function () {
                map.addLayer(layer);
                var geometries = GEN_GEOMETRIES_OF_ALL_TYPES();
                var collection = new maptalks.GeometryCollection(geometries);
                layer.addGeometry(collection);

                collection.setGeometries([]);
                expect(collection.getGeometries()).to.have.length(0);
                expect(collection.isEmpty()).to.be.ok();
            });
        });
    });

    describe('test filter', function () {
        it('filter with function', function () {
            var points = genPoints();

            var collection = new maptalks.GeometryCollection(points);

            var selection = collection.filter(function (geometry) {
                return geometry.getType() === 'Point' && geometry.getProperties().foo1 > 0 && geometry.getProperties().foo2.indexOf('test') >= 0;
            });

            expect(selection).to.be.an(maptalks.GeometryCollection);
            expect(selection.getGeometries()).to.have.length(points.length);
            for (var i = points.length - 1; i >= 0; i--) {
                expect(selection.getGeometries()[i].toJSON()).to.be.eql(points[i].toJSON());
            }

            expect(collection.filter(function (geometry) {
                return geometry.getProperties().foo3 === true;
            }).getGeometries()).to.have.length(3);

            selection = collection.filter(function (geometry) {
                return geometry.getType() !== 'Point';
            });
            expect(selection).not.to.be.ok();
        });

        it('filter with feature-filter', function () {
            var points = genPoints();

            var collection = new maptalks.GeometryCollection(points);

            var selection = collection.filter(['in', '$type', 'Point']);

            expect(selection).to.be.an(maptalks.GeometryCollection);
            expect(selection.getGeometries()).to.have.length(points.length);
        });
    });
});

function genPoints() {
    return [
        new maptalks.Marker([0, 0], {
            properties : {
                'foo1' : 1,
                'foo2' : 'test1',
                'foo3' : true
            }
        }),
        new maptalks.Marker([0, 0], {
            properties : {
                'foo1' : 2,
                'foo2' : 'test2',
                'foo3' : false
            }
        }),
        new maptalks.Marker([0, 0], {
            properties : {
                'foo1' : 3,
                'foo2' : 'test3',
                'foo3' : true
            }
        }),
        new maptalks.Marker([0, 0], {
            properties : {
                'foo1' : 4,
                'foo2' : 'test4',
                'foo3' : true
            }
        })
    ];
}
