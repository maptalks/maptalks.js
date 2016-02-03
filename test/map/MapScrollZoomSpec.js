

describe('#MapScrollZoomSpec', function () {
    var container,mapPlatform;
    var map;
    var tile;
    var center = new Z.Coordinate(118.846825, 32.046534);
    var clock;
    var delay;
    function scrollMap( delta) {
       happen.once(container, {
            type: 'mousewheel',
            detail: delta
        });
    }

    beforeEach(function() {
        var setups = commonSetupMap(center);
        container = setups.container;
        map = setups.map;
        delay = map.options['zoomAnimationDuration'];
        mapPlatform = map._panels.mapPlatform;
        clock = sinon.useFakeTimers();
    });

    afterEach(function() {
        clock.restore();
        document.body.removeChild(container);
    });

    describe('scroll map', function() {

        before(function () {  });
        after(function () {  });
        it('scroll up to zoomin', function() {
            var z = map.getZoom();

            var onZoomEnd = function() {
                var z2 = map.getZoom();
                expect(z2 < z).to.be.ok();
            };
            var spy = sinon.spy();
            map.on('zoomend', spy);
            map.on('zoomend', onZoomEnd);
            scrollMap(100);
            clock.tick(delay+41);
            expect(spy.called).to.be.ok();
        });

        it('scroll down map to zoomout', function() {
            var z = map.getZoom();

            var onZoomEnd = function() {
                var z2 = map.getZoom();
                expect(z2 > z).to.be.ok();
            };
            var spy = sinon.spy();
            map.on('zoomend', spy);
            map.on('zoomend', onZoomEnd);
            scrollMap(-100);
            clock.tick(delay+41);
            expect(spy.called).to.be.ok();
        });
    });

    describe('scrollZoom can be disable', function() {
        it('disables scrollZoom', function() {
            var z = map.getZoom();
            map.config('scrollWheelZoom',false);
            var spy = sinon.spy();
            map.on('zoomend', spy);
            scrollMap(-100);
            clock.tick(delay+41);
            expect(spy.called).not.to.be.ok();
        });
    });

});
