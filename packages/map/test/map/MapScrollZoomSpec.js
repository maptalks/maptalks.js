

describe('Map.ScrollZoom', function () {
    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var delay;
    function scrollMap(delta, clientX, clientY) {
        happen.once(container, {
            type: 'wheel',
            detail: delta,
            clientX: clientX || map.width / 2,
            clientY: clientY || map.height / 2
        });
    }

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center);
        container = setups.container;
        map = setups.map;
        map.config('seamlessZoom', false);
        map.config('zoomAnimationDuration', 10);
        delay = map.options['zoomAnimationDuration'];
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    describe('scroll map', function () {


        it('scroll up to zoomin', function (done) {
            var z = map.getZoom();
            var onZoomEnd = function () {
                var z2 = map.getZoom();
                expect(z2 < z).to.be.ok();
                done();
            };

            map.on('zoomend', onZoomEnd);
            scrollMap(100);
        });

        it('scroll down map to zoomout', function (done) {
            var z = map.getZoom();

            var onZoomEnd = function () {
                var z2 = map.getZoom();
                expect(z2 > z).to.be.ok();
                done();
            };
            map.on('zoomend', onZoomEnd);
            scrollMap(-100);
        });

        it('synchronize with mouse when scroll zoom map', (done) => {
            map.setPitch(45);
            //vlayer用于模拟鼠标的位置和高度
            const vlayer = new maptalks.VectorLayer('v').addTo(map);
            vlayer.queryTerrainAtPoint = function(containerPoint) {
                const coord = map.containerPointToCoordinate(containerPoint);
                return new maptalks.Coordinate(coord.x, coord.y - 0.2, 100);
            };
            vlayer.getTerrainLayer = function() {
                return true;
            }
            map.on('zoomend', function () {
                const center = map.getCenter();
                expect(center.x.toFixed(4)).to.eql(118.8474);
                expect(center.y.toFixed(4)).to.eql(32.0460);
                done();
            });
            scrollMap(100, 10, 10);
        });
    });

    describe('scrollZoom can be disable', function () {
        it('disables scrollZoom', function (done) {
            map.config('scrollWheelZoom', false);
            var spy = sinon.spy();
            map.on('zoomend', spy);
            scrollMap(-100);
            setTimeout(function () {
                expect(spy.called).not.to.be.ok();
                done();
            }, delay + 41);
        });

        it('disables by zoomable', function (done) {
            map.config('zoomable', false);
            var spy = sinon.spy();
            map.on('zoomend', spy);
            scrollMap(-100);
            setTimeout(function () {
                expect(spy.called).not.to.be.ok();
                done();
            }, delay + 41);
        });
    });

});
