describe('SectorSpec', function() {

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
        document.body.removeChild(container);
    });

    describe('geometry fires events', function() {
        it('svg events', function() {
            var vector = new Z.Sector(center, 1, 0, 270);
            new GeoEventsTester().testSVGEvents(vector, map);
        });

        it('canvas events', function() {
            var vector = new Z.Sector(center, 1, 0, 270);
            new GeoEventsTester().testCanvasEvents(vector, map, vector.getCenter());
        });
    });

    describe('change shape and position',function() {
        it('events',function() {
            var spy = sinon.spy();

            var vector = new Z.Sector(center, 1, 0, 270);
            vector.on('shapechange positionchange',spy);

            function evaluate() {
                var rnd = Math.random()*0.001;
                var coordinates = new Z.Coordinate(center.x+rnd, center.y+rnd);

                vector.setCoordinates(coordinates);
                expect(spy.calledOnce).to.be.ok();
                expect(vector.getCoordinates()).to.eql(coordinates);
                spy.reset();

                var radius = 1000*rnd;
                vector.setRadius(radius);
                expect(spy.calledOnce).to.be.ok();
                expect(radius).to.be(vector.getRadius());
                spy.reset();

                var sangle = 20;
                vector.setStartAngle(sangle);
                expect(spy.calledOnce).to.be.ok();
                expect(sangle).to.be(vector.getStartAngle());
                spy.reset();

                var eangle = 20;
                vector.setEndAngle(eangle);
                expect(spy.calledOnce).to.be.ok();
                expect(eangle).to.be(vector.getEndAngle());
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
            var vector = new Z.Sector(center, 1, 0, 270);
            var shell = vector.getShell();
            expect(shell).to.have.length(vector.options['numberOfPoints']);
        });

        it("but doesn't have holes",function() {
            var vector = new Z.Sector(center, 1, 0, 270);
            var holes = vector.getHoles();
            expect(holes).to.not.be.ok();
        });
    });

    describe('compute length and area',function() {
        it('length',function() {
            var vector = new Z.Sector(center, 1, 0, 270);
            var length = vector.getLength();
            expect(length).to.be.above(0);
        });

        it('area',function() {
            var vector = new Z.Sector(center, 1, 0, 270);
            var area = vector.getArea();
            expect(area).to.be.above(0);
        });
    });

    it('can have various symbols',function() {
        var vector = new Z.Sector(center, 1, 0, 270);
        GeoSymbolTester.testGeoSymbols(vector, map);
    });

    it("Sector._containsPoint", function() {
        layer.clear();
        var geometry = new Z.Sector(center, 10, 90, 405, {
            symbol: {
                'lineWidth': 6
            }
        });
        layer.addGeometry(geometry);

        var spy = sinon.spy();
        geometry.on('click', spy);

        happen.click(canvasContainer, {
            clientX: 400 + 8 + (10 - 3),
            clientY: 300 + 8 - (10 - 2)
        });
        expect(spy.called).to.not.be.ok();

        happen.click(canvasContainer, {
            clientX: 400 + 8,
            clientY: 300 + 8 - 10
        });
        expect(spy.called).to.be.ok();
    });
});
