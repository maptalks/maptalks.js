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
            zoomAnimation: false,
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
            'clientX': point.x,
            'clientY': point.y
        });
        setTimeout(function () {
            happen.click(eventContainer, {
                'clientX': point.x,
                'clientY': point.y
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
            'type': 'touchstart',
            'touches': [{
                'clientX': point.x,
                'clientY': point.y
            }]
        });
        happen.once(eventContainer, {
            'type': 'touchend',
            'touches': [{
                'clientX': point.x,
                'clientY': point.y
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
            'type': 'touchstart',
            'touches': [{
                'clientX': point.x,
                'clientY': point.y
            }]
        });
        happen.once(eventContainer, {
            'type': 'touchend',
            'touches': [{
                'clientX': point.x,
                'clientY': point.y
            }]
        });
        happen.once(eventContainer, {
            'type': 'touchstart',
            'touches': [{
                'clientX': point.x,
                'clientY': point.y
            }]
        });
        happen.once(eventContainer, {
            'type': 'touchend',
            'touches': [{
                'clientX': point.x,
                'clientY': point.y
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
            'clientX': point.x,
            'clientY': point.y
        });
        happen.click(eventContainer, {
            'clientX': point.x,
            'clientY': point.y
        });
        expect(spy.called).to.be.ok();
        spy.reset();
        happen.click(eventContainer, {
            'clientX': point.x,
            'clientY': point.y
        });
        expect(spy.called).not.to.be.ok();
    });

    it('it ignore click without mousedown', function () {
        var domPosition = GET_PAGE_POSITION(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
        var spy = sinon.spy();
        map.on('click', spy);
        happen.click(eventContainer, {
            'clientX': point.x,
            'clientY': point.y
        });
        expect(spy.called).not.to.be.ok();
    });
    // #2419 增加了对地图范围外的鼠标交互支持，该用例不再需要
    it.skip('ignore events out of container extent', function () {
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

    it('block map mouse event when point in sky area', function (done) {
        Object.assign(container.style, { width: '1000px', height: '500px' });

        setTimeout(() => {
            map.setPitch(80);
            const { width, height } = map.getSize();
            const point = new maptalks.Point(width / 2, 2);
            var spy = sinon.spy();
            const spy1 = sinon.spy();
            map.on('click', spy);
            map.on('dom:click', spy1);

            happen.mousedown(eventContainer, {
                'clientX': point.x,
                'clientY': point.y
            });
            setTimeout(function () {
                happen.click(eventContainer, {
                    'clientX': point.x,
                    'clientY': point.y
                });
                expect(spy.called).not.to.be.ok();
                expect(spy1.called).to.be.ok();
                done();
            }, 500);


        }, 500);

    });

    it('events with terrain info', function (done) {
        // mimic a terrain layer
        const terrainLayer = new maptalks.TileLayer('tile', {
            urlTemplate: '#',
            terrain: {
                urlTemplate: '#'
            }
        });
        terrainLayer.queryTerrainAtPoint = function () {
            return new maptalks.Coordinate(118.846825, 32.046534, 100);
        };
        terrainLayer.getTerrainLayer = function () {
            return this;
        };

        terrainLayer.addTo(map);
        map.on('dom:click', function (e) {
            expect(e.terrain).to.be.ok();
            expect(e.terrain.altitude).to.be.eql(100);
            done();
        });

        var domPosition = GET_PAGE_POSITION(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
        happen.click(eventContainer, {
            'clientX': point.x,
            'clientY': point.y
        });
    });

});
