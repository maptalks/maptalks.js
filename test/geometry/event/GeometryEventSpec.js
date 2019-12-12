describe('Geometry.Events', function () {
    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var eventContainer;
    var layer;

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center);
        container = setups.container;
        map = setups.map;
        map.config('onlyVisibleGeometryEvents', false);
        eventContainer = map._panels.canvasContainer;
        layer = new maptalks.VectorLayer('vector');
        map.addLayer(layer);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('event propagation to map', function () {
        var circle = new maptalks.Circle(map.getCenter(), 10);
        circle.addTo(layer);
        var domPosition = GET_PAGE_POSITION(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);

        var spy = sinon.spy();
        circle.on('click', spy);
        var spy2 = sinon.spy();
        map.on('click', spy2);
        happen.mousedown(eventContainer, {
            'clientX':point.x,
            'clientY':point.y
        });
        happen.click(eventContainer, {
            'clientX':point.x,
            'clientY':point.y
        });
        expect(spy.called).to.be.ok();
        expect(spy2.called).to.be.ok();
    });


    it('can stop event\'s propagation', function () {
        var circle = new maptalks.Circle(map.getCenter(), 10);
        circle.addTo(layer);
        var domPosition = GET_PAGE_POSITION(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);

        var circleClicked = false;
        circle.on('click', function () {
            circleClicked = true;
            return false;
        });
        var spy = sinon.spy();
        map.on('click', spy);
        happen.click(eventContainer, {
            'clientX':point.x,
            'clientY':point.y
        });
        expect(circleClicked).to.be.ok();
        expect(spy.called).not.to.be.ok();
    });

    it('mousemove and mouseout', function (done) {
        var circle = new maptalks.Circle(map.getCenter(), 10);
        circle.addTo(layer);
        var domPosition = GET_PAGE_POSITION(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
        function onMouseMove(param) {
            expect(param.type).to.be.eql('mousemove');
            circle.off('mousemove', onMouseMove);
            happen.mousemove(eventContainer, {
                'clientX':point.x + 100,
                'clientY':point.y + 100
            });
        }
        circle.on('mousemove', onMouseMove);
        circle.on('mouseout', function (param) {
            expect(param.type).to.be.eql('mouseout');
            done();
        });

        happen.mousemove(eventContainer, {
            'clientX':point.x,
            'clientY':point.y
        });
    });

    it('mouseover and mouseenter', function (done) {
        var circle = new maptalks.Circle(map.getCenter(), 10);
        circle.addTo(layer);
        var domPosition = GET_PAGE_POSITION(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
        var count = 0;
        function onMouseOver(param) {
            if (count === 0) {
                expect(param.type).to.be.eql('mouseenter');
            } else {
                expect(param.type).to.be.eql('mouseover');
            }
            expect(param.target === circle).to.be.ok();
            count++;
            if (count === 3) {
                done();
            }
        }
        circle.on('mouseover', onMouseOver);
        circle.on('mouseenter', onMouseOver);
        happen.mousemove(eventContainer, {
            'clientX':point.x,
            'clientY':point.y
        });
        setTimeout(function () {
            happen.mousemove(eventContainer, {
                'clientX':point.x,
                'clientY':point.y
            });
        }, 300);

    });

    it('click', function () {
        var circle = new maptalks.Circle(map.getCenter(), 10);
        circle.addTo(layer);
        var domPosition = GET_PAGE_POSITION(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
        var spy = sinon.spy();
        circle.on('click', spy);

        happen.click(eventContainer, {
            'clientX':point.x,
            'clientY':point.y
        });
        expect(spy.called).to.be.ok();
        spy.reset();
        happen.click(eventContainer, {
            'clientX':point.x,
            'clientY':point.y
        });
        expect(spy.called).to.be.ok();
    });

    it('prevent click longer than 300ms', function (done) {
        var circle = new maptalks.Circle(map.getCenter(), 10);
        circle.addTo(layer);
        var domPosition = GET_PAGE_POSITION(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
        var spy = sinon.spy();
        circle.on('click', spy);

        happen.mousedown(eventContainer, {
            'clientX':point.x,
            'clientY':point.y
        });
        setTimeout(function () {
            happen.click(eventContainer, {
                'clientX':point.x,
                'clientY':point.y
            });
            expect(spy.called).not.to.be.ok();
            done();
        }, 500);
    });

    it('fire an additional click event after touch', function () {
        var circle = new maptalks.Circle(map.getCenter(), 10);
        circle.addTo(layer);
        var domPosition = GET_PAGE_POSITION(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
        var spy = sinon.spy();
        circle.on('click', spy);

        happen.once(eventContainer, {
            'type' : 'touchstart',
            'touches' : [{
                'clientX':point.x,
                'clientY':point.y
            }]
        });
        happen.once(eventContainer, {
            'type' : 'touchend',
            'touches' : [{
                'clientX':point.x,
                'clientY':point.y
            }]
        });
        expect(spy.called).to.be.ok();
    });

    it('listen click once', function () {
        var circle = new maptalks.Circle(map.getCenter(), 10);
        circle.addTo(layer);
        var domPosition = GET_PAGE_POSITION(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
        var spy = sinon.spy();
        circle.once('click', spy);

        happen.click(eventContainer, {
            'clientX':point.x,
            'clientY':point.y
        });
        expect(spy.called).to.be.ok();
        spy.reset();
        happen.click(eventContainer, {
            'clientX':point.x,
            'clientY':point.y
        });
        expect(spy.called).not.to.be.ok();
    });

    it('disable events listening', function () {
        var circle = new maptalks.Circle(map.getCenter(), 10);
        circle.addTo(layer);
        map.config('geometryEvents', false);
        var domPosition = GET_PAGE_POSITION(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
        var spy = sinon.spy();
        circle.on('click', spy);

        happen.click(eventContainer, {
            'clientX':point.x,
            'clientY':point.y
        });
        expect(spy.called).not.to.be.ok();
    });

    it('#1029, event for invisible dynamic size marker', function () {
        var circle = new maptalks.Marker(map.getCenter(), {
            'symbol': {
                'markerType': 'circle',
                'markerWidth': {stops: [[18, 0], [20, 30]]},
                'markerHeight': {stops: [[18, 0], [20, 30]]},
            }
        });
        circle.addTo(layer);
        var domPosition = GET_PAGE_POSITION(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
        var spy = sinon.spy();
        circle.on('click', spy);

        happen.click(eventContainer, {
            'clientX':point.x + 1,
            'clientY':point.y
        });
        expect(spy.called).not.to.be.ok();
    });

    it('#1029, event for visible dynamic size marker', function () {
        var circle = new maptalks.Marker(map.getCenter(), {
            'symbol': {
                'markerType': 'circle',
                'markerWidth': {stops: [[10, 0], [20, 30]]},
                'markerHeight': {stops: [[10, 0], [20, 30]]},
            }
        });
        circle.addTo(layer);
        var domPosition = GET_PAGE_POSITION(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
        var spy = sinon.spy();
        circle.on('click', spy);

        happen.click(eventContainer, {
            'clientX':point.x + 1,
            'clientY':point.y
        });
        expect(spy.called).to.be.ok();
    });
});
