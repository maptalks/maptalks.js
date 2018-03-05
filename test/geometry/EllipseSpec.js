describe('Geometry.Ellipse', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var layer;
    var canvasContainer;

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center, null, {
            width : 800,
            height : 600
        });
        container = setups.container;
        map = setups.map;
        canvasContainer = map._panels.canvasContainer;
        layer = new maptalks.VectorLayer('v').addTo(map);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('setCoordinates', function () {
        var ellipse = new maptalks.Ellipse({ x: 0, y: 0 }, 1, 1);

        ellipse.setCoordinates({ x: -180, y: -75 });
        expect(ellipse.getCoordinates().toArray()).to.be.eql([-180, -75]);
    });

    it('getCenter', function () {
        var ellipse = new maptalks.Ellipse({ x: 0, y: 0 }, 1, 1);
        var got = ellipse.getCenter();

        expect(got.x).to.eql(0);
        expect(got.y).to.eql(0);
    });

    it('getExtent', function () {
        var ellipse = new maptalks.Ellipse({ x: 0, y: 0 }, 1, 1);
        var extent = ellipse.getExtent();
        expect(extent.getWidth()).to.be.above(0);
        expect(extent.getHeight()).to.be.above(0);
    });

    it('getSize', function () {
        var ellipse = new maptalks.Ellipse({ x: 0, y: 0 }, 100, 100);
        layer.addGeometry(ellipse);
        var size = ellipse.getSize();

        expect(size.width).to.be.above(0);
        expect(size.height).to.be.above(0);
    });

    it('getWidth/getHeight]', function () {
        var ellipse = new maptalks.Ellipse({ x: 0, y: 0 }, 1, 1);
        var w = ellipse.getWidth();
        var h = ellipse.getHeight();

        expect(w).to.eql(1);
        expect(h).to.eql(1);
    });

    it('setWidth/setHeight', function () {
        var ellipse = new maptalks.Ellipse({ x: 0, y: 0 }, 1, 1);
        ellipse.setWidth(100);
        ellipse.setHeight(200);
        var w = ellipse.getWidth();
        var h = ellipse.getHeight();

        expect(w).to.eql(100);
        expect(h).to.eql(200);
    });

    it('getShell', function () {
        var ellipse = new maptalks.Ellipse([0, 0], 1000, 800);
        var shell = ellipse.getShell();

        var num = ellipse.options.numberOfShellPoints;
        expect(shell).to.have.length(num);
        var sumx = 0, sumy = 0, len = shell.length;
        for (var i = 0; i < len; i++) {
            sumx += shell[i].x;
            sumy += shell[i].y;
        }
        expect(sumx / len).to.be.approx(0);
        expect(sumy / len).to.be.approx(0);
        expect(map.computeLength(shell[0], [0, 0])).to.be.approx(ellipse.getWidth() / 2);
        expect(map.computeLength(shell[num / 4], [0, 0])).to.be.approx(ellipse.getHeight() / 2);
        expect(map.computeLength(shell[num * 3 / 4], [0, 0])).to.be.approx(ellipse.getHeight() / 2);
        expect(map.computeLength(shell[num / 2], [0, 0])).to.be.approx(ellipse.getWidth() / 2);
    });

    describe('geometry fires events', function () {
        it('canvas events', function () {
            var vector = new maptalks.Ellipse(center, 1, 1);
            new COMMON_GEOEVENTS_TESTOR().testCanvasEvents(vector, map, vector.getCenter());
        });
    });

    describe('change shape and position', function () {
        it('events', function () {
            var spy = sinon.spy();

            var vector = new maptalks.Ellipse(center, 1, 1);
            vector.on('shapechange positionchange', spy);

            function evaluate() {
                var rnd = Math.random() * 0.001;
                var coordinates = new maptalks.Coordinate(center.x + rnd, center.y + rnd);
                var width = 1000 * rnd;
                var height = 500 * rnd;

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
            layer = new maptalks.VectorLayer('id');
            map.addLayer(layer);
            layer.addGeometry(vector);
            evaluate();
            vector.remove();
            //canvas
            layer = new maptalks.VectorLayer('canvas', { render:'canvas' });
            layer.addGeometry(vector);
            map.addLayer(layer);
            evaluate();
        });
    });

    describe('can be treated as a polygon', function () {
        it('has shell', function () {
            var vector = new maptalks.Ellipse(center, 100, 50);
            var shell = vector.getShell();
            expect(shell).to.have.length(vector.options['numberOfShellPoints']);
        });

        it('but doesn\'t have holes', function () {
            var vector = new maptalks.Ellipse(center, 100, 50);
            var holes = vector.getHoles();
            expect(holes).to.be.empty();
        });

        it('toGeoJSON exported an polygon', function () {
            var vector = new maptalks.Ellipse(center, 100, 50);
            var geojson = vector.toGeoJSON().geometry;
            expect(geojson.type).to.be.eql('Polygon');
            expect(geojson.coordinates[0]).to.have.length(vector.options['numberOfShellPoints']);
        });
    });

    it('can have various symbols', function (done) {
        var vector = new maptalks.Ellipse(center, 100, 50);
        COMMON_SYMBOL_TESTOR.testGeoSymbols(vector, map, done);
    });

    it('Ellipse.containsPoint', function () {

        var geometry = new maptalks.Ellipse(center, 20, 10, {
            symbol: {
                'lineWidth': 6
            }
        });
        layer = new maptalks.VectorLayer('id', { 'drawImmediate' : true });
        map.addLayer(layer);
        layer.addGeometry(geometry);

        var p1 = new maptalks.Point(400 + 10 + 4, 300);
        expect(geometry.containsPoint(p1)).not.to.be.ok();

        var p2 = new maptalks.Point(400 + 10 + 2, 300);
        expect(geometry.containsPoint(p2)).to.be.ok();

        var p1 = new maptalks.Point(400, 300 + 5 + 5);
        expect(geometry.containsPoint(p1)).not.to.be.ok();

        var p2 = new maptalks.Point(400, 300 + 5 + 3);
        expect(geometry.containsPoint(p2)).to.be.ok();

    });
});
