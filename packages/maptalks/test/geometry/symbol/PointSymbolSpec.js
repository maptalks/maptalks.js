describe('PointSymbolSpec', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center);
        container = setups.container;
        map = setups.map;
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    describe('dx dy', function () {
        it('without dx, dy', function () {
            var marker = new maptalks.Marker(center, {
                symbol:{
                    'markerType' : 'ellipse',
                    'markerWidth': 2,
                    'markerHeight': 2
                }
            });
            var v = new maptalks.VectorLayer('v', { 'drawImmediate' : true }).addTo(map);
            v.addGeometry(marker);
            expect(v).to.be.painted();
        });

        it('with dx', function () {
            var marker = new maptalks.Marker(center, {
                symbol:{
                    'markerType' : 'ellipse',
                    'markerWidth': 2,
                    'markerHeight': 2,
                    'markerDx': 10
                }
            });
            var v = new maptalks.VectorLayer('v', { 'drawImmediate' : true }).addTo(map);
            v.addGeometry(marker);
            expect(v).not.to.be.painted();
            expect(v).to.be.painted(10);
        });

        it('with dy', function () {
            var marker = new maptalks.Marker(center, {
                symbol:{
                    'markerType' : 'ellipse',
                    'markerWidth': 2,
                    'markerHeight': 2,
                    'markerDy': 10
                }
            });
            var v = new maptalks.VectorLayer('v', { 'drawImmediate' : true }).addTo(map);
            v.addGeometry(marker);
            expect(v).not.to.be.painted();
            expect(v).to.be.painted(0, 10);
        });

        it('with dx, dy', function () {
            var marker = new maptalks.Marker(center, {
                symbol:{
                    'markerType' : 'ellipse',
                    'markerWidth': 2,
                    'markerHeight': 2,
                    'markerDx': 10,
                    'markerDy': 10
                }
            });
            var v = new maptalks.VectorLayer('v', { 'drawImmediate' : true }).addTo(map);
            v.addGeometry(marker);
            expect(v).not.to.be.painted();
            expect(v).to.be.painted(10, 10);
        });
    });

    describe('placement', function () {
        it('default placement', function () {
            var p = map.coordinateToContainerPoint(map.getCenter()),
                c1 = map.containerPointToCoordinate(p.add(-10, -10)),
                c2 = map.containerPointToCoordinate(p.add(10, -10)),
                c3 = map.containerPointToCoordinate(p.add(10, 10)),
                c4 = map.containerPointToCoordinate(p.add(-10, 10));
            var circle = new maptalks.Polygon([c1, c2, c3, c4], {
                'symbol' : {
                    'lineOpacity' : 0,
                    'markerType' : 'ellipse',
                    'markerWidth': 3,
                    'markerHeight': 3
                }
            });
            var v = new maptalks.VectorLayer('v', { 'drawImmediate' : true, 'enableSimplify':false }).addTo(map);
            v.addGeometry(circle);
            expect(v).to.be.painted();
        });

        it('center placement', function () {
            var p = map.coordinateToContainerPoint(map.getCenter()),
                c1 = map.containerPointToCoordinate(p.add(-10, -10)),
                c2 = map.containerPointToCoordinate(p.add(10, -10)),
                c3 = map.containerPointToCoordinate(p.add(10, 10)),
                c4 = map.containerPointToCoordinate(p.add(-10, 10));
            var circle = new maptalks.Polygon([c1, c2, c3, c4], {
                'symbol' : {
                    'lineOpacity' : 0,
                    'markerPlacement' : 'center',
                    'markerType' : 'ellipse',
                    'markerWidth': 3,
                    'markerHeight': 3
                }
            });
            var v = new maptalks.VectorLayer('v', { 'drawImmediate' : true, 'enableSimplify':false }).addTo(map);
            v.addGeometry(circle);
            expect(v).to.be.painted();
        });

        it('point placement', function () {
            var p = map.coordinateToContainerPoint(map.getCenter()),
                c2 = map.containerPointToCoordinate(p.add(10, 0)),
                c3 = map.containerPointToCoordinate(p.add(20, 0));
            var line = new maptalks.LineString([map.getCenter(), c2, c3], {
                'symbol' : {
                    'lineOpacity' : 0,
                    'markerPlacement' : 'vertex',
                    'markerType' : 'ellipse',
                    'markerWidth': 3,
                    'markerHeight': 3
                }
            });
            var v = new maptalks.VectorLayer('v', { 'drawImmediate' : true, 'enableSimplify':false }).addTo(map);
            v.addGeometry(line);
            expect(v).to.be.painted();
            expect(v).to.be.painted(10, 0);
            expect(v).to.be.painted(20, 0);
        });

        it('vertex placement', function () {
            var p = map.coordinateToContainerPoint(map.getCenter()),
                c2 = map.containerPointToCoordinate(p.add(10, 0)),
                c3 = map.containerPointToCoordinate(p.add(20, 0));
            var line = new maptalks.LineString([map.getCenter(), c2, c3], {
                'symbol' : {
                    'lineOpacity' : 0,
                    'markerPlacement' : 'vertex',
                    'markerType' : 'ellipse',
                    'markerWidth': 3,
                    'markerHeight': 3
                }
            });
            var v = new maptalks.VectorLayer('v', { 'drawImmediate' : true, 'enableSimplify':false }).addTo(map);
            v.addGeometry(line);
            expect(v).to.be.painted();
            expect(v).to.be.painted(10, 0);
            expect(v).to.be.painted(20, 0);
        });

        it('vertex-first placement', function () {
            var p = map.coordinateToContainerPoint(map.getCenter()),
                c2 = map.containerPointToCoordinate(p.add(10, 0)),
                c3 = map.containerPointToCoordinate(p.add(20, 0));
            var line = new maptalks.LineString([map.getCenter(), c2, c3], {
                'symbol' : {
                    'lineOpacity' : 0,
                    'markerPlacement' : 'vertex-first',
                    'markerType' : 'ellipse',
                    'markerWidth': 3,
                    'markerHeight': 3
                }
            });
            var v = new maptalks.VectorLayer('v', { 'drawImmediate' : true, 'enableSimplify':false }).addTo(map);
            v.addGeometry(line);
            expect(v).to.be.painted();
            expect(v).not.to.be.painted(10, 0);
            expect(v).not.to.be.painted(20, 0);
        });

        it('vertex-last placement', function () {
            var p = map.coordinateToContainerPoint(map.getCenter()),
                c2 = map.containerPointToCoordinate(p.add(10, 0)),
                c3 = map.containerPointToCoordinate(p.add(20, 0));
            var line = new maptalks.LineString([map.getCenter(), c2, c3], {
                'symbol' : {
                    'lineOpacity' : 0,
                    'markerPlacement' : 'vertex-last',
                    'markerType' : 'ellipse',
                    'markerWidth': 3,
                    'markerHeight': 3
                }
            });
            var v = new maptalks.VectorLayer('v', { 'drawImmediate' : true, 'enableSimplify':false }).addTo(map);
            v.addGeometry(line);
            expect(v).not.to.be.painted();
            expect(v).not.to.be.painted(10, 0);
            expect(v).to.be.painted(20, 0);
        });

        it('line placement', function () {
            var p = map.coordinateToContainerPoint(map.getCenter()),
                c2 = map.containerPointToCoordinate(p.add(10, 0)),
                c3 = map.containerPointToCoordinate(p.add(20, 0));
            var line = new maptalks.LineString([map.getCenter(), c2, c3], {
                'symbol' : {
                    'lineOpacity' : 0,
                    'markerPlacement' : 'line',
                    'markerType' : 'ellipse',
                    'markerWidth': 2,
                    'markerHeight': 2
                }
            });
            var v = new maptalks.VectorLayer('v', { 'drawImmediate' : true, 'enableSimplify':false }).addTo(map);
            v.addGeometry(line);
            expect(v).not.to.be.painted();
            expect(v).not.to.be.painted(10, 0);
            expect(v).not.to.be.painted(20, 0);
            expect(v).to.be.painted(5, 0);
            expect(v).to.be.painted(15, 0);
        });
    });


});
