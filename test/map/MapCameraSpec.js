
describe('#Map.Camera', function () {

    var container;
    var map, layer;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '40px';
        container.style.height = '30px';
        document.body.appendChild(container);
        var option = {
            zoomAnimation:false,
            zoom: 17,
            center: center
        };
        map = new maptalks.Map(container, option);
        // bring some offset to map, let view point is different from container point.
        map.setCenter(center._add(0.1, 0.1));
        layer = new maptalks.VectorLayer('v').addTo(map);
    });

    afterEach(function () {
        REMOVE_CONTAINER(container);
    });

    describe('get marker\' size when pitching', function () {
        it('image marker', function () {

        });
    });

    describe('containsPoint when pitching', function () {

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
    });
});

