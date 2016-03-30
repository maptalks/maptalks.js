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

});
