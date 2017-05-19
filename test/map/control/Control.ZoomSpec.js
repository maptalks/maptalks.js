describe('Control.Zoom', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '800px';
        container.style.height = '600px';
        document.body.appendChild(container);
        var option = {
            zoomAnimation: false,
            zoom: 15,
            center: center
        };
        map = new maptalks.Map(container, option);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    describe('Zoom button', function () {

        it('when enabled, can trigger correct events', function (done) {
            var control = new maptalks.control.Zoom();
            var z = map.getZoom();
            map.addControl(control);
            map.once('zoomend', function () {
                expect(map.getZoom()).to.be.eql(z + 1);
                map.once('zoomend', function () {
                    expect(map.getZoom()).to.be.eql(z);
                    done();
                });
                happen.click(control._zoomOutButton);
            });
            happen.click(control._zoomInButton);
        });

        it('when zoom in button clicked, change zoom correctly', function () {
            var control = new maptalks.control.Zoom();
            map.addControl(control);
            var zoom = map.getZoom();

            happen.click(control._zoomInButton);
            expect(map.getZoom()).to.be(zoom + 1);
        });

        it('when zoom out button clicked, change zoom correctly', function () {
            var control = new maptalks.control.Zoom();
            map.addControl(control);
            var zoom = map.getZoom();

            happen.click(control._zoomOutButton);
            expect(map.getZoom()).to.be(zoom - 1);
        });

       /* it("when disabled, don't update zoom of map", function() {
            var control = new maptalks.control.Zoom();
            map.addControl(control);
            var zoom = map.getZoom();
            control.disable();

            happen.click(control._zoomInButton);
            expect(map.getZoom()).to.be(zoom);

            happen.click(control._zoomOutButton);
            expect(map.getZoom()).to.be(zoom);
        });*/

    });

});
