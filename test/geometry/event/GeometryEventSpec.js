describe('Geometry.Events', function () {
    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var eventContainer;
    var layer;

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center, null, {
            width: 800,
            height: 600
        });
        container = setups.container;
        map = setups.map;
        map.config('onlyVisibleGeometryEvents', false);
        eventContainer = map.getPanels().canvasContainer;
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
            'clientX': point.x,
            'clientY': point.y
        });
        happen.click(eventContainer, {
            'clientX': point.x,
            'clientY': point.y
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
            'clientX': point.x,
            'clientY': point.y
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
                'clientX': point.x + 100,
                'clientY': point.y + 100
            });
        }
        circle.on('mousemove', onMouseMove);
        circle.on('mouseout', function (param) {
            expect(param.type).to.be.eql('mouseout');
            done();
        });

        happen.mousemove(eventContainer, {
            'clientX': point.x,
            'clientY': point.y
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
            'clientX': point.x,
            'clientY': point.y
        });
        setTimeout(function () {
            happen.mousemove(eventContainer, {
                'clientX': point.x,
                'clientY': point.y
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
            'clientX': point.x,
            'clientY': point.y
        });
        expect(spy.called).to.be.ok();
        spy.reset();
        happen.click(eventContainer, {
            'clientX': point.x,
            'clientY': point.y
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

    it('fire an additional click event after touch', function () {
        var circle = new maptalks.Circle(map.getCenter(), 10);
        circle.addTo(layer);
        var domPosition = GET_PAGE_POSITION(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
        var spy = sinon.spy();
        circle.on('click', spy);

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
        var circle = new maptalks.Circle(map.getCenter(), 10);
        circle.addTo(layer);
        var domPosition = GET_PAGE_POSITION(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
        var spy = sinon.spy();
        circle.once('click', spy);

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

    it('disable events listening', function () {
        var circle = new maptalks.Circle(map.getCenter(), 10);
        circle.addTo(layer);
        map.config('geometryEvents', false);
        var domPosition = GET_PAGE_POSITION(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
        var spy = sinon.spy();
        circle.on('click', spy);

        happen.click(eventContainer, {
            'clientX': point.x,
            'clientY': point.y
        });
        expect(spy.called).not.to.be.ok();
    });

    it('#1029, event for invisible dynamic size marker', function () {
        var circle = new maptalks.Marker(map.getCenter(), {
            'symbol': {
                'markerType': 'circle',
                'markerWidth': { stops: [[18, 0], [20, 30]] },
                'markerHeight': { stops: [[18, 0], [20, 30]] },
            }
        });
        circle.addTo(layer);
        var domPosition = GET_PAGE_POSITION(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
        var spy = sinon.spy();
        circle.on('click', spy);

        happen.click(eventContainer, {
            'clientX': point.x + 3,
            'clientY': point.y
        });
        expect(spy.called).not.to.be.ok();
    });

    it('#1029, event for visible dynamic size marker', function () {
        var circle = new maptalks.Marker(map.getCenter(), {
            'symbol': {
                'markerType': 'circle',
                'markerWidth': { stops: [[10, 0], [20, 30]] },
                'markerHeight': { stops: [[10, 0], [20, 30]] },
            }
        });
        circle.addTo(layer);
        var domPosition = GET_PAGE_POSITION(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
        var spy = sinon.spy();
        circle.on('click', spy);

        happen.click(eventContainer, {
            'clientX': point.x + 1,
            'clientY': point.y
        });
        expect(spy.called).to.be.ok();
    });

    it('#2027 Horizontal line', function () {
        var center = map.getCenter();
        var c1 = center.add(1, 0);
        var line = new maptalks.LineString([center, c1]);
        line.addTo(layer);
        var domPosition = GET_PAGE_POSITION(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
        var spy = sinon.spy();
        line.on('click', spy);

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
        expect(spy.called).to.be.ok();
    });

    it('geometryEventTolerance', function () {
        layer.config('geometryEventTolerance', 5);
        var center = map.getCenter();
        var c1 = center.add(1, 0);
        var line = new maptalks.LineString([center, c1]);
        line.addTo(layer);
        var domPosition = GET_PAGE_POSITION(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
        var spy = sinon.spy();
        line.on('click', spy);

        happen.click(eventContainer, {
            'clientX': point.x,
            'clientY': point.y + 3
        });
        expect(spy.called).to.be.ok();
    });

    it('marker rotation #2047', function (done) {
        var center = map.getCenter();
        const symbols = [
            {
                markerType: 'ellipse',
                markerWidth: 40,
                markerHeight: 40
            },
            {
                markerFile: 'resources/infownd-close-hover.png',
                markerWidth: 40,
                markerHeight: 40
            },
            {
                'markerType': 'path',
                'markerPath': [{
                    'path': 'M0 0h1024v1024H0z',
                    'fill': '#DE3333'
                }],
                'markerPathWidth': 1024,
                'markerPathHeight': 1024,
                markerWidth: 40,
                markerHeight: 40
            },
        ];
        const rotations = [15, 45, 90, 100, 180, -15, -60, -90, -115, -135, -180];

        const dxdys = [
            {
                markerDx: 0,
                markerDy: 0
            },
            {
                markerDx: Math.random() * 100,
                markerDy: Math.random() * 100
            },
            {
                markerDx: -Math.random() * 100,
                markerDy: -Math.random() * 100
            }
        ];
        const markers = [];
        symbols.forEach(symbol => {
            rotations.forEach(rotation => {
                dxdys.forEach(dxdy => {
                    const marker = new maptalks.Marker(center.copy(), {
                        symbol: Object.assign({}, symbol, { markerRotation: rotation }, dxdy),
                    });
                    markers.push(marker);
                });
            });
        });

        var domPosition = GET_PAGE_POSITION(container);

        function test() {
            console.log('markers.length:', markers.length);
            if (markers.length === 0) {
                done();
            } else {
                const marker = markers[0];
                layer.clear();
                var spy = sinon.spy();
                marker.on('click', spy);
                setTimeout(() => {
                    const center = marker.getContainerExtent().getCenter();
                    var point = center.add(domPosition);
                    happen.click(eventContainer, {
                        'clientX': point.x,
                        'clientY': point.y
                    });
                    expect(spy.called).to.be.ok();
                    markers.splice(0, 1);
                    test();
                }, 50);
                marker.addTo(layer);
            }
        }
        test();
    });

    it('text rotation #2061', function (done) {
        var center = map.getCenter();
        const symbols = [
            {
                textFaceName: "sans-serif",
                textName: '■',
                textSize: 22,
                textFill: "blue",
                textHaloFill: "black",
                textHaloRadius: 12,
            },
        ];
        const rotations = [15, 45, 90, 100, 180, -15, -60, -90, -115, -135, -180];

        const dxdys = [
            {
                textDx: 0,
                textDy: 0
            },
            {
                textDx: Math.random() * 100,
                textDy: Math.random() * 100
            },
            {
                textDx: -Math.random() * 100,
                textDy: -Math.random() * 100
            }
        ];
        const markers = [];
        symbols.forEach(symbol => {
            rotations.forEach(rotation => {
                dxdys.forEach(dxdy => {
                    const marker = new maptalks.Marker(center.copy(), {
                        symbol: Object.assign({}, symbol, { textRotation: rotation }, dxdy),
                    });
                    markers.push(marker);
                });
            });
        });

        var domPosition = GET_PAGE_POSITION(container);

        function test() {
            console.log('texts.length:', markers.length);
            if (markers.length === 0) {
                done();
            } else {
                const marker = markers[0];
                layer.clear();
                var spy = sinon.spy();
                marker.on('click', spy);
                setTimeout(() => {
                    const center = marker.getContainerExtent().getCenter();
                    var point = center.add(domPosition);
                    happen.click(eventContainer, {
                        'clientX': point.x,
                        'clientY': point.y
                    });
                    expect(spy.called).to.be.ok();
                    markers.splice(0, 1);
                    test();
                }, 50);
                marker.addTo(layer);
            }
        }
        test();
    });

    it('#2103 mouseout when no others mouse events', function (done) {
        var circle = new maptalks.Circle(map.getCenter(), 10);
        circle.addTo(layer);
        var domPosition = GET_PAGE_POSITION(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
        circle.on('mouseout', function (param) {
            expect(param.type).to.be.eql('mouseout');
            done();
        });

        happen.mousemove(eventContainer, {
            'clientX': point.x,
            'clientY': point.y
        });

        setTimeout(() => {
            happen.mousemove(eventContainer, {
                'clientX': point.x + 100,
                'clientY': point.y + 100
            });
        }, 50);
    });

    it('#2148 geometry cursor when listens is empty', function (done) {
        var circle = new maptalks.Circle(map.getCenter(), 10, { cursor: 'zoom-in' });
        circle.addTo(layer);
        var domPosition = GET_PAGE_POSITION(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);

        happen.mousemove(eventContainer, {
            'clientX': point.x,
            'clientY': point.y
        });
        setTimeout(() => {
            happen.mousemove(eventContainer, {
                'clientX': point.x + 2,
                'clientY': point.y + 2
            });

            setTimeout(() => {
                expect(map._priorityCursor).to.be.eql('zoom-in');
                done();
            }, 100);
        }, 16);
    });

    it('#2144 sector startAngle and endAngle<0', function (done) {
        var sector = new maptalks.Sector(center, 100, -250, -220);
        sector.addTo(layer);
        map.setZoom(17);
        var domPosition = GET_PAGE_POSITION(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
        sector.on('click', function (param) {
            expect(param.type).to.be.eql('click');
            done();
        });
        setTimeout(() => {
            happen.click(eventContainer, {
                'clientX': point.x - 20,
                'clientY': point.y - 30
            });
        }, 100);
    });
    it('#2144 sector random startAngle endAngle', function (done) {
        map.setZoom(17);
        const count = 100;
        var domPosition = GET_PAGE_POSITION(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
        const r = 20;
        let idx = 0;
        function test() {
            if (idx < count) {
                layer.clear();
                const startAngle = Math.random() * 360 - 360;
                const endAngle = startAngle + Math.random() * 330 + 15;
                var sector = new maptalks.Sector(center, 100, startAngle, endAngle);
                sector.addTo(layer);

                const [a1, a2] = sector._correctAngles();

                const rad = -(a1 + a2) / 2 / 180 * Math.PI;
                const x = Math.cos(rad) * r, y = Math.sin(rad) * r;

                setTimeout(() => {
                    sector.on('click', function (param) {
                        expect(param.type).to.be.eql('click');
                        idx++;
                        test();
                    });
                    happen.click(eventContainer, {
                        'clientX': point.x + x,
                        'clientY': point.y + y
                    });
                }, 20);
            } else {
                done();
            }
        }
        test();

    });

});
