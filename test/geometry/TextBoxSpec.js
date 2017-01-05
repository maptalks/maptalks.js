describe('#TextBox', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var layer;

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center);
        container = setups.container;
        map = setups.map;
        map.removeBaseLayer();
    });

    afterEach(function () {
        map.removeLayer(layer);
        REMOVE_CONTAINER(container);
    });

    describe('textBox fires events', function () {
        it('canvas events', function () {
            var vector = new maptalks.TextBox('test textbox', center);
            new COMMON_GEOEVENTS_TESTOR().testCanvasEvents(vector, map, vector.getCenter());
        });
    });

    describe('change position', function () {
        it('events', function () {
            var spy = sinon.spy();

            var vector = new maptalks.TextBox('test textbox', center);
            vector.on('positionchange', spy);

            function evaluate() {
                var rnd = Math.random() * 0.001;
                var coordinates = new maptalks.Coordinate(center.x + rnd, center.y + rnd);

                vector.setCoordinates(coordinates);
                expect(spy.calledOnce).to.be.ok();
                expect(vector.getCoordinates()).to.eql(coordinates);
                spy.reset();
            }

            evaluate();

            layer = new maptalks.VectorLayer('id');
            map.addLayer(layer);
            layer.addGeometry(vector);
            evaluate();
            vector.remove();
        });
    });

    describe('can get/set content', function () {
        it('get/set content', function () {
            var text = '中文标签';
            var vector = new maptalks.TextBox(text, center);
            layer = new maptalks.VectorLayer('id');
            map.addLayer(layer);
            layer.addGeometry(vector);
            expect(vector.getContent()).to.be.eql(text);
            text = '中文标签-2';
            vector.setContent(text);
            expect(vector.getContent()).to.be.eql(text);
        });
    });

    describe('can get/set symbol', function () {
        it('get/set symbol', function () {
            var text = '中文标签';
            var vector = new maptalks.TextBox(text, center);
            vector.setSymbol(null);
            //null symbol is allowed, means set to default symbol.
            expect(vector.getSymbol()).not.to.be.ok();
            layer = new maptalks.VectorLayer('id');
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
                'textWrapWidth': null, //auto
                'textWrapBefore': false,
                'textWrapCharacter': '\n',
                'textLineSpacing': 8,
                'textHorizontalAlignment': 'middle', //left middle right
                'textVerticalAlignment': 'top'//top middle bottom
            };
            vector.setSymbol(textboxSymbol);
            //symbol's textName will be set.
            expect(vector.getSymbol()['textName']).not.to.be.empty();
        });
    });

    describe('can config', function () {
        it('configs', function () {
            var vector = new maptalks.TextBox('textbox', center);
            var defaultConfig = vector.config();
            expect(defaultConfig).to.be.empty();

        });
    });

    describe('alignment', function () {
        it('left', function () {
            var vector = new maptalks.TextBox('■■■', center, {
                box : false,
                symbol : {
                    'markerWidth' : 100,
                    'markerHeight' : 50,
                    'markerFillOpacity' : 0,
                    'markerLineOpacity' : 0,
                    'textHorizontalAlignment' : 'left'
                }
            });
            layer = new maptalks.VectorLayer('id', { 'drawImmediate' : true });
            map.addLayer(layer);
            layer.addGeometry(vector);
            expect(layer).to.be.painted(-Math.floor(100 / 2) + 2, 0);
            expect(layer).not.to.be.painted(Math.floor(100 / 2) - 2, 0);
        });

        it('right', function () {
            var vector = new maptalks.TextBox('■■■', center, {
                box : false,
                symbol : {
                    'markerWidth' : 100,
                    'markerHeight' : 50,
                    'markerFillOpacity' : 0,
                    'markerLineOpacity' : 0,
                    'textHorizontalAlignment' : 'right'
                }
            });
            layer = new maptalks.VectorLayer('id', { 'drawImmediate' : true });
            map.addLayer(layer);
            layer.addGeometry(vector);
            expect(layer).to.be.painted(Math.floor(100 / 2) - 3, 0);
            expect(layer).not.to.be.painted(-Math.floor(100 / 2) + 3, 0);
        });

        it('top', function () {
            var vector = new maptalks.TextBox('■■■', center, {
                box : false,
                symbol : {
                    'markerWidth' : 100,
                    'markerHeight' : 50,
                    'markerFillOpacity' : 0,
                    'markerLineOpacity' : 0,
                    'textVerticalAlignment' : 'top'
                }
            });
            layer = new maptalks.VectorLayer('id', { 'drawImmediate' : true });
            map.addLayer(layer);
            layer.addGeometry(vector);
            expect(layer).to.be.painted(0, -50 / 2 + 6);
            expect(layer).not.to.be.painted(0, 50 / 2 - 6);
        });

        it('bottom', function () {
            var vector = new maptalks.TextBox('■■■', center, {
                box : false,
                symbol : {
                    'markerWidth' : 100,
                    'markerHeight' : 50,
                    'markerFillOpacity' : 0,
                    'markerLineOpacity' : 0,
                    'textVerticalAlignment' : 'bottom'
                }
            });
            layer = new maptalks.VectorLayer('id', { 'drawImmediate' : true });
            map.addLayer(layer);
            layer.addGeometry(vector);
            expect(layer).to.be.painted(0, 50 / 2 - 5);
            expect(layer).not.to.be.painted(0, -50 / 2 + 5);
        });
    });

    it('autoSize', function () {
        var vector = new maptalks.TextBox('■■■', center, {
            boxAutoSize: true
        });
        var symbol = vector._getInternalSymbol();
        expect(symbol.markerWidth).to.be.above(5);
        expect(symbol.markerHeight).to.be.above(5);
    });

    it('can edit', function () {
        var vector = new maptalks.TextBox('textbox', center);
        layer = new maptalks.VectorLayer('id');
        map.addLayer(layer);
        layer.addGeometry(vector);
        vector.startEditText();
        expect(vector.isEditingText()).to.be.ok();
        vector.endEditText();
        expect(vector.isEditingText()).not.to.be.ok();
    });

    it('edit with special characters', function () {
        var vector = new maptalks.TextBox('textbox\r\n', center);
        layer = new maptalks.VectorLayer('id');
        map.addLayer(layer);
        layer.addGeometry(vector);
        vector.startEditText();
        expect(vector.isEditingText()).to.be.ok();
        vector.endEditText();
        expect(vector.isEditingText()).not.to.be.ok();
        expect(vector.getContent()).to.be.eql('textbox');
    });
});
