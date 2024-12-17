

describe.skip('#MapBorderPanningSpec', function () {
    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center);
        container = setups.container;
        map = setups.map;
        map.config('autoBorderPanning', true);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    describe('pan map when mousemove on the border of map', function () {

        it('pan up when mousemove on the up border', function () {
            var center = map.getCenter();
            happen.mousemove(container, {
                'clientX': 100,
                'clientY': 9
            });
            expect(map.getCenter().y).to.be.above(center.y);
        });

        it('pan left when mousemove on the left border', function () {
            var center = map.getCenter();
            happen.mousemove(container, {
                'clientX': 10,
                'clientY': 100
            });
            expect(map.getCenter().x).to.be.below(center.x);
        });

        it('pan right when mousemove on the right border', function () {
            var center = map.getCenter();
            happen.mousemove(container, {
                'clientX': parseInt(container.style.width),
                'clientY': 100
            });
            expect(map.getCenter().x).to.be.above(center.x);
        });

        it('pan down when mousemove on the botton border', function () {
            var center = map.getCenter();
            happen.mousemove(container, {
                'clientX': 100,
                'clientY': parseInt(container.style.height)
            });
            expect(map.getCenter().y).to.be.below(center.y);
        });

        it('not pan if mousemove not on border', function () {
            var center = map.getCenter();
            happen.mousemove(container, {
                'clientX': 100,
                'clientY': 100
            });
            expect(map.getCenter().x).to.be.eql(center.x);
        });
    });



    describe('autoPanning can be disable', function () {
        it('disables autoBorderPanning', function () {
            var center = map.getCenter();
            map.config('autoBorderPanning', false);
            happen.mousemove(container, {
                'clientX': 100,
                'clientY': 10
            });
            expect(map.getCenter()).to.be.eql(center);
        });
    });

});
