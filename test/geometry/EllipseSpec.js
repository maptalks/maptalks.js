// var CommonSpec = require('./CommonSpec');
describe('EllipseSpec', function() {

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
       canvasContainer = map._panels.canvasContainer;
    });

    afterEach(function() {
        map.removeLayer(layer);
        removeContainer(container)
    });

    describe('geometry fires events', function() {
        it('svg events', function() {
            var vector = new Z.Ellipse(center, 1,1);
            new GeoEventsTester().testSVGEvents(vector, map);
        });

        it('canvas events', function() {
            var vector = new Z.Ellipse(center, 1,1);
            new GeoEventsTester().testCanvasEvents(vector, map, vector.getCenter());
        });
    });

    describe('change shape and position',function() {
        it('events',function() {
            var spy = sinon.spy();

            var vector = new Z.Ellipse(center, 1, 1);
            vector.on('shapechange positionchange',spy);

            function evaluate() {
                var rnd = Math.random()*0.001;
                var coordinates = new Z.Coordinate(center.x+rnd, center.y+rnd);
                var width = 1000*rnd;
                var height = 500*rnd;

                vector.setCoordinates(coordinates);
                expect(spy.calledOnce).to.be.ok();
                expect(vector.getCoordinates()).to.eql(coordinates);
                spy.reset();
                vector.setWidth(width);
                vector.setHeight(height);
                expect(spy.calledTwice).to.be.ok();
                expect(width).to.be(vector.getWidth());
                expect(height).to.be(vector.getHeight());
                spy.reset();
            }

            evaluate();

            //svg
            layer = new Z.VectorLayer('id');
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
            var vector = new Z.Ellipse(center,100,50);
            var shell = vector.getShell();
            expect(shell).to.have.length(vector.options['numberOfShellPoints']);
        });

        it("but doesn't have holes",function() {
            var vector = new Z.Ellipse(center,100,50);
            var holes = vector.getHoles();
            expect(holes).to.not.be.ok();
        });

        it("toGeoJSON exported an polygon", function() {
            var vector = new Z.Ellipse(center,100,50);
            var geojson = vector.toGeoJSON().geometry ;
            expect(geojson.type).to.be.eql('Polygon');
            expect(geojson.coordinates[0]).to.have.length(vector.options['numberOfShellPoints']);
        });
    });

    it('can have various symbols',function() {
        var vector = new Z.Ellipse(center,100,50);
        GeoSymbolTester.testGeoSymbols(vector, map);
    });

    it("Ellipse._containsPoint", function() {

        var geometry = new Z.Ellipse(center, 20, 10, {
            symbol: {
                'lineWidth': 6
            }
        });
        layer = new Z.VectorLayer('id');
        map.addLayer(layer);
        layer.addGeometry(geometry);

        var spy = sinon.spy();
        geometry.on('click', spy);

        happen.click(canvasContainer, {
            clientX: 400 + 8 + 10 + 4,
            clientY: 300 + 8
        });
        expect(spy.called).to.not.be.ok();

        happen.click(canvasContainer, {
            clientX: 400 + 8 + 10 + 2,
            clientY: 300 + 8
        });
        expect(spy.called).to.be.ok();
    });
});
