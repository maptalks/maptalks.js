describe('Map.Event', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var eventContainer;

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '20px';
        container.style.height = '20px';
        document.body.appendChild(container);
        var option = {
            zoomAnimation:false,
            zoom: 17,
            center: center
        };
        map = new maptalks.Map(container, option);
        eventContainer = map.getPanels().canvasContainer;
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('prevent click longer than 300ms', function (done) {
        var domPosition = GET_PAGE_POSITION(container);
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
        }, 500);
    });

    it('mimic click event after touch', function () {
        var domPosition = GET_PAGE_POSITION(container);
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

    it('mimic dblclick event after double touch', function () {
        var domPosition = GET_PAGE_POSITION(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
        var spy = sinon.spy();
        map.on('dblclick', spy);

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
        var domPosition = GET_PAGE_POSITION(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
        var spy = sinon.spy();
        map.once('click', spy);
        happen.mousedown(eventContainer, {
            'clientX':point.x,
            'clientY':point.y
        });
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

    it('it ignore click without mousedown', function () {
        var domPosition = GET_PAGE_POSITION(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
        var spy = sinon.spy();
        map.on('click', spy);
        happen.click(eventContainer, {
            'clientX':point.x,
            'clientY':point.y
        });
        expect(spy.called).not.to.be.ok();
    });

    it('ignore events out of container extent', function () {
        var domPosition = GET_PAGE_POSITION(container);
        var x = domPosition.x + 2;
        var y = domPosition.y + 2;
        var spy = sinon.spy();
        map.on('click', spy);
        happen.mousedown(eventContainer, {
            'clientX': x,
            'clientY': y
        });
        happen.click(eventContainer, {
            'clientX': x,
            'clientY': y
        });
        expect(spy.called).to.be.ok();
        spy.reset();
        map.setPitch(80);
        happen.mousedown(eventContainer, {
            'clientX': x,
            'clientY': y
        });
        happen.click(eventContainer, {
            'clientX': x,
            'clientY': y
        });
        expect(spy.called).not.to.be.ok();
    });
});
