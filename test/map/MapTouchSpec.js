describe('Map.Touch', function () {
    var container, eventContainer;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var centerPoint;

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center, new maptalks.VectorLayer('id'));
        container = setups.container;
        map = setups.map;
        eventContainer = map.getPanels().canvasContainer;
        var domPosition = GET_PAGE_POSITION(container);
        centerPoint = map.coordinateToContainerPoint(center).add(domPosition);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    function testTouchMap(startTouches, moveTouches, events) {
        for (var p in events) {
            map.on(p, events[p]);
        }
        map.on('touchactstart', function () {
            happen.once(document, {
                'type' : 'touchmove',
                'touches' : moveTouches
            });
            happen.once(document, {
                'type':'touchend',
                'touches' : moveTouches
            });
        });
        if (!map.isLoaded()) {
            map.on('load', function () {
                happen.once(eventContainer, {
                    'type' : 'touchstart',
                    'touches' : startTouches
                });
            });
        } else {
            happen.once(eventContainer, {
                'type' : 'touchstart',
                'touches' : startTouches
            });
        }
    }

    describe('touch rotate', function () {
        it('rotate clock wise', function (done) {
            var z = map.getBearing();
            testTouchMap([{
                clientX : centerPoint.x - 1,
                clientY : centerPoint.y - 1,
            },
            {
                clientX : centerPoint.x + 1,
                clientY : centerPoint.y + 1,
            }], [{
                clientX : centerPoint.x - 0,
                clientY : centerPoint.y - 1,
            },
            {
                clientX : centerPoint.x,
                clientY : centerPoint.y + 1,
            }], {
                'rotateend' : function () {
                    var z2 = map.getBearing();
                    expect(z > z2).to.be.ok();
                    done();
                }
            });

        });

        it('rotate counter clock wise', function (done) {
            var z = map.getBearing();
            testTouchMap([{
                clientX : centerPoint.x - 1,
                clientY : centerPoint.y - 1,
            },
            {
                clientX : centerPoint.x + 1,
                clientY : centerPoint.y + 1,
            }], [{
                clientX : centerPoint.x - 0,
                clientY : centerPoint.y + 1,
            },
            {
                clientX : centerPoint.x,
                clientY : centerPoint.y - 1,
            }], {
                'rotateend' : function () {
                    var z2 = map.getBearing();
                    expect(z < z2).to.be.ok();
                    done();
                }
            });

        });
    });

    describe('touch pitch', function () {
        it('down to pitch', function (done) {
            map.setPitch(20);
            var z = map.getPitch();
            testTouchMap([{
                clientX : centerPoint.x - 1,
                clientY : centerPoint.y + 1,
            },
            {
                clientX : centerPoint.x + 1,
                clientY : centerPoint.y + 1,
            }], [{
                clientX : centerPoint.x - 1,
                clientY : centerPoint.y + 12,
            },
            {
                clientX : centerPoint.x + 1,
                clientY : centerPoint.y + 12,
            }], {
                'pitchend' : function () {
                    var z2 = map.getPitch();
                    expect(z > z2).to.be.ok();
                    done();
                }
            });

        });

        it('up to pitch', function (done) {
            map.setPitch(20);
            var z = map.getPitch();
            testTouchMap([{
                clientX : centerPoint.x - 1,
                clientY : centerPoint.y + 1,
            },
            {
                clientX : centerPoint.x + 1,
                clientY : centerPoint.y + 1,
            }], [{
                clientX : centerPoint.x - 1,
                clientY : centerPoint.y - 12,
            },
            {
                clientX : centerPoint.x + 1,
                clientY : centerPoint.y - 12,
            }], {
                'pitchend' : function () {
                    var z2 = map.getPitch();
                    expect(z < z2).to.be.ok();
                    done();
                }
            });

        });
    });

    describe('touch zoom', function () {
        it('zoomin', function (done) {
            var z = map.getZoom();
            testTouchMap([{
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
            }], {
                'zoomend' : function () {
                    var z2 = map.getZoom();
                    expect(z > z2).to.be.ok();
                    done();
                }
            });

        });
        it('zoomout', function (done) {
            var z = map.getZoom();
            testTouchMap([{
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
            }], {
                'zoomend' : function () {
                    var z2 = map.getZoom();
                    expect(z < z2).to.be.ok();
                    done();
                }
            });
        });
        it('disables touchZoom', function (done) {
            this.timeout(5000);
            map.config('touchZoom', false);
            var spy = sinon.spy();
            testTouchMap([{
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
            }],  {
                'zoomend' : spy
            });

            setTimeout(function () {
                expect(spy.called).not.to.be.ok();
                done();
            }, map.options['zoomAnimationDuration'] + 100);
        });

        it('disables touchZoom by zoomable', function (done) {
            this.timeout(5000);
            map.config('zoomable', false);
            var spy = sinon.spy();
            testTouchMap([{
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
            }],  {
                'zoomend' : spy
            });

            setTimeout(function () {
                expect(spy.called).not.to.be.ok();
                done();
            }, map.options['zoomAnimationDuration'] + 100);
        });
    });

    describe('touch rotate and zoom', function () {
        it('zoom and rotate at the same time', function (done) {
            map.config('touchZoomRotate', true);
            var z = map.getZoom();
            var b = map.getBearing();
            testTouchMap([{
                clientX : centerPoint.x - 1,
                clientY : centerPoint.y - 1,
            },
            {
                clientX : centerPoint.x + 1,
                clientY : centerPoint.y + 1,
            }], [{
                clientX : centerPoint.x + 5,
                clientY : centerPoint.y - 5,
            },
            {
                clientX : centerPoint.x - 6,
                clientY : centerPoint.y + 5,
            }], {
                'rotateend' : function () {
                    var b2 = map.getBearing();
                    var z2 = map.getZoom();
                    expect(b > b2).to.be.ok();
                    expect(z2 > z).to.be.ok();
                    done();
                }
            });

        });
    });

});
