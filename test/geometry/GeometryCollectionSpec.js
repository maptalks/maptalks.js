describe('GeometryCollectionSpec', function() {

    var container;
    var map;
    var tile;
    var center = new Z.Coordinate(118.846825, 32.046534);
    var layer;

    beforeEach(function() {
        var setups = commonSetupMap(center);
        container = setups.container;
        map = setups.map;
        layer = new Z.VectorLayer('id');
        map.addLayer(layer);
    });

    afterEach(function() {
        map.removeLayer(layer);
        removeContainer(container)
    });

    describe('constructor', function() {

        it('normal constructor', function() {
            var geometries = genAllTypeGeometries();
            var collection = new Z.GeometryCollection(geometries);
            expect(collection.getGeometries()).to.have.length(geometries.length);
        });

        it('can be empty.',function() {
            var collection = new Z.GeometryCollection();
            expect(collection.getGeometries()).to.have.length(0);
            expect(collection.isEmpty()).to.be.ok();
        });

    });

    describe('collection add to layer',function() {
        var layers = [
                    new Z.VectorLayer('geometrycollection_test_svg'),
                    new Z.VectorLayer('geometrycollection_test_canvas',{'render':'canvas'})
                    ];
        for (var i=0, len=layers.length;i<len;i++) {
            var layer = layers[i];
            it('can be add to layer',function() {
                var geometries = genAllTypeGeometries();
                var collection = new Z.GeometryCollection(geometries);
                layer.addGeometry(collection);
                map.addLayer(layer);
            });

            it('can be add to layer already on map',function() {
                map.addLayer(layer);
                var geometries = genAllTypeGeometries();
                var collection = new Z.GeometryCollection(geometries);
                layer.addGeometry(collection);
            });
        }
    });

    describe('update collection',function() {
        it('setSymbol to children geometries', function() {
            var points = genPoints();
            var collection = new maptalks.GeometryCollection(points);
            var symbol = {
                'markeFile' : 'test',
                'markerWidth' : 40,
                'markerHeight' : 50
            };
            collection.setSymbol(symbol);

            var counter = 0;
            collection.forEach(function(geometry) {
                counter++;
                expect(geometry.getSymbol()).to.be.eql(symbol);
            });
            expect(counter).to.be.eql(points.length);
        });

        it('can be updated',function() {
            var geometries = genAllTypeGeometries();
            var collection = new Z.GeometryCollection(geometries);
            collection.setGeometries([]);
            expect(collection.getGeometries()).to.have.length(0);
        });

        var layers = [
                    new Z.VectorLayer('geometrycollection_test_svg'),
                    new Z.VectorLayer('geometrycollection_test_canvas',{'render':'canvas'})
                    ];
        for (var i=0, len=layers.length;i<len;i++) {
            var layer = layers[i];
            it('can be updated after added to layer',function() {
                map.addLayer(layer);
                var geometries = genAllTypeGeometries();
                var collection = new Z.GeometryCollection(geometries);
                layer.addGeometry(collection);

                collection.setGeometries([]);
                expect(collection.getGeometries()).to.have.length(0);
                expect(collection.isEmpty()).to.be.ok();
            });
        }
    });

    describe('test select', function() {
        it('select by properties',function() {
            var points = genPoints();

            var collection = new maptalks.GeometryCollection(points);

            var selection = collection.select('type === "Point" && properties.foo1 > 0 && properties.foo2.indexOf("test") >= 0');

            expect(selection).to.be.an(maptalks.GeometryCollection);
            expect(selection.getGeometries()).to.have.length(points.length);
            for (var i = points.length - 1; i >= 0; i--) {
                expect(selection.getGeometries()[i].toJSON()).to.be.eql(points[i].toJSON());
            }

            expect(collection.select('properties.foo3 === true').getGeometries()).to.have.length(3);

            selection = collection.select('type !== "Point"');
            expect(selection).not.to.be.ok();
        });
    });
});

function genPoints() {
    return [
                new maptalks.Marker([0,0], {
                    properties : {
                        'foo1' : 1,
                        'foo2' : 'test1',
                        'foo3' : true
                    }
                }),
                new maptalks.Marker([0,0], {
                    properties : {
                        'foo1' : 2,
                        'foo2' : 'test2',
                        'foo3' : false
                    }
                }),
                new maptalks.Marker([0,0], {
                    properties : {
                        'foo1' : 3,
                        'foo2' : 'test3',
                        'foo3' : true
                    }
                }),
                new maptalks.Marker([0,0], {
                    properties : {
                        'foo1' : 4,
                        'foo2' : 'test4',
                        'foo3' : true
                    }
                })
            ];
}
