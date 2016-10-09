// var CommonSpec = require('./CommonSpec');

describe('#Circle', function() {

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
        layer = new maptalks.VectorLayer('v').addTo(map);
    });

    afterEach(function() {
        map.removeLayer(layer);
        removeContainer(container)
    });

    it('setCoordinates', function() {
        var circle = new maptalks.Circle({x: 0, y: 0}, 1);
        circle.setCoordinates({x: 1, y: 1});
        expect(circle.getCoordinates().toArray()).to.be.eql([1, 1])
    });

    it('getCenter', function() {
        var circle = new maptalks.Circle({x: 0, y: 0}, 1);
        var got = circle.getCenter();

        expect(got.x).to.eql(0);
        expect(got.y).to.eql(0);
    });

    it('getExtent', function() {
        var circle = new maptalks.Circle({x: 0, y: 0}, 1);
        var extent = circle.getExtent();
        expect(extent.getWidth()).to.be.above(0);
        expect(extent.getHeight()).to.be.above(0);
    });

    it('getSize', function() {
        var circle = new maptalks.Circle({x: 0, y: 0}, 100);
        layer.addGeometry(circle);
        var size = circle.getSize();

        expect(size.width).to.be.above(0);
        expect(size.height).to.be.above(0);
    });


    it('setRadius/getRadius', function() {
        var circle = new maptalks.Circle({x: 0, y: 0}, 1);

        expect(circle.getRadius()).to.eql(1);

        circle.setRadius(20);

        expect(circle.getRadius()).to.eql(20);
    });

    it('getShell', function() {
        var circle = new maptalks.Circle({x: 0, y: 0}, 1);
        var shell = circle.getShell();

        var num = circle.options.numberOfShellPoints;
        expect(shell).to.have.length(num);
        var sumx = 0, sumy = 0, len = shell.length;
        for (var i = 0; i < len; i++) {
            sumx += shell[i].x;
            sumy += shell[i].y;
        }
        expect(sumx / len).to.be.approx(0);
        expect(sumy / len).to.be.approx(0);
        expect(map.computeLength(shell[0], [0, 0])).to.be.approx(circle.getRadius());
        expect(map.computeLength(shell[num / 4], [0, 0])).to.be.approx(circle.getRadius());
        expect(map.computeLength(shell[num * 3 / 4], [0, 0])).to.be.approx(circle.getRadius());
        expect(map.computeLength(shell[num / 2], [0, 0])).to.be.approx(circle.getRadius());
    });

    describe('geometry fires events', function() {
        it('canvas events', function() {
            var vector = new Z.Circle(center, 1);
            new GeoEventsTester().testCanvasEvents(vector, map, vector.getCenter());
        });
    });

    describe('change shape and position',function() {
        it('events',function() {
            var spy = sinon.spy();

            var vector = new Z.Circle(center, 1);
            vector.on('shapechange positionchange',spy);

            function evaluate() {
                var rnd = Math.random()*0.001;
                var coordinates = new Z.Coordinate(center.x+rnd, center.y+rnd);
                var radius = 1000*rnd;

                vector.setCoordinates(coordinates);
                expect(spy.calledOnce).to.be.ok();
                expect(vector.getCoordinates()).to.eql(coordinates);
                spy.reset();
                vector.setRadius(radius);
                expect(spy.calledOnce).to.be.ok();
                expect(radius).to.be(vector.getRadius());
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
            var vector = new Z.Circle(center,100);
            var shell = vector.getShell();
            expect(shell).to.have.length(vector.options['numberOfShellPoints']);
        });

        it("but doesn't have holes",function() {
            var vector = new Z.Circle(center,100);
            var holes = vector.getHoles();
            expect(holes).to.not.be.ok();
        });

        it("toGeoJSON exported an polygon", function() {
            var vector = new Z.Circle(center,100);
            var geojson = vector.toGeoJSON().geometry ;
            expect(geojson.type).to.be.eql('Polygon');
            expect(geojson.coordinates[0]).to.have.length(vector.options['numberOfShellPoints']);
        });
    });

    describe('compute length and area',function() {
        it('length',function() {
            var vector = new Z.Circle(center,100);
            var result = Math.PI*2*100;
            var length = vector.getLength();
            expect(length).to.be(result);
        });

        it('area',function() {
            var vector = new Z.Circle(center,100);
            var result = Math.PI*100*100;
            var length = vector.getArea();
            expect(length).to.be(result);
        });
    });

    it('can have various symbols',function(done) {
        var vector = new Z.Circle(center,100);
        GeoSymbolTester.testGeoSymbols(vector, map, done);
    });

    it("Circle._containsPoint", function() {

        var geometry = new Z.Circle(center, 10, {
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
