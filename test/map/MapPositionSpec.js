describe('Map.Position', function () {

    var container;
    var eventContainer;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var point = new maptalks.Point(100, 475);
    var offetY = 300;

    beforeEach(function () {
        document.body.style.cssText = 'height:2500px; margin:0; padding:0;';
        container = document.createElement('div');
        container.style.width = '400px';
        container.style.height = '500px';
        container.style.background = '#000';
        document.body.appendChild(container);
        var option = {
            zoomAnimation: false,
            zoom: 17,
            center: center
        };
        map = new maptalks.Map(container, option);
        eventContainer = map._panels.canvasContainer;
        // eventContainer = map._containerDOM;
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
        document.body.style.cssText = '';
    });


    it('page not scroll map position', function (done) {
        map.on('mousedown click', function (e) {
            expect(e.containerPoint).to.closeTo(point);
            console.log(map._containerDOM.__position);
            expect(map._containerDOM.__position).to.be.eql([0, 0, 1, 1]);
        });
        happen.mousedown(eventContainer, {
            'clientX': point.x,
            'clientY': point.y
        });

        setTimeout(function () {
            happen.click(eventContainer, {
                'clientX': point.x,
                'clientY': point.y
            });
            done();
        }, 16);
    });

    it('page scroll map position', function (done) {
        map.on('mousedown click', function (e) {
            expect(e.containerPoint).to.closeTo(point);
            console.log(map._containerDOM.__position);
            expect(map._containerDOM.__position).to.be.eql([0, -offetY, 1, 1]);
        });
        window.scrollTo(0, offetY);
        var offsetPoint = point.copy().sub(0, offetY);

        setTimeout(function () {
            happen.mousedown(eventContainer, {
                'clientX': offsetPoint.x,
                'clientY': offsetPoint.y
            });
            happen.click(eventContainer, {
                'clientX': offsetPoint.x,
                'clientY': offsetPoint.y
            });
            done();
        }, 1000);
    });
});
