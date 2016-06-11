describe('PointSymbolSpec', function() {

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
        layer = new maptalks.VectorLayer('id').addTo(map);
    });

    afterEach(function() {
        map.removeLayer(layer);
        removeContainer(container)
    });

    function isCenterDrawn(layer, dx, dy) {
        if (!dx) {
            dx = 0;
        }
        if (!dy) {
            dy = 0;
        }
        var image = layer._getRenderer().getCanvasImage(),
            canvas = image.image;
        return isDrawn(parseInt(container.style.width)/2 - image.point.x + dx, parseInt(container.style.height)/2 - image.point.y + dy, canvas);
    }

    function isDrawn(x, y, canvas) {
        var context = canvas.getContext('2d');
        var imgData = context.getImageData(x, y, 1, 1).data;
        if (imgData[3] > 0) {
            return true;
        }
        return false;
    }

    describe('dx dy', function() {
        it('without dx, dy', function() {
            var marker = new maptalks.Marker(center, {
                symbol:{
                    "markerType" : "ellipse",
                    "markerWidth": 2,
                    "markerHeight": 2
                }
            });
            var v = new maptalks.VectorLayer('v', {'drawImmediate' : true}).addTo(map);
            v.addGeometry(marker);
            expect(isCenterDrawn(v)).to.be.ok();
        });

        it('with dx', function() {
            var marker = new maptalks.Marker(center, {
                symbol:{
                    "markerType" : "ellipse",
                    "markerWidth": 2,
                    "markerHeight": 2,
                    "markerDx": 10
                }
            });
            var v = new maptalks.VectorLayer('v', {'drawImmediate' : true}).addTo(map);
            v.addGeometry(marker);
            expect(isCenterDrawn(v)).not.to.be.ok();
            expect(isCenterDrawn(v, 10)).to.be.ok();
        });

        it('with dy', function() {
            var marker = new maptalks.Marker(center, {
                symbol:{
                    "markerType" : "ellipse",
                    "markerWidth": 2,
                    "markerHeight": 2,
                    "markerDy": 10
                }
            });
            var v = new maptalks.VectorLayer('v', {'drawImmediate' : true}).addTo(map);
            v.addGeometry(marker);
            expect(isCenterDrawn(v)).not.to.be.ok();
            expect(isCenterDrawn(v, 0, 10)).to.be.ok();
        });

        it('with dx, dy', function() {
            var marker = new maptalks.Marker(center, {
                symbol:{
                    "markerType" : "ellipse",
                    "markerWidth": 2,
                    "markerHeight": 2,
                    "markerDx": 10,
                    "markerDy": 10
                }
            });
            var v = new maptalks.VectorLayer('v', {'drawImmediate' : true}).addTo(map);
            v.addGeometry(marker);
            expect(isCenterDrawn(v)).not.to.be.ok();
            expect(isCenterDrawn(v, 10, 10)).to.be.ok();
        });
    });

    describe('placement', function() {
        it('point placement', function() {
            var p = map.coordinateToContainerPoint(map.getCenter()),
                c2 = map.containerPointToCoordinate(p.add(10, 0)),
                c3 = map.containerPointToCoordinate(p.add(20, 0));
            var line = new maptalks.LineString([map.getCenter(), c2, c3], {
                'symbol' : {
                    'markerPlacement' : 'point',
                    'lineOpacity' : 0,
                    'markerType' : 'ellipse',
                    'markerWidth': 3,
                    'markerHeight': 3
                },

            });
            var v = new maptalks.VectorLayer('v', {'drawImmediate' : true, 'enableSimplify':false}).addGeometry(line).addTo(map);
            expect(isCenterDrawn(v)).to.be.ok();
            expect(isCenterDrawn(v, 10, 0)).to.be.ok();
            expect(isCenterDrawn(v, 20, 0)).to.be.ok();
        });

        it('line placement', function() {
            var p = map.coordinateToContainerPoint(map.getCenter()),
                c2 = map.containerPointToCoordinate(p.add(10, 0)),
                c3 = map.containerPointToCoordinate(p.add(20, 0));
            var line = new maptalks.LineString([map.getCenter(), c2, c3], {
                'symbol' : {
                    'markerPlacement' : 'line',
                    'lineOpacity' : 0,
                    'markerType' : 'ellipse',
                    'markerWidth': 2,
                    'markerHeight': 2
                }
            });
            var v = new maptalks.VectorLayer('v', {'drawImmediate' : true, 'enableSimplify':false}).addGeometry(line).addTo(map);
            expect(isCenterDrawn(v)).not.to.be.ok();
            expect(isCenterDrawn(v, 10, 0)).not.to.be.ok();
            expect(isCenterDrawn(v, 20, 0)).not.to.be.ok();
            expect(isCenterDrawn(v, 5, 0)).to.be.ok();
            expect(isCenterDrawn(v, 15, 0)).to.be.ok();
        });
    });


});
