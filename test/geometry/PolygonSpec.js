describe('Geometry.Polygon', function () {

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
        canvasContainer = map._panels.canvasContainer;
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('getCenter', function () {
        var rings = [
            [
                { x: -1, y: 1 },
                { x: 1, y: 1 },
                { x: 1, y: -1 },
                { x: -1, y: -1 }
            ]
        ];
        var polygon = new maptalks.Polygon(rings);
        var got = polygon.getCenter();

        expect(got).to.closeTo(new maptalks.Coordinate([0, 0]));
    });

    it('get center in extent', function () {
        var rings = [
            [
                { x: -1, y: 1 },
                { x: 1, y: 1 },
                { x: 1, y: -1 },
                { x: -1, y: -1 }
            ]
        ];
        var polygon = new maptalks.Polygon(rings);
        var got = polygon.getCenterInExtent(new maptalks.Extent(0, 0, 0.5, 0.5));

        expect(got).to.closeTo(new maptalks.Coordinate([0.25, 0.25]));
    });

    it('getCenter of an empty polygon', function () {
        var polygon = new maptalks.Polygon([[]]);
        var got = polygon.getCenter();
        expect(got).not.to.be.ok();
    });

    it('getExtent', function () {
        var rings = [
            [
                { x: 20, y: 0 },
                { x: 20, y: 10 },
                { x: 0, y: 10 },
                { x: 0, y: 0 }
            ]
        ];
        var polygon = new maptalks.Polygon(rings);

        var extent = polygon.getExtent();
        expect(extent.getWidth()).to.be.above(0);
        expect(extent.getHeight()).to.be.above(0);
    });

    it('getSize', function () {
        var rings = [
            [
                { x: 20, y: 0 },
                { x: 20, y: 10 },
                { x: 0, y: 10 },
                { x: 0, y: 0 }
            ]
        ];
        var polygon = new maptalks.Polygon(rings);
        layer.addGeometry(polygon);
        var size = polygon.getSize();

        expect(size.width).to.be.above(0);
        expect(size.height).to.be.above(0);
    });

    it('getCoordinates', function () {
        var rings = [
            { x: 20, y: 0 },
            { x: 20, y: 10 },
            { x: 0, y: 10 },
            { x: 0, y: 0 }
        ];
        var holes = [
            { x: 1, y: 1 },
            { x: 3, y: 2 },
            { x: 2, y: 3 }
        ];
        var polygon = new maptalks.Polygon([rings, holes]);

        rings.push(rings[0]);
        holes.push(holes[0]);
        expect(polygon.getCoordinates()[0]).to.eql(rings);
        expect(polygon.getCoordinates()[1]).to.eql(holes);
    });

    it('setCoordinates', function () {
        var rings = [
            { x: 20, y: 0 },
            { x: 20, y: 10 },
            { x: 0, y: 10 },
            { x: 0, y: 0 }
        ];
        var holes = [
            { x: 1, y: 1 },
            { x: 3, y: 2 },
            { x: 2, y: 3 }
        ];
        var polygon = new maptalks.Polygon([[]]);
        polygon.setCoordinates([rings, holes]);

        rings.push(rings[0]);
        holes.push(holes[0]);
        expect(polygon.getCoordinates()[0]).to.eql(rings);
        expect(polygon.getCoordinates()[1]).to.eql(holes);
    });

    it('hasHoles', function () {
        var rings = [
            { x: 20, y: 0 },
            { x: 20, y: 10 },
            { x: 0, y: 10 },
            { x: 0, y: 0 }
        ];
        var holes = [
            { x: 1, y: 1 },
            { x: 3, y: 2 },
            { x: 2, y: 3 }
        ];
        var polygon = new maptalks.Polygon([rings]);

        expect(polygon.hasHoles()).to.not.be.ok();

        polygon.setCoordinates([rings, holes]);

        expect(polygon.hasHoles()).to.be.ok();
    });

    describe('creation', function () {

        it('normal constructor', function () {
            var points = [
                [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]],
                [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]
            ];
            var polygon = new maptalks.Polygon(points);
            var coordinates = polygon.getCoordinates();
            expect(coordinates).to.have.length(points.length);
            var geojsonCoordinates = maptalks.Coordinate.toNumberArrays(coordinates);
            expect(geojsonCoordinates).to.eql(points);
        });

        it('can be empty.', function () {
            var polygon = new maptalks.Polygon();
            expect(polygon.getCoordinates()).to.have.length(0);
        });

    });

    describe('getCenter', function () {
        it('should return center', function () {
            var polygon = new maptalks.Polygon([[
                { x: 0, y: 0 },
                { x: 0, y: 10 },
                { x: 10, y: 10 },
                { x: 10, y: 0 }
            ]]);
            layer.addGeometry(polygon);

            expect(polygon.getCenter()).to.be.closeTo({ x:5, y: 5 });
        });
    });

    it('getExtent', function () {
        var polygon = new maptalks.Polygon([
            [
                { x: 0, y: 0 },
                { x: 0, y: 10 },
                { x: 10, y: 10 },
                { x: 10, y: 0 }
            ]
        ]);
        layer.addGeometry(polygon);
        var extent = polygon.getExtent();
        var delta = 1e-6;

        expect(extent.xmin).to.be.within(0 - delta, 0 + delta);
        expect(extent.xmax).to.be.within(10 - delta, 10 + delta);
        expect(extent.ymin).to.be.within(0 - delta, 0 + delta);
        expect(extent.ymax).to.be.within(10 - delta, 10 + delta);
    });

    describe('geometry fires events', function () {

        it('canvas events', function () {
            var points = [
                [
                    { x: 0, y: 0 },
                    { x: 0, y: 10 },
                    { x: 10, y: 10 },
                    { x: 10, y: 0 }
                ]
            ];
            var vector = new maptalks.Polygon(points);
            new COMMON_GEOEVENTS_TESTOR().testCanvasEvents(vector, map, vector.getCenter());
        });
    });

    it('can have various symbols', function (done) {
        var points = [
            [
                { x: 0, y: 0 },
                { x: 0, y: 10 },
                { x: 10, y: 10 },
                { x: 10, y: 0 }
            ]
        ];
        var vector = new maptalks.Polygon(points);
        COMMON_SYMBOL_TESTOR.testGeoSymbols(vector, map, done);
    });

    it('Polygon._containsPoint', function () {
        layer.config('drawImmediate', true);
        layer.clear();
        var geometry = new maptalks.Polygon([[
            new maptalks.Coordinate([center.x, center.y + 0.001]),
            new maptalks.Coordinate([center.x, center.y]),
            new maptalks.Coordinate([center.x + 0.002, center.y])
        ]], {
            symbol: {
                'lineWidth': 6,
                'polygonOpacity' : 0,
                'lineOpacity' : 0
            }
        });
        layer.addGeometry(geometry);

        var spy = sinon.spy();
        geometry.on('click', spy);

        happen.click(canvasContainer, {
            clientX: 400 + 8 - 3,
            clientY: 300 + 8
        });
        expect(spy.called).to.not.be.ok();

        happen.click(canvasContainer, {
            clientX: 400 + 8 - 2,
            clientY: 300 + 8
        });
        expect(spy.called).to.be.ok();
    });

    it('Polygon._containsPoint with dynamic linewidth', function () {
        layer.config('drawImmediate', true);
        layer.clear();
        var geometry = new maptalks.Polygon([[
            new maptalks.Coordinate([center.x, center.y + 0.001]),
            new maptalks.Coordinate([center.x, center.y]),
            new maptalks.Coordinate([center.x + 0.002, center.y])
        ]], {
            symbol: {
                'lineWidth': { stops : [[0, 1], [12, 8]] }
            }
        });
        layer.addGeometry(geometry);

        var spy = sinon.spy();
        geometry.on('click', spy);

        happen.click(canvasContainer, {
            clientX: 400 + 8,
            clientY: 300 + 8
        });
        expect(spy.called).to.be.ok();
    });

    it('can be a anti-meridian polygon', function () {
        var points = [
            [[179, 10], [-170, 10], [-169, -10], [179, -10]],
            [[180, 5], [-175, 5], [-171, -5], [180, -5]]
        ];
        var vector = new maptalks.Polygon(points, { antiMeridian : 'continuous', });
        layer.addGeometry(vector);

        var points2 = [
            [[179, 10], [168, 10], [167, -10], [179, -10]]
        ];
        var comparison = new maptalks.Polygon(points2);
        layer.addGeometry(comparison);

        var size = vector.getSize();
        var compared = comparison.getSize();
        expect(size.width).to.be.approx(compared.width);
        expect(size.height).to.be.approx(compared.height);

        // expect(vector.getLength()).to.be.eql(comparison.getLength());

        // expect(vector.getArea()).to.be.eql(comparison.getArea());
    });

    describe('smoothness', function () {
        it('draw 3 points with smoothness', function () {
            layer.config('drawImmediate', true);
            var center = map.getCenter();
            var line = new maptalks.Polygon([
                    center.sub(0.001, 0),
                    center.add(0.001, 0),
                    center.add(0.001, -0.001)
                ], {
                smoothness : 0.5,
                symbol : {
                    'lineColor' : '#000',
                    'lineWidth' : 8
                }
            }).addTo(layer);
            expect(layer).not.to.be.painted(0, 0);
            expect(layer).to.be.painted(0, -10);
        });
    });

    describe('outline', function () {
        it('display outline', function () {
            map.config('centerCross', true);
            layer.config('drawImmediate', true);
            var center = map.getCenter();
            var line = new maptalks.Polygon([
                    center.sub(0.001, 0),
                    center.add(0.001, 0),
                    center.add(0.001, -0.001)
                ], {
                symbol : {
                    'lineColor' : '#000',
                    'lineWidth' : 8
                }
            }).addTo(layer);
            var outline = line.getOutline().updateSymbol({ polygonFill : '#0f0' }).addTo(layer);
            expect(layer).not.to.be.painted(0, -20);
            expect(layer).to.be.painted(0, 10, [0, 255, 0]);
        });
    });

    describe('animateShow', function () {
        it('animateShow', function (done) {
            var polygon = new maptalks.Polygon([[
                new maptalks.Coordinate([center.x, center.y + 0.001]),
                new maptalks.Coordinate([center.x, center.y]),
                new maptalks.Coordinate([center.x + 0.002, center.y])
            ]], {
                symbol: {
                    'lineWidth': 6
                },
                visible : false
            });
            layer.once('layerload', function () {
                var geojson = polygon.toGeoJSON();
                expect(layer._getRenderer().isBlank()).to.be.ok();
                polygon.animateShow({
                    'duration' : 100,
                    'easing' : 'out'
                }, function (frame) {
                    if (frame.state.playState !== 'finished') {
                        expect(polygon.toGeoJSON()).not.to.be.eql(geojson);
                    } else {
                        expect(layer).to.be.painted(0, 0);
                        expect(polygon.toGeoJSON()).to.be.eql(geojson);
                        done();
                    }
                });
            });
            layer.addGeometry(polygon).addTo(map);

        });
        it('The current coordinate should be on the line along the polygon', function (done) {
             var polygon = new maptalks.Polygon([[
                new maptalks.Coordinate([center.x, center.y]),
                new maptalks.Coordinate([center.x, center.y + 0.001]),
                new maptalks.Coordinate([center.x + 0.001, center.y + 0.001]),
                new maptalks.Coordinate([center.x + 0.001, center.y]),
                new maptalks.Coordinate([center.x, center.y])
            ]], {
                symbol: {
                    'lineWidth': 2
                },
                visible : false
            });
            layer.once('layerload', function () {
                expect(layer._getRenderer().isBlank()).to.be.ok();
                polygon.animateShow({
                    'duration' : 100,
                    'easing' : 'out'
                }, function (frame, curCoord) {
                    if (frame.state.playState !== 'finished') {
                        if(curCoord.x > center.x) {
                            expect(curCoord.x < center.x + 0.001 && curCoord.y >= center.y).to.be.true;
                        }
                    } else {
                        expect(curCoord.x === center.x && curCoord.y === center.y).to.be.true;
                        done();
                    }
                });
            });
            layer.addGeometry(polygon).addTo(map);
        });
    });
});
