describe('Map.Position', function () {

    var container;
    var eventContainer;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var point = new maptalks.Point(100, 475);
    var expectPoint = new maptalks.Point(92, 467);
    var offetY = 300;
    var position = [8, 8, 1, 1];

    beforeEach(function () {
        document.body.style.cssText = 'height:2500px;';
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
        delete map._env;
        map.remove();
        REMOVE_CONTAINER(container);
        document.body.style.cssText = '';
    });


    it('page not scroll map position', function (done) {
        map.on('mousedown click', function (e) {
            expect(map._containerDOM.__position).to.be.eql(position);
            expect(e.containerPoint).to.closeTo(expectPoint);
        });
        map._containerDOM.__position = position;
        setTimeout(function () {
            happen.mousedown(eventContainer, {
                'clientX': point.x,
                'clientY': point.y
            });
            done();
        }, 100);
    });

    it('page scroll map position', function (done) {
        map.on('mousedown click', function (e) {
            expect(map._containerDOM.__position).to.be.eql([position[0], position[1] - offetY, position[2], position[3]]);
            expect(e.containerPoint).to.closeTo(expectPoint);
        });
        map._containerDOM.__position = position;
        window.scrollTo(0, offetY);
        var offsetPoint = point.copy().sub(0, offetY);
        setTimeout(function () {
            happen.mousedown(eventContainer, {
                'clientX': offsetPoint.x,
                'clientY': offsetPoint.y
            });
            done();
        }, 1000);
    });
});
