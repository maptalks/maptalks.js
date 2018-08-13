describe('Map.Drag', function () {
    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    function dragMap(steps) {
        steps = steps || 10;
        var center = map.getCenter();
        var spy = sinon.spy();
        map.on('mousedown', spy);

        var domPosition = GET_PAGE_POSITION(container);
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
            if (map.options['draggable'] && map.options['dragPan'] && i > 0) {
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
        map.config('zoomAnimation', false);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
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

    it('disables dragging by dragPan', function (done) {
        map.config('dragPan', false);
        dragMap();
        setTimeout(function () {
            expect(map.getCenter().toArray()).to.be.closeTo(center.toArray());
            done();
        }, 20);
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

    function dragToRotate(dx, dy) {
        dx = dx || 0;
        dy = dy || 0;
        var domPosition = GET_PAGE_POSITION(container);
        var center = map.getCenter();
        var point = map.coordinateToContainerPoint(center).add(domPosition);

        happen.mousedown(map._panels.front, {
            'clientX':point.x,
            'clientY':point.y,
            'button' : 2
        });
        for (var i = 0; i < 10; i++) {
            happen.mousemove(document, {
                'clientX':point.x + i * dx,
                'clientY':point.y + i * dy,
                'button' : 2
            });
        }
        happen.mouseup(document);
    }

    it('drag to rotate and animation', function (done) {
        var bearing = map.getBearing();
        var counter = 0;
        map.on('animateend', function () {
            done();
        });
        dragToRotate(20);
        expect(map.getBearing()).not.to.be.eql(bearing);
    });

    it('disable dragging to rotate', function () {
        map.config('dragRotate', false);
        var bearing = map.getBearing();
        dragToRotate(1);
        expect(map.getBearing()).to.be.eql(bearing);
    });

    it('drag to pitch', function () {
        var pitch = map.getPitch();
        dragToRotate(0, -15);
        expect(map.getPitch()).not.to.be.eql(pitch);
    });

    it('disable dragging to pitch', function () {
        map.config('dragPitch', false);
        var pitch = map.getPitch();
        dragToRotate(0, -1);
        expect(map.getPitch()).to.be.eql(pitch);
    });

    it('drag map by touches', function () {
        map.options['panAnimation'] = false;
        var center2;
        map.setZoom(7);

        var domPosition = GET_PAGE_POSITION(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);

        var called = false;

        map.on('moving', function (e) {
            called = true;
            expect(e.domEvent.touches.length).to.be.eql(1);
        });

        happen.once(map._panels.mapWrapper, {
            'type' : 'touchstart',
            'touches' : [
                {
                    'clientX':point.x,
                    'clientY':point.y
                }
            ]
        });
        for (var i = 0; i < 10; i++) {
            happen.once(map._panels.mapWrapper, {
                'type' : 'touchmove',
                'touches' : [
                    {
                        'clientX':point.x + i,
                        'clientY':point.y + i
                    }
                ]
            })
        }
        happen.once(map._panels.mapWrapper, {
            'type' : 'touchend',
            'changedTouches' : [
                {
                    'clientX':point.x + i,
                    'clientY':point.y + i
                }
            ]
        });

        center2 = map.getCenter();
        expect(called).to.be.ok();
        expect(center2.toArray()).not.to.be.eql(center.toArray());
        expect(map.isMoving()).not.to.be.ok();
    });
});
