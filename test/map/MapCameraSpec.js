
describe('#Map.Camera', function () {

    var container;
    var map, layer;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '400px';
        container.style.height = '300px';
        document.body.appendChild(container);
        var option = {
            zoomAnimation:true,
            zoomAnimationDuration : 100,
            zoom: 17,
            center: center,
            baseLayer : new maptalks.TileLayer('tile', {
                urlTemplate:'/resources/tile.png',
                subdomains: [1, 2, 3]
            })
        };
        map = new maptalks.Map(container, option);
        // bring some offset to map, let view point is different from container point.
        map.setCenter(center._add(0.1, 0.1));
        layer = new maptalks.VectorLayer('v').addTo(map);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('getter and setter', function () {
        map.setBearing(60);
        map.setPitch(40);
        expect(map.getBearing()).to.be.approx(60);
        expect(map.getPitch()).to.be.eql(40);

        expect(map.getFov()).to.be.above(0);
        map.setFov(60);
        expect(map.getFov()).to.be.approx(60);
        // max fov is 60
        map.setFov(90);
        expect(map.getFov()).to.be.approx(60);
    });

    describe('TileLayer\'s dom rendering', function (done) {
        it('render after composite operations', function () {
            var baseLayer = map.getBaseLayer();
            map.setBearing(60);
            map.setCenter(map.getCenter().add(0.001, 0.001));
            map.setPitch(40);
            map.setCenter(map.getCenter().add(0.001, 0.002));
            map.setBearing(0);
            map.setPitch(0);
            baseLayer.on('layerload', function () {
                const tiles = baseLayer._getRenderer()._tiles;
                const pos = tiles['53162__108844__17'].pos;
                expect(pos.toArray()).to.be.eql([52, -412]);
                done();
            });
        });
    });

    describe('events', function () {
        it('should fire pitch event', function (done) {
            map.on('pitch', function () {
                done();
            });
            map.setPitch(10);
        });

        it('should fire rotate event', function (done) {
            map.on('rotate', function () {
                done();
            });
            map.setBearing(10);
        });

        it('should fire fovchange event', function (done) {
            map.on('fovchange', function () {
                done();
            });
            map.setFov(90);
        });
    });

    describe('zoom', function () {
        it('zoomIn', function (done) {
            map.setPitch(50);
            map.setBearing(60);
            map.on('zoomend', function () {
                done();
            });
            map.zoomIn();
        });

        it('zoomOut', function (done) {
            map.setPitch(50);
            map.setBearing(60);
            map.on('zoomend', function () {
                done();
            });
            map.zoomOut();
        });

        it('setZoom', function (done) {
            map.setPitch(50);
            map.setBearing(60);
            map.on('zoomend', function () {
                done();
            });
            map.setZoom(13);
        });
    });

    describe('conversions', function () {
        it('containerPoint and viewPoint', function () {
            var center = map.getCenter();
            var cp = map.coordinateToContainerPoint(center);
            var vp = map.containerPointToViewPoint(cp);
            var cp2 = map.viewPointToContainerPoint(vp);
            expect(cp).to.be.closeTo(cp2);

            map.setBearing(60);

            cp = map.coordinateToContainerPoint(center);
            vp = map.containerPointToViewPoint(cp);
            cp2 = map.viewPointToContainerPoint(vp);
            expect(cp).to.be.closeTo(cp2);

            map.setPitch(60);

            cp = map.coordinateToContainerPoint(center);
            vp = map.containerPointToViewPoint(cp);
            cp2 = map.viewPointToContainerPoint(vp);
            expect(cp).to.be.closeTo(cp2);

        });

        it('pixel and distance', function () {
            var size = map.distanceToPixel(300, 400);
            var dist = map.pixelToDistance(size.width, size.height);
            expect(dist).to.be.approx(500, 1E-1);

            map.setBearing(60);

            size = map.distanceToPixel(300, 400);
            dist = map.pixelToDistance(size.width, size.height);
            expect(dist).to.be.approx(500, 1E-1);

            map.setPitch(60);

            size = map.distanceToPixel(300, 400);
            dist = map.pixelToDistance(size.width, size.height);
            expect(dist).to.be.approx(500, 1E-1);
        });

        it('containerPoint and coordinate', function () {
            var center = map.getCenter();
            var cp = map.coordinateToContainerPoint(center);
            var c2 = map.containerPointToCoordinate(cp);
            expect(c2).to.be.closeTo(center);

            map.setPitch(60);

            cp = map.coordinateToContainerPoint(center);
            c2 = map.containerPointToCoordinate(cp);
            expect(c2).to.be.closeTo(center);

            map.setBearing(50);

            cp = map.coordinateToContainerPoint(center);
            c2 = map.containerPointToCoordinate(cp);
            expect(c2).to.be.closeTo(center);
        });

        it('containerPoint and point', function () {
            map.setPitch(30);
            var point = map._containerPointToPoint({ x: 0, y: 0 });
            var pointMax = map._containerPointToPoint({ x: 0, y: 0 }, map.getMaxZoom());
            var scale = map.getScale();
            expect(pointMax.x).to.be.eql(point.x * scale);
            expect(pointMax.y).to.be.eql(point.y * scale);
        });
    });

    describe('polygon\' size when pitching or rotating', function () {
        it('changed when rotating', function () {
            var top = new maptalks.Coordinate([center.x, center.y + 0.001]);
            var geometry = new maptalks.Polygon([[
                top,
                new maptalks.Coordinate([center.x, center.y]),
                new maptalks.Coordinate([center.x + 0.002, center.y])
            ]]);
            layer.addGeometry(geometry);

            var size = geometry.getSize();

            map.setBearing(90);
            var size2 = geometry.getSize();
            expect(size.toPoint()).to.be.closeTo(new maptalks.Point([size2.height, size2.width]));

            map.setPitch(60);
            var size3 = geometry.getSize();
            expect(size3.width).to.be.above(size2.width);
            expect(size3.height).to.be.below(size2.height);
        });
    });


    describe('marker\' size should be unchanged when pitching or rotating', function () {
        it('image marker', function () {
            var marker = new maptalks.Marker([100, 0], {
                symbol:{
                    'markerFile' : 'resources/x.svg',
                    'markerWidth': 20,
                    'markerHeight':30
                }
            }).addTo(layer);
            var s = new maptalks.Point(20, 30);
            expect(marker.getSize().toPoint()).to.be.eql(s);
            map.setPitch(60);
            expect(marker.getSize().toPoint()).to.be.closeTo(s);
            map.setBearing(40);
            expect(marker.getSize().toPoint()).to.be.closeTo(s);
        });

        it('vector marker', function () {
            var marker = new maptalks.Marker([100, 0], {
                symbol:{
                    'markerType' : 'ellipse',
                    'markerWidth': 20,
                    'markerHeight':30
                }
            }).addTo(layer);
            var s = new maptalks.Point(21, 31);
            expect(marker.getSize().toPoint()).to.be.eql(s);
            map.setPitch(60);
            expect(marker.getSize().toPoint()).to.be.eql(s);
            map.setBearing(40);
            expect(marker.getSize().toPoint()).to.be.closeTo(s);
        });

        it('vector path marker', function () {
            if (maptalks.Browser.ie) {
                // IE throws SecurityError
                return;
            }
            var marker = new maptalks.Marker([100, 0]).addTo(layer);
            var s = new maptalks.Point(24, 34);
            expect(marker.getSize().toPoint()).to.be.eql(s);
            map.setPitch(60);
            expect(marker.getSize().toPoint()).to.be.closeTo(s);
            map.setBearing(40);
            expect(marker.getSize().toPoint()).to.be.closeTo(s);
        });
    });

    describe('containsPoint when pitching', function () {

        it('linestring', function () {
            var top = new maptalks.Coordinate([center.x, center.y + 0.001]);
            var geometry = new maptalks.LineString([
                top,
                new maptalks.Coordinate([center.x, center.y]),
                new maptalks.Coordinate([center.x + 0.002, center.y])
            ]);
            layer.addGeometry(geometry);
            var topPt = map.coordinateToContainerPoint(top);
            expect(geometry.containsPoint(topPt)).to.be.ok();
            map.setPitch(60);
            expect(geometry.containsPoint(topPt)).not.to.be.ok();
            var newTopPt = map.coordinateToContainerPoint(top);
            expect(geometry.containsPoint(newTopPt)).to.be.ok();
            expect(newTopPt.y).to.be.above(topPt.y);
        });

        it('polygon', function () {
            var top = new maptalks.Coordinate([center.x, center.y + 0.001]);
            var geometry = new maptalks.Polygon([[
                top,
                new maptalks.Coordinate([center.x, center.y]),
                new maptalks.Coordinate([center.x + 0.002, center.y])
            ]]);
            layer.addGeometry(geometry);
            var topPt = map.coordinateToContainerPoint(top);
            expect(geometry.containsPoint(topPt)).to.be.ok();
            map.setPitch(60);
            expect(geometry.containsPoint(topPt)).not.to.be.ok();
            var newTopPt = map.coordinateToContainerPoint(top);
            expect(geometry.containsPoint(newTopPt)).to.be.ok();
            expect(newTopPt.y).to.be.above(topPt.y);
        });

        it('circle', function () {
            var top = map.locate(center, 0, 10);
            var geometry = new maptalks.Circle(center, 10);
            layer.addGeometry(geometry);
            var topPt = map.coordinateToContainerPoint(top);
            expect(geometry.containsPoint(topPt)).to.be.ok();
            map.setPitch(60);
            expect(geometry.containsPoint(topPt)).not.to.be.ok();
            var newTopPt = map.coordinateToContainerPoint(top);
            expect(geometry.containsPoint(newTopPt)).to.be.ok();
            expect(geometry.containsPoint(newTopPt.sub(0, 1))).not.to.be.ok();
            expect(newTopPt.y).to.be.above(topPt.y);
        });

        it('ellipse', function () {
            var top = map.locate(center, 0, 4);
            var geometry = new maptalks.Ellipse(center, 10, 8);
            layer.addGeometry(geometry);
            var topPt = map.coordinateToContainerPoint(top);
            expect(geometry.containsPoint(topPt)).to.be.ok();
            map.setPitch(60);
            expect(geometry.containsPoint(topPt)).not.to.be.ok();
            var newTopPt = map.coordinateToContainerPoint(top);
            expect(geometry.containsPoint(newTopPt)).to.be.ok();
            expect(newTopPt.y).to.be.above(topPt.y);
        });

        it('rectangle', function () {
            var bottom = map.locate(center, 0, -10);
            var geometry = new maptalks.Rectangle(center, 20, 10);
            layer.addGeometry(geometry);
            var bottomPt = map.coordinateToContainerPoint(bottom);
            expect(geometry.containsPoint(bottomPt)).to.be.ok();
            map.setPitch(60);
            expect(geometry.containsPoint(bottomPt)).not.to.be.ok();
            var newBottomPt = map.coordinateToContainerPoint(bottom);
            expect(geometry.containsPoint(newBottomPt)).to.be.ok();
            expect(newBottomPt.y).to.be.below(bottomPt.y);
        });

        it('sector', function () {
            var top = map.locate(center, 0, 10);
            var geometry = new maptalks.Sector(center, 10, 0, 90);
            layer.addGeometry(geometry);
            var topPt = map.coordinateToContainerPoint(top);
            expect(geometry.containsPoint(topPt)).to.be.ok();
            map.setPitch(60);
            expect(geometry.containsPoint(topPt)).not.to.be.ok();
            var newTopPt = map.coordinateToContainerPoint(top);
            expect(geometry.containsPoint(newTopPt)).to.be.ok();
            expect(newTopPt.y).to.be.above(topPt.y);
        });
    });
});

