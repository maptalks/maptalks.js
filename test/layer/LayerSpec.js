describe('#Layer', function() {

    var container;
    var map;
    var tile;
    var center = new Z.Coordinate(118.846825, 32.046534);
    var context = {
        map:map
    };

    beforeEach(function() {
       var setups = commonSetupMap(center);
        container = setups.container;
        map = setups.map;
        context.map = map;
    });

    afterEach(function() {
        removeContainer(container)
    });

    describe('change order of layers', function() {

        it('bring a layer to front', function() {
            var layer1 = new maptalks.TileLayer('1');
            var layer2 = new maptalks.VectorLayer('2');
            var layer3 = new maptalks.VectorLayer('3');

            map.addLayer([layer1, layer2, layer3]);

            expect(map.getLayers()).to.eqlArray([layer1, layer2, layer3]);

            layer1.bringToFront();
            expect(map.getLayers()).to.eqlArray([layer2, layer3, layer1]);

            layer2.bringToFront();
            expect(map.getLayers()).to.eqlArray([layer3, layer1, layer2]);

            layer3.bringToFront();
            expect(map.getLayers()).to.eqlArray([layer1, layer2, layer3]);
        });

        it('bring a layer to back', function() {
            var layer1 = new maptalks.TileLayer('1');
            var layer2 = new maptalks.VectorLayer('2');
            var layer3 = new maptalks.VectorLayer('3');

            map.addLayer([layer1, layer2, layer3]);

            expect(map.getLayers()).to.eqlArray([layer1, layer2, layer3]);

            layer3.bringToBack();
            expect(map.getLayers()).to.eqlArray([layer3, layer1, layer2]);

            layer2.bringToBack();
            expect(map.getLayers()).to.eqlArray([layer2, layer3, layer1]);

            layer3.bringToBack();
            expect(map.getLayers()).to.eqlArray([layer3, layer2, layer1]);
        });

        it('sort layers by map',function() {
            var layer1 = new maptalks.TileLayer('1');
            var layer2 = new maptalks.VectorLayer('2');
            var layer3 = new maptalks.VectorLayer('3');

            map.addLayer([layer1, layer2, layer3]);

            map.sortLayers(['3', '2', '1']);
            expect(map.getLayers()).to.eqlArray([layer3, layer2, layer1]);
        });
    });

    describe('set a mask of a vector marker', function() {
        var mask, mask2;

        beforeEach(function() {
           mask = new maptalks.Marker(map.getCenter(), {
                symbol:{
                    markerType:'ellipse',
                    markerWidth:400,
                    markerHeight:400
                }
            });

            mask2 = new maptalks.Circle(map.getCenter(), 1000);
        });

        it('to a tile layer',function() {
            var tilelayer = new maptalks.TileLayer("tile with mask",{
                urlTemplate:'http://www.aacaward.com/jiema/html/data/aac/{z}/{x}/{y}.png',
                subdomains:[1,2,3,4]
            });
            map.addLayer(tilelayer);
            tilelayer.setMask(mask);
            expect(tilelayer.getMask()).not.to.be.empty();
            tilelayer.removeMask();
            expect(tilelayer.getMask()).not.to.be.ok();

            tilelayer.setMask(mask2);
            expect(tilelayer.getMask()).not.to.be.empty();
            tilelayer.removeMask();
            expect(tilelayer.getMask()).not.to.be.ok();
        });

        it('to a VectorLayer',function() {
            var vectorlayer = new maptalks.VectorLayer("vector with mask");
            map.addLayer(vectorlayer);
            vectorlayer.addGeometry(genAllTypeGeometries());
            vectorlayer.setMask(mask);
            expect(vectorlayer.getMask()).not.to.be.empty();
            vectorlayer.removeMask();
            expect(vectorlayer.getMask()).not.to.be.ok();

            vectorlayer.setMask(mask2);
            expect(vectorlayer.getMask()).not.to.be.empty();
            vectorlayer.removeMask();
            expect(vectorlayer.getMask()).not.to.be.ok();
        });
    });

});
