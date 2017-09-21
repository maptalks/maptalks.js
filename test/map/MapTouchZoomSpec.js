describe('Map.TouchZoom', function () {
    var container, eventContainer;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var centerPoint;

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center, new maptalks.VectorLayer('id'));
        container = setups.container;
        map = setups.map;
        eventContainer = map._panels.canvasContainer;
        var domPosition = GET_PAGE_POSITION(container);
        centerPoint = map.coordinateToContainerPoint(center).add(domPosition);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    describe('touch zoom', function () {
        function testTouchZoom(startTouches, moveTouches, onZoomEnd) {
            map.on('zoomend', onZoomEnd);
            map.on('touchzoomstart', function () {
                happen.once(document, {
                    'type' : 'touchmove',
                    'touches' : startTouches
                });
                happen.once(document, {
                    'type':'touchend'
                });
            });
            if (!map.isLoaded()) {
                map.on('load', function () {
                    happen.once(eventContainer, {
                        'type' : 'touchstart',
                        'touches' : moveTouches
                    });
                });
            } else {
                happen.once(eventContainer, {
                    'type' : 'touchstart',
                    'touches' : moveTouches
                });
            }

        }


        it('zoomin', function (done) {
            var z = map.getZoom();
            testTouchZoom([{
                clientX : centerPoint.x - 10,
                clientY : centerPoint.y - 10,
            },
            {
                clientX : centerPoint.x + 10,
                clientY : centerPoint.y + 10,
            }], [{
                clientX : centerPoint.x - 1,
                clientY : centerPoint.y - 1,
            },
            {
                clientX : centerPoint.x + 1,
                clientY : centerPoint.y + 1,
            }], function () {
                var z2 = map.getZoom();
                expect(z < z2).to.be.ok();
                done();
            });

        });
        it('zoomout', function (done) {
            var z = map.getZoom();
            testTouchZoom([{
                clientX : centerPoint.x - 1,
                clientY : centerPoint.y - 1,
            },
            {
                clientX : centerPoint.x + 1,
                clientY : centerPoint.y + 1,
            }], [{
                clientX : centerPoint.x - 10,
                clientY : centerPoint.y - 10,
            },
            {
                clientX : centerPoint.x + 10,
                clientY : centerPoint.y + 10,
            }], function () {
                var z2 = map.getZoom();
                expect(z > z2).to.be.ok();
                done();
            });
        });
        it('disables scrollZoom', function (done) {
            this.timeout(5000);
            map.config('touchZoom', false);
            var spy = sinon.spy();
            testTouchZoom([{
                clientX : centerPoint.x - 10,
                clientY : centerPoint.y - 10,
            },
            {
                clientX : centerPoint.x + 10,
                clientY : centerPoint.y + 10,
            }], [{
                clientX : centerPoint.x - 1,
                clientY : centerPoint.y - 1,
            },
            {
                clientX : centerPoint.x + 1,
                clientY : centerPoint.y + 1,
            }], spy);

            setTimeout(function () {
                expect(spy.called).not.to.be.ok();
                done();
            }, map.options['zoomAnimationDuration'] + 100);
        });
    });

});
