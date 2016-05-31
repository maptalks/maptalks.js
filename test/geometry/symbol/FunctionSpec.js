
describe('FunctionTypeSpec', function() {

    var container;
    var map;
    var tile;
    var center = new Z.Coordinate(118.846825, 32.046534);
    var layer;
    var canvasContainer;

    beforeEach(function() {
        var setups = commonSetupMap(center);
        container = setups.container;
        map = setups.map;
        canvasContainer = map._panels.canvasContainer;
        layer = new maptalks.VectorLayer('id').addTo(map);
    });

    afterEach(function() {
        map.removeLayer(layer);
        removeContainer(container);
    });

    it('marker-width with a function', function(done) {
        var marker = new maptalks.Marker([100,0], {
            symbol:{
                "marker-file" : "resources/x.svg",
                "marker-width": {stops: [[1, 1], [5, 10]]},
                "marker-height":30
            }
        });
        layer.once('layerload', function() {
            expect(marker.getMap()).to.be.ok();
            expect(marker.getSize().width).to.be.eql(10);
            done();
        });
        layer.addGeometry(marker);
    });
});
