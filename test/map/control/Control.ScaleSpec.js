describe("Control.Scale", function() {

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
    });

    afterEach(function () {
        removeContainer(container)
    });

    it("widgets contain correct value after initialized", function() {
        var control = new maptalks.control.Scale({
            metric: true,
            imperial: true
        });
        map.addControl(control);

        expect(control._mScale.innerHTML).to.not.be.empty();
        expect(control._iScale.innerHTML).to.not.be.empty();
        expect(control._mScale.innerHTML).to.contain('100');
    });

});
