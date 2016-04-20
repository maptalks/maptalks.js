
describe('MapTouchZoomSpec', function () {
    var container,eventContainer;
    var map;
    var tile;
    var center = new Z.Coordinate(118.846825, 32.046534);
    var centerPoint;

    beforeEach(function() {
        var setups = commonSetupMap(center, new maptalks.VectorLayer('id'));
            container = setups.container;
            map = setups.map;
            delay = map.options['zoomAnimationDuration'];
            eventContainer = map._panels.canvasContainer;;
            var domPosition = Z.DomUtil.getPagePosition(container);
            centerPoint = map.coordinateToContainerPoint(center).add(domPosition);
    });

    afterEach(function() {
        removeContainer(container)
    });

    describe('touch zoom', function() {
        function testTouchZoom(startTouches, moveTouches, onZoomEnd) {
            map.on('zoomend', onZoomEnd);
            map.on('touchzoomstart', function() {
                    happen.once(document, {
                        'type' : 'touchmove',
                        'touches' : startTouches
                    });
                    happen.once(document,{
                        'type':'touchend'
                    });
            });
            if (!map.isLoaded()) {
                map.on('load',function() {
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

        before(function () {});
        after(function () {});
        it('zoomin', function(done) {
            var z = map.getZoom();
            testTouchZoom([{
                            pageX : centerPoint.x-10,
                            pageY : centerPoint.y-10,
                        },
                        {
                            pageX : centerPoint.x+10,
                            pageY : centerPoint.y+10,
                        }],[{
                            pageX : centerPoint.x-1,
                            pageY : centerPoint.y-1,
                        },
                        {
                            pageX : centerPoint.x+1,
                            pageY : centerPoint.y+1,
                        }],function(){
                            var z2 = map.getZoom();
                            expect(z < z2).to.be.ok();
                            done();
                        });

        });
        it('zoomout', function(done) {
            var z = map.getZoom();
            testTouchZoom([{
                            pageX : centerPoint.x-1,
                            pageY : centerPoint.y-1,
                        },
                        {
                            pageX : centerPoint.x+1,
                            pageY : centerPoint.y+1,
                        }],[{
                            pageX : centerPoint.x-10,
                            pageY : centerPoint.y-10,
                        },
                        {
                            pageX : centerPoint.x+10,
                            pageY : centerPoint.y+10,
                        }],function(){
                            var z2 = map.getZoom();
                            expect(z > z2).to.be.ok();
                            done();
                        });
        });
        it('disables scrollZoom', function(done) {
            this.timeout(5000);
            var z = map.getZoom();
            map.config('touchZoom',false);
            var spy = sinon.spy();
            testTouchZoom([{
                            pageX : centerPoint.x-10,
                        pageY : centerPoint.y-10,
                    },
                    {
                        pageX : centerPoint.x+10,
                        pageY : centerPoint.y+10,
                    }],[{
                        pageX : centerPoint.x-1,
                        pageY : centerPoint.y-1,
                    },
                    {
                        pageX : centerPoint.x+1,
                        pageY : centerPoint.y+1,
                    }],spy);

            setTimeout(function() {
                expect(spy.called).not.to.be.ok();
                done();
            }, delay+100)
        });
    });

});
