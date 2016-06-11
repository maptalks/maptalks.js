describe("Control Common Test", function() {

    var container;
    var map;
    var tile,control;
    var center = new Z.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '800px';
        container.style.height = '600px';
        document.body.appendChild(container);
        var option = {
            zoom: 17,
            center: center
        };
        map = new Z.Map(container, option);
        tile = new Z.TileLayer('tile', {

            urlTemplate:"/resources/tile.png",
            subdomains: [1, 2, 3]
        });
        control = new Z.control.Scale({
            metric: true,
            imperial: true
        });
        map.addControl(control);
    });

    afterEach(function () {
        removeContainer(container)
    });

    it("has common methods", function() {
        expect(control.getContainerPoint() instanceof Z.Point).to.be.ok();
        control.hide();
        expect(control.getContainer().style.display==='none').to.be.ok();
        control.show();
        expect(control.getContainer().style.display==='').to.be.ok();
        var position = control.getPosition();
        expect(position).not.to.be.empty();
        control.setPosition(Z.Control['top_right']);
        expect(control.getPosition()).not.to.be.eql(position);
        control.remove();
        expect(control.getContainer()).not.to.be.ok();
    });

    it("can be removed by map",function() {
        map.removeControl(control);
        expect(control.getContainer()).not.to.be.ok();
    });

});
