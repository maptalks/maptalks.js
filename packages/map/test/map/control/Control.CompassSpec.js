describe('Control.Compass', function () {
    var container;
    var map;
    var center = new maptalks.Coordinate(118, 32);

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '10px';
        container.style.height = '10px';
        document.body.appendChild(container);
        var option = {
            zoomAnimation: false,
            zoom: 5,
            center: center
        };
        map = new maptalks.Map(container, option);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    describe('Compass button', function () {

        it('change view, compass rotate correctly', function (done) {
            var control = new maptalks.control.Compass();
            map.addControl(control);

            map.setView({
                center: [120, 120],
                zoom: 10,
                bearing: 90,
                pitch: 1
            });

            map.once('viewchange', function () {
                expect(control._compass.style.transform).to.contain("rotate(-90deg)");
                done();
            });
        });

        it('click compass button, change the bearing correctly', function (done) {
            var control = new maptalks.control.Compass();
            map.addControl(control);

            map.setBearing(90);

            happen.click(control._compass);

            map.once('animateend', function () {
                expect(map.getBearing()).to.be(0);
                expect(control._compass.style.transform).to.contain("rotate(0deg)");
                done();
            });
        });
    })
})
