
describe('#LabelEdit', function () {
    var container, eventContainer;
    var map;
    var center = new Z.Coordinate(118.846825, 32.046534);
    var layer;

    beforeEach(function() {
        var setups = commonSetupMap(center, null);
        container = setups.container;
        map = setups.map;
        map.config('panAnimation', false);
        eventContainer = map._panels.canvasContainer;
        layer = new Z.VectorLayer('id');
        map.addLayer(layer);
    });

    afterEach(function() {
        removeContainer(container)
    });

    describe('edit label', function() {
        it('start edit label',function() {
            var label = new maptalks.Label('I am a Text', map.getCenter()).addTo(layer);
            label.startEditText();
            expect(label.isEditingText()).to.be.ok;
        });

    });


});
