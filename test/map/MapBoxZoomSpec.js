describe('Map.BoxZoom', function () {
    var container, eventContainer;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    function dragMap(steps, callback) {
        var center = map.getCenter();
        var size = map.getSize();
        var domPosition = GET_PAGE_POSITION(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
        point = point.sub(size.toPoint().multi(1 / 4));
        happen.mousedown(eventContainer, {
            'clientX': point.x,
            'clientY': point.y,
            'shiftKey': true
        });
        mapMousemove(map, steps, function () {
            happen.mouseup(eventContainer, {
                'clientX': point.x + steps,
                'clientY': point.y + steps
            });
            callback();
        })
        for (var i = 0; i < steps; i++) {
            happen.mousemove(eventContainer, {
                'clientX': point.x + i,
                'clientY': point.y + i
            });
        }
    }

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center);
        container = setups.container;
        map = setups.map;
        map.config('zoomAnimationDuration', 50);
        eventContainer = map._panels.canvasContainer;
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('drag box zoom', function (done) {
        var center = map.getCenter().toArray();
        var zoom = map.getZoom();

        dragMap(10, function () {
            map.on('animateend', function () {
                expect(zoom).not.to.be.eql(map.getZoom());
                expect(map.getCenter().toArray()).not.to.be.eql(center);
                done();
            });
        });
    });

    it('drag bigger box zoom', function (done) {
        var center = map.getCenter().toArray();
        var zoom = map.getZoom();
        dragMap(1000, function () {
            map.on('animateend', function () {
                expect(zoom).to.be.eql(map.getZoom());
                expect(map.getCenter().toArray()).not.to.be.eql(center);
                done();
            });
        });
    });
});
