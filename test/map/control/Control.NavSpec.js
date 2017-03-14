/*describe("Control.Nav", function() {

    var container;
    var map;
    var tile;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '800px';
        container.style.height = '600px';
        document.body.appendChild(container);
        var option = {
            zoom: 17,
            center: center
        };
        map = new maptalks.Map(container, option);
        tile = new maptalks.TileLayer('tile', {

            urlTemplate:"/resources/tile.png",
            subdomains: [1, 2, 3]
        });
        map.setBaseLayer(tile);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container)
    });

    it("events", function() {
        var nav = new maptalks.control.Nav();
        var spy = sinon.spy();
        nav._panToLeft = spy;
        nav._panToRight = spy;
        nav._panToDown = spy;
        nav._panToUp = spy;
        map.addControl(nav);

        spy.reset();
        happen.mousedown(nav._panToLeftButton);
        expect(spy.calledOnce).to.be.ok();

        spy.reset();
        happen.mousedown(nav._panToRightButton);
        expect(spy.calledOnce).to.be.ok();

        spy.reset();
        happen.mousedown(nav._panToDownButton);
        expect(spy.calledOnce).to.be.ok();

        spy.reset();
        happen.mousedown(nav._panToUpButton);
        expect(spy.calledOnce).to.be.ok();
    });

    describe("when buttons clicked", function() {
        var clock;
        var duration = 15;

        beforeEach(function() {
            clock = sinon.useFakeTimers();
        });

        afterEach(function() {
            clock.restore();
        });

        it("can pan left correctly", function() {
            var control = new maptalks.control.Nav();
            map.addControl(control);
            var pos = map.offsetPlatform();
            var offset;

            happen.mousedown(control._panToLeftButton);

            clock.tick(duration);
            offset = map.offsetPlatform();

            expect(offset.x).to.eql(pos.x + 1);
            expect(offset.y).to.eql(pos.y);
        });

        it("can pan right correctly", function() {
            var control = new maptalks.control.Nav();
            map.addControl(control);
            var pos = map.offsetPlatform();
            var offset;

            happen.mousedown(control._panToRightButton);

            clock.tick(duration);
            offset = map.offsetPlatform();
            expect(offset.x).to.eql(pos.x - 1);
            expect(offset.y).to.eql(pos.y);
        });

        it("can pan down correctly", function() {
            var control = new maptalks.control.Nav();
            map.addControl(control);
            var pos = map.offsetPlatform();
            var offset;

            happen.mousedown(control._panToDownButton);

            clock.tick(duration);
            offset = map.offsetPlatform();

            expect(offset.x).to.eql(pos.x);
            expect(offset.y).to.eql(pos.y - 1);
        });

        it("can pan up correctly", function() {
            var control = new maptalks.control.Nav();
            map.addControl(control);
            var pos = map.offsetPlatform();
            var offset;

            happen.mousedown(control._panToUpButton);

            clock.tick(duration);
            offset = map.offsetPlatform();

            expect(offset.x).to.eql(pos.x);
            expect(offset.y).to.eql(pos.y + 1);
        });

    });

});
*/
