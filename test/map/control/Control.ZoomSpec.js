describe('Control.Zoom', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

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

        it('click on ruler to zoom', function () {
            var control = new maptalks.control.Zoom();
            map.addControl(control);
            var zoom = map.getZoom();
            var domPosition = GET_PAGE_POSITION(control._sliderRuler);
            happen.click(control._sliderRuler, {
                'clientX' : domPosition.x + 2,
                'clientY' : domPosition.y + 100
            });
            expect(map.getZoom()).to.be.above(zoom);
        });


        it('drag ruler dot to zoom', function () {
            var control = new maptalks.control.Zoom();
            map.addControl(control);
            var zoom = map.getZoom();
            var domPosition = GET_PAGE_POSITION(control._sliderDot).add(2, 2);
            var top = parseInt(control._sliderDot.style.top);
            happen.mousedown(control._sliderDot, {
                'clientX' : domPosition.x,
                'clientY' : domPosition.y
            });
            happen.mousemove(document, {
                'clientX' : domPosition.x,
                'clientY' : domPosition.y - 80
            });
            happen.mouseup(document, {
                'clientX' : domPosition.x,
                'clientY' : domPosition.y - 80
            });
            expect(map.getZoom()).to.be.above(zoom);
            expect(parseInt(control._sliderDot.style.top)).to.be.below(top);
        });
    });

});
