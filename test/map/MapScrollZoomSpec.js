

describe('#MapScrollZoomSpec', function () {
    var container,mapPlatform;
    var map;
    var tile;
    var center = new Coordinate(118.846825, 32.046534);
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
        mapPlatform = map._panels.front;
    });

    afterEach(function() {
        removeContainer(container)
    });

    describe('scroll map', function() {


        it('scroll up to zoomin', function(done) {
            var z = map.getZoom();
            var onZoomEnd = function() {
                var z2 = map.getZoom();
                expect(z2 < z).to.be.ok();
                done();
            };

            map.on('zoomend', onZoomEnd);
            scrollMap(100);
        });

        it('scroll down map to zoomout', function(done) {
            var z = map.getZoom();

            var onZoomEnd = function() {
                var z2 = map.getZoom();
                expect(z2 > z).to.be.ok();
                done();
            };
            map.on('zoomend', onZoomEnd);
            scrollMap(-100);
        });
    });

    describe('scrollZoom can be disable', function() {
        it('disables scrollZoom', function(done) {
            var z = map.getZoom();
            map.config('scrollWheelZoom',false);
            var spy = sinon.spy();
            map.on('zoomend', spy);
            scrollMap(-100);
            setTimeout(function() {
                expect(spy.called).not.to.be.ok();
                done();
            }, delay+41)
        });
    });

});
