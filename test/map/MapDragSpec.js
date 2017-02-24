


describe('#MapDrag', function () {
    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    function dragMap(steps) {
        steps = steps || 10;
        var center = map.getCenter();
        var spy = sinon.spy();
        map.on('mousedown', spy);

        var domPosition = maptalks.DomUtil.getPagePosition(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);

        happen.mousedown(map._panels.front, {
            'clientX':point.x,
            'clientY':point.y
        });
        expect(spy.called).to.be.ok();
        for (var i = 0; i < steps; i++) {
            happen.mousemove(document, {
                'clientX':point.x + i,
                'clientY':point.y + i
            });
            if (map.options['draggable'] && i > 0) {
                expect(map.isMoving()).to.be.ok();
            }
        }
        happen.mouseup(document);
        if (!map.options['panAnimation']) {
            expect(map.isMoving()).not.to.be.ok();
        }

    }

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center);
        container = setups.container;
        map = setups.map;
    });

    afterEach(function () {
        REMOVE_CONTAINER(container);
    });

    it('can be dragged', function () {
        map.options['panAnimation'] = false;
        var center2;
        map.setZoom(7);
        dragMap();
        center2 = map.getCenter();
        expect(center2.toArray()).not.to.be.eql(center.toArray());
        expect(map.isMoving()).not.to.be.ok();
    });

    it('drag and pan animation', function (done) {
        map.options['panAnimation'] = true;
        var center2;
        map.on('moveend', function () {
            expect(map.isMoving()).not.to.be.ok();
            expect(map.getCenter().toArray()).not.to.be.eql(center2.toArray());
            done();
        });
        dragMap(100);
        center2 = map.getCenter();
    });

    it('disables dragging', function (done) {
        map.config('draggable', false);
        dragMap();
        setTimeout(function () {
            expect(map.getCenter().toArray()).to.be.closeTo(center.toArray());
            done();
        }, 20);
    });

});
