// var CommonSpec = require('./CommonSpec');

describe('LabelSpec', function() {

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
        document.body.removeChild(container);
    });

    describe('label fires events', function() {
        it('svg events', function() {
            var vector = new maptalks.Label('test label', center);
            new GeoEventsTester().testSVGEvents(vector, map);
        });

        it('canvas events', function() {
            var vector = new maptalks.Label('test label', center);
            new GeoEventsTester().testCanvasEvents(vector, map, vector.getCenter());
        });
    });

    describe('change position',function() {
        it('events',function() {
            var spy = sinon.spy();

            var vector = new maptalks.Label('test label',center);
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
            var label = '中文标签';
            var vector = new maptalks.Label(label,center);
            layer = new Z.VectorLayer('id');
            map.addLayer(layer);
            layer.addGeometry(vector);
            expect(vector.getContent()).to.be.eql(label);
            label = '中文标签-2';
            vector.setContent(label);
            expect(vector.getContent()).to.be.eql(label);
        });
    });

    describe('can get/set textAlign',function() {
        it("get/set textAlign",function() {
            var label = '中文标签';
            var vector = new maptalks.Label(label,center);
            vector.config('boxAutoSize',false);
            //default textalign
            expect(vector.config('boxTextAlign')).to.be.eql('middle');
            vector.config('boxTextAlign','right');
            expect(vector.config('boxTextAlign')).to.be.eql('right');
            layer = new Z.VectorLayer('id');
            map.addLayer(layer);
            layer.addGeometry(vector);
            expect(vector.config('boxTextAlign')).to.be.eql('right');
            vector.config('boxTextAlign','left');
            expect(vector.config('boxTextAlign')).to.be.eql('left');
        });
    });

    describe('can get/set symbol',function() {
        it("get/set symbol",function() {
            var label = '中文标签';
            var vector = new maptalks.Label(label,center);
            vector.setSymbol(null);
            //null symbol is allowed, means set to default symbol.
            expect(vector.getSymbol()).not.to.be.empty();
            layer = new Z.VectorLayer('id');
            map.addLayer(layer);
            layer.addGeometry(vector);
            var labelSymbol = {
                // 'markerType': 'ellipse',
                'markerLineColor': '#ff0000',
                'markerLineWidth': 2,
                'markerLineOpacity': 0.9,
                'markerLineDasharray': null,
                // 'markerFill': '#4e98dd',
                'markerFillOpacity': 0.6,

                'textFaceName': 'arial',
                'textSize': 12,
                // 'textFill': '#ff0000',
                'textOpacity': 1,
                'textSpacing': 30,
                'textWrapWidth': null,//auto
                'textWrapBefore': false,
                'textWrapCharacter': '\n',
                'textLineSpacing': 8,
                'textHorizontalAlignment': 'middle',//left middle right
                'textVerticalAlignment': 'top'//top middle bottom
            };
            vector.setSymbol(labelSymbol);
            //symbol's textName will be set.
            expect(vector.getSymbol()['textName']).not.to.be.empty();
        });
    });

    describe('can config',function() {
        it("configs",function() {
            var vector = new maptalks.Label('label',center);
            var defaultConfig = vector.config();
            expect(defaultConfig).to.be.empty();

        });
    });
});
