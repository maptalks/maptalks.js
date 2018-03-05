describe('Geometry.Rectangle', function () {

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
        layer = new maptalks.VectorLayer('id');
        map.addLayer(layer);
        canvasContainer = map._panels.allLayers;
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('setCoordinates', function () {
        var rect = new maptalks.Rectangle({ x: 0, y: 0 }, 200, 100);
        rect.setCoordinates([180, -70]);
        expect(rect.getCoordinates().toArray()).to.be.eql([180, -70]);
    });

    it('getCenter', function () {
        var rect = new maptalks.Rectangle({ x: 0, y: 0 }, 200, 100);
        var got = rect.getCenter();
        expect(got).to.closeTo(new maptalks.Coordinate([0.000898, -0.000449]));
    });

    it('getExtent', function () {
        var rect = new maptalks.Rectangle({ x: 0, y: 0 }, 200, 100);
        var extent = rect.getExtent();
        expect(extent.getWidth()).to.be.above(0);
        expect(extent.getHeight()).to.be.above(0);
    });

    it('getSize', function () {
        var rect = new maptalks.Rectangle({ x: 0, y: 0 }, 200, 100);
        layer.addGeometry(rect);
        var size = rect.getSize();

        expect(size.width).to.be.above(0);
        expect(size.height).to.be.above(0);
    });

    it('getNw/getWidth/getHeight', function () {
        var rect = new maptalks.Rectangle({ x: 0, y: 0 }, 200, 100);
        var nw = rect.getCoordinates();
        var w = rect.getWidth();
        var h = rect.getHeight();

        expect(nw).to.eql({ x: 0, y: 0 });
        expect(w).to.eql(200);
        expect(h).to.eql(100);
    });

    it('setNw/getWidth/getHeight', function () {
        var rect = new maptalks.Rectangle({ x: 0, y: 0 }, 200, 100);
        rect.setCoordinates({ x: -180, y: 75 });
        rect.setWidth(401);
        rect.setHeight(201);
        var nw = rect.getCoordinates();
        var w = rect.getWidth();
        var h = rect.getHeight();

        expect(nw).to.eql({ x: -180, y: 75 });
        expect(w).to.eql(401);
        expect(h).to.eql(201);
    });

    it('getShell', function () {
        var rect = new maptalks.Rectangle({ x: 0, y: 0 }, 200, 100);
        layer.addGeometry(rect);
        var points = rect.getShell();

        expect(points).to.have.length(5);
        expect(points[0]).to.eql(points[4]);
    });

    it('containsPoint', function () {
        layer.config('drawImmediate', true);
        layer.clear();
        var geometry = new maptalks.Rectangle(center, 20, 10, {
            symbol: {
                'lineWidth': 6
            }
        });
        layer.addGeometry(geometry);

        var prjExtent = geometry._getPrjExtent();

        var spy = sinon.spy();
        geometry.on('click', spy);

        happen.click(canvasContainer, {
            clientX: 400 + 8,
            clientY: 300 + 8 - 4
        });
        expect(spy.called).to.not.be.ok();

        happen.click(canvasContainer, {
            clientX: 400 + 8,
            clientY: 300 + 8 - 2
        });
        expect(spy.called).to.be.ok();

        expect(prjExtent.equals(geometry._getPrjExtent())).to.be.ok();
    });

    describe('geometry fires events', function () {
        it('events', function () {
            var vector = new maptalks.Rectangle(center, 1, 1);
            new COMMON_GEOEVENTS_TESTOR().testCanvasEvents(vector, map, vector.getCenter());
        });
    });

    describe('symbol test', function () {
        it('symbol with vertex marker', function (done) {
            var symbol = {
                markerType: 'ellipse',
                markerPlacement: 'vertex',
                markerWidth: 8,
                markerHeight: 8,
                markerFill: '#eb5988',
                markerFillOpacity: 1,
                markerLineWidth: 2,
                markerLineOpacity: 1,
                markerLineColor: '#fff',
                polygonFill: '#eb5988',
                polygonOpacity: 0.1,
                lineColor: '#eb5988',
                lineWidth: 2.5
            };

            var vector = new maptalks.Rectangle(center, 100, 200, {
                symbol : symbol
            });

            var layer = new maptalks.VectorLayer('svg');
            map.addLayer(layer);
            layer.on('layerload', function () {
                expect(layer).to.be.painted(1, 1);
                done();
            });
            layer.addGeometry(vector);
        });
    });

    describe('change shape and position', function () {
        it('events', function () {
            var spy = sinon.spy();

            var vector = new maptalks.Rectangle(center, 1, 1);
            vector.on('shapechange positionchange', spy);

            function evaluate() {
                var rnd = Math.random() * 0.001;
                var coordinates = new maptalks.Coordinate(center.x + rnd, center.y + rnd);

                vector.setCoordinates(coordinates);
                expect(spy.calledOnce).to.be.ok();
                expect(vector.getCoordinates()).to.eql(coordinates);
                spy.reset();

                var width = 1000 * rnd;
                vector.setWidth(width);
                expect(spy.calledOnce).to.be.ok();
                expect(width).to.be(vector.getWidth());
                spy.reset();

                var height = 1000 * rnd;
                vector.setHeight(height);
                expect(spy.calledOnce).to.be.ok();
                expect(width).to.be(vector.getHeight());
                spy.reset();
            }

            evaluate();

            //svg
            layer = new maptalks.VectorLayer('svg');
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
            var vector = new maptalks.Rectangle(center, 1, 1);
            var shell = vector.getShell();
            expect(shell).to.have.length(5);
            expect(shell[0].x === center.x && shell[0].y === center.y).to.be.ok();
            expect(shell[1].x > shell[0].x && shell[1].y === shell[0].y).to.be.ok();
            expect(shell[2].x > shell[0].x && shell[2].y < shell[0].y).to.be.ok();
            expect(shell[3].x === shell[0].x && shell[3].y < shell[0].y).to.be.ok();
            expect(shell[4].x === shell[0].x && shell[4].y === shell[0].y).to.be.ok();
        });

        it('but doesn\'t have holes', function () {
            var vector = new maptalks.Rectangle(center, 1, 1);
            var holes = vector.getHoles();
            expect(holes).to.be.empty();
        });

        it('toGeoJSON exported an polygon', function () {
            var vector = new maptalks.Rectangle(center, 1, 1);
            var geojson = vector.toGeoJSON().geometry;
            expect(geojson.type).to.be.eql('Polygon');
            expect(geojson.coordinates[0]).to.have.length(5);
        });
    });

    describe('compute length and area', function () {
        it('length', function () {
            var vector = new maptalks.Rectangle(center, 1, 1);
            var result = 2 * (vector.getWidth() + vector.getHeight());
            var length = vector.getLength();
            expect(length).to.be(result);
        });

        it('area', function () {
            var vector = new maptalks.Rectangle(center, 1, 1);
            var result = 1;
            var length = vector.getArea();
            expect(length).to.be(result);
        });
    });

    it('can have various symbols', function (done) {
        var vector = new maptalks.Rectangle(center, 1, 1);
        COMMON_SYMBOL_TESTOR.testGeoSymbols(vector, map, done);
    });

    describe('rectangle with identity projection', function () {
        var div, imap, layer;
        beforeEach(function () {
            div = document.createElement('div');
        });
        afterEach(function () {
            if (layer) {
                layer.remove();
            }
            if (imap) {
                imap.remove();
            }
        });

        function createMap(fullExtent) {
            imap = new maptalks.Map(div, {
                center:     [0, 0],
                zoom:  4,
                spatialReference : {
                  projection : 'identity',
                  resolutions : [
                    32, 16, 8, 4, 2, 1
                  ],
                  fullExtent : fullExtent
                }
            });
            ilayer = new maptalks.VectorLayer('id');
            imap.addLayer(ilayer);
        }

        it('with reverse full extent', function () {
            createMap({
                'top': 10000,
                'left': -10000,
                'bottom': -10000,
                'right': 10000
            });

            var rectangle = new maptalks.Rectangle([0, 0], 100, 500).addTo(ilayer);
            expect(rectangle.getExtent().toJSON()).to.be.eql({
                xmin : 0,
                xmax : 100,
                ymin : -500,
                ymax : 0
            });
            expect(rectangle.getShell().map(function (c) { return c.toArray() })).to.be.eql([
                [0, 0],
                [100, 0],
                [100, -500],
                [0, -500],
                [0, 0]
            ]);
        });

        it('with in-reverse full extent', function () {
            createMap({
                'top': -10000,
                'left': -10000,
                'bottom': 10000,
                'right': 10000
            });

            var rectangle = new maptalks.Rectangle([0, 0], 100, 500).addTo(ilayer);
            expect(rectangle.getExtent().toJSON()).to.be.eql({
                xmin : 0,
                xmax : 100,
                ymin : 0,
                ymax : 500
            });
            expect(rectangle.getShell().map(function (c) { return c.toArray() })).to.be.eql([
                [0, 0],
                [100, 0],
                [100, 500],
                [0, 500],
                [0, 0]
            ]);
        })
    });
});
