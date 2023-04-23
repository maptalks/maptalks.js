describe('Control.Reset', function () {
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

    describe('Reset button', function () {

        it('pass view param, when reset button clicked, change the view correctly', function () {
            var control = new maptalks.control.Reset({
                view: {
                    center: [120, 20],
                    zoom: 8,
                    bearing: 10,
                    pitch: 30
                }
            });
            map.addControl(control);

            happen.click(control._reset);

            expect(map.getView()).to.eql({
                center: [120, 20],
                zoom: 8,
                bearing: 10,
                pitch: 30
            });
        });

        it('not pass view param, when reset button clicked, change the view correctly', function () {
            var control = new maptalks.control.Reset();
            map.addControl(control);

            happen.click(control._reset);

            expect(map.getView()).to.eql({
                center: [118, 32],
                zoom: 5,
                bearing: 0,
                pitch: 0
            });
        })

        it('after setView, when reset button clicked, change the view correctly', function (done) {
            var control = new maptalks.control.Reset();
            map.addControl(control);

            control.setView({
                center: [120, 20],
                zoom: 10,
                bearing: 2,
                pitch: 1
            });

            happen.click(control._reset);

            map.once('viewchange', function () {
                expect(map.getView()).to.eql({
                    center: [120, 20],
                    zoom: 10,
                    bearing: 2,
                    pitch: 1
                });
                done();
            });
        })
    })
})
