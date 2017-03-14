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

        it('when enabled, can trigger correct events', function () {
            var control = new maptalks.control.Zoom();
            var spy = sinon.spy();
            map.zoomIn = spy;
            map.zoomOut = spy;
            map.addControl(control);
            // control.enable();

            spy.reset();
            happen.click(control._zoomInButton);
            expect(spy.calledOnce).to.be.ok();

            spy.reset();
            happen.click(control._zoomOutButton);
            expect(spy.calledOnce).to.be.ok();
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
