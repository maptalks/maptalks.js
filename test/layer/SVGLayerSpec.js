// var utils = require('../SpecUtils.js');

describe('SVGLayer', function() {

    var container;
    var map;
    var tile;
    var center = new Z.Coordinate(118.846825, 32.046534);

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
    });

    afterEach(function() {
        document.body.removeChild(container);
    });

    describe('addGeometry', function() {

        var layer = new Z.VectorLayer('id');

        beforeEach(function() {
            map.setBaseLayer(tile);
            map.addLayer(layer);
        });

        afterEach(function() {
            map.removeLayer(layer);
        });

        it('all type of geometry', function() {
            var geometries = genAllTypeGeometries();

            expect(function() {
                layer.addGeometry(geometries,true);
            }).to.not.throwException();
        });
    });

});
