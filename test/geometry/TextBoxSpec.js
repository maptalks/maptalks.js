// var CommonSpec = require('./CommonSpec');

describe('#TextBox', function() {

    var container;
    var map;
    var tile;
    var center = new Z.Coordinate(118.846825, 32.046534);
    var layer;

    beforeEach(function() {
        var setups = commonSetupMap(center);
        container = setups.container;
        map = setups.map;
    });

    afterEach(function() {
        map.removeLayer(layer);
        removeContainer(container)
    });

    describe('textBox fires events', function() {
        it('canvas events', function() {
            var vector = new maptalks.TextBox('test textbox', center);
            new GeoEventsTester().testCanvasEvents(vector, map, vector.getCenter());
        });
    });

    describe('change position',function() {
        it('events',function() {
            var spy = sinon.spy();

            var vector = new maptalks.TextBox('test textbox',center);
            vector.on('positionchange',spy);

            function evaluate() {
                var rnd = Math.random()*0.001;
                var coordinates = new Z.Coordinate(center.x+rnd, center.y+rnd);
                var radius = 1000*rnd;

                vector.setCoordinates(coordinates);
                expect(spy.calledOnce).to.be.ok();
                expect(vector.getCoordinates()).to.eql(coordinates);
                spy.reset();
            }

            evaluate();

            layer = new Z.VectorLayer('id');
            map.addLayer(layer);
            layer.addGeometry(vector);
            evaluate();
            vector.remove();
        });
    });

    describe('can get/set content',function() {
        it("get/set content",function() {
            var text = '中文标签';
            var vector = new maptalks.TextBox(text,center);
            layer = new Z.VectorLayer('id');
            map.addLayer(layer);
            layer.addGeometry(vector);
            expect(vector.getContent()).to.be.eql(text);
            text = '中文标签-2';
            vector.setContent(text);
            expect(vector.getContent()).to.be.eql(text);
        });
    });

    describe('can get/set symbol',function() {
        it("get/set symbol",function() {
            var text = '中文标签';
            var vector = new maptalks.TextBox(text,center);
            vector.setSymbol(null);
            //null symbol is allowed, means set to default symbol.
            expect(vector.getSymbol()).not.to.be.ok();
            layer = new Z.VectorLayer('id');
            map.addLayer(layer);
            layer.addGeometry(vector);
            var textboxSymbol = {
                'markerLineColor': '#ff0000',
                'markerLineWidth': 2,
                'markerLineOpacity': 0.9,
                'markerLineDasharray': null,
                'markerFillOpacity': 0.6,

                'textFaceName': 'arial',
                'textSize': 12,
                'textOpacity': 1,
                'textSpacing': 30,
                'textWrapWidth': null,//auto
                'textWrapBefore': false,
                'textWrapCharacter': '\n',
                'textLineSpacing': 8,
                'textHorizontalAlignment': 'middle',//left middle right
                'textVerticalAlignment': 'top'//top middle bottom
            };
            vector.setSymbol(textboxSymbol);
            //symbol's textName will be set.
            expect(vector.getSymbol()['textName']).not.to.be.empty();
        });
    });

    describe('can config',function() {
        it("configs",function() {
            var vector = new maptalks.TextBox('textbox',center);
            var defaultConfig = vector.config();
            expect(defaultConfig).to.be.empty();

        });
    });

    it('can edit', function() {
        var vector = new maptalks.TextBox('textbox',center);
        layer = new Z.VectorLayer('id');
        map.addLayer(layer);
        layer.addGeometry(vector);
        vector.startEditText();
        expect(vector.isEditingText()).to.be.ok();
        vector.endEditText();
        expect(vector.isEditingText()).not.to.be.ok();
    });
});
