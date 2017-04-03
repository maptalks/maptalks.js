describe('#MapEventSpec', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var eventContainer;

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '2px';
        container.style.height = '2px';
        document.body.appendChild(container);
        var option = {
            zoomAnimation:false,
            zoom: 17,
            center: center
        };
        map = new maptalks.Map(container, option);
        eventContainer = map._panels.canvasContainer;
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('prevent click longer than 300ms', function (done) {
        var domPosition = maptalks.DomUtil.getPagePosition(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
        var spy = sinon.spy();
        map.on('click', spy);

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
        }, 301);
    });

    it('fire an additional click event after touch', function () {
        var domPosition = maptalks.DomUtil.getPagePosition(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
        var spy = sinon.spy();
        map.on('click', spy);

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
        var domPosition = maptalks.DomUtil.getPagePosition(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
        var spy = sinon.spy();
        map.once('click', spy);

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
});
