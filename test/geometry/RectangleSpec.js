describe('RectangleSpec', function() {

    var container;
    var map;
    var tile;
    var center = new Z.Coordinate(118.846825, 32.046534);
    var layer;
    var canvasContainer;

    beforeEach(function() {
        var setups = commonSetupMap(center);
        container = setups.container;
        map = setups.map;
        layer = new Z.VectorLayer('id');
        map.addLayer(layer);
        canvasContainer = map._panels.mapPlatform;
    });

    afterEach(function() {
        map.removeLayer(layer);
        removeContainer(container)
    });

    describe('geometry fires events', function() {
        it('svg events', function() {
            var vector = new Z.Rectangle(center, 1, 1);
            new GeoEventsTester().testSVGEvents(vector, map);
        });

        it('canvas events', function() {
            var vector = new Z.Rectangle(center, 1, 1);
            new GeoEventsTester().testCanvasEvents(vector, map, vector.getCenter());
        });
    });

    describe('change shape and position',function() {
        it('events',function() {
            var spy = sinon.spy();

            var vector = new Z.Rectangle(center, 1, 1);
            vector.on('shapechange positionchange',spy);

            function evaluate() {
                var rnd = Math.random()*0.001;
                var coordinates = new Z.Coordinate(center.x+rnd, center.y+rnd);

                vector.setCoordinates(coordinates);
                expect(spy.calledOnce).to.be.ok();
                expect(vector.getCoordinates()).to.eql(coordinates);
                spy.reset();

                var width = 1000*rnd;
                vector.setWidth(width);
                expect(spy.calledOnce).to.be.ok();
                expect(width).to.be(vector.getWidth());
                spy.reset();

                var height = 1000*rnd;
                vector.setHeight(height);
                expect(spy.calledOnce).to.be.ok();
                expect(width).to.be(vector.getHeight());
                spy.reset();
            }

            evaluate();

            //svg
            layer = new Z.VectorLayer('svg');
            map.addLayer(layer);
            layer.addGeometry(vector);
            evaluate();
            vector.remove();
            //canvas
            layer = new Z.VectorLayer('canvas',{render:'canvas'});
            layer.addGeometry(vector);
            map.addLayer(layer);
            evaluate();
        });
    });

    describe('can be treated as a polygon',function() {
        it('has shell',function() {
            var vector = new Z.Rectangle(center, 1, 1);
            var shell = vector.getShell();
            expect(shell).to.have.length(5);
        });

        it("but doesn't have holes",function() {
            var vector = new Z.Rectangle(center, 1, 1);
            var holes = vector.getHoles();
            expect(holes).to.not.be.ok();
        });
    });

    describe('compute length and area',function() {
        it('length',function() {
            var vector = new Z.Rectangle(center, 1, 1);
            var result = 2*(vector.getWidth()+vector.getHeight());
            var length = vector.getLength();
            expect(length).to.be(result);
        });

        it('area',function() {
            var vector = new Z.Rectangle(center, 1, 1);
            var result = 1;
            var length = vector.getArea();
            expect(length).to.be(result);
        });
    });

    it('can have various symbols',function() {
         var vector = new Z.Rectangle(center, 1, 1);
        GeoSymbolTester.testGeoSymbols(vector, map);
    });
});
