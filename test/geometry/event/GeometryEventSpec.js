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
        var domPosition = maptalks.DomUtil.getPagePosition(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);

        var spy = sinon.spy();
        circle.on('click', spy);
        var spy2 = sinon.spy();
        map.on('click', spy2);
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
        var domPosition = maptalks.DomUtil.getPagePosition(container);
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
        var domPosition = maptalks.DomUtil.getPagePosition(container);
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

    it('mouseover', function (done) {
        var circle = new maptalks.Circle(map.getCenter(), 10);
        circle.addTo(layer);
        var domPosition = maptalks.DomUtil.getPagePosition(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
        function onMouseOver(param) {
            expect(param.type).to.be.eql('mouseover');
            expect(param.target === circle).to.be.ok();
            done();
        }
        circle.on('mouseover', onMouseOver);
        happen.mousemove(eventContainer, {
            'clientX':point.x,
            'clientY':point.y
        });
    });

    it('click', function () {
        var circle = new maptalks.Circle(map.getCenter(), 10);
        circle.addTo(layer);
        var domPosition = maptalks.DomUtil.getPagePosition(container);
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

    it('listen click once', function () {
        var circle = new maptalks.Circle(map.getCenter(), 10);
        circle.addTo(layer);
        var domPosition = maptalks.DomUtil.getPagePosition(container);
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
        var domPosition = maptalks.DomUtil.getPagePosition(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
        var spy = sinon.spy();
        circle.on('click', spy);

        happen.click(eventContainer, {
            'clientX':point.x,
            'clientY':point.y
        });
        expect(spy.called).not.to.be.ok();
    });
});
