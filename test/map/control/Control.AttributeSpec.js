describe("Control.Attribution", function() {

    var container;
    var map;
    var tile;
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

            urlTemplate:"http://t{s}.tianditu.com/DataServer?T=vec_w&x={x}&y={y}&l={z}",
            subdomains: [1, 2, 3]
        });
    });

    afterEach(function () {
        removeContainer(container)
    });

    it("contains specified content", function() {
        var control = new Z.control.Attribution({
            content: 'content'
        });
        map.addControl(control);

        expect(control._attributionContainer.innerHTML).to.eql('content');
    });

    it("setContent correctly", function() {
        var control = new Z.control.Attribution({
            content: 'content'
        });
        map.addControl(control);
        control.setContent('new content');

        expect(control._attributionContainer.innerHTML).to.eql('new content');
    });

});
