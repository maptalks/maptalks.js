describe('VectorSpec', function() {

    var container;
    var map;
    var tile;
    var center = new Z.Coordinate(118.846825, 32.046534);
    var layer;

    beforeEach(function() {
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
        map.setBaseLayer(tile);
        layer = new Z.VectorLayer('id');
        map.addLayer(layer);
    });

    afterEach(function() {
        map.removeLayer(layer);
        document.body.removeChild(container);
    });

    /*describe('events', function() {
        it('fires click event when clicked', function() {
            var spy = sinon.spy();
            var vector = new Z.Circle(center, 1);
            vector.on('click', spy);
            layer.addGeometry(vector);
            var painter = vector._getPainter();
            happen.click(painter.getSvgDom()[0]);

            expect(spy.called).to.be.ok();
        });
    });*/

});
