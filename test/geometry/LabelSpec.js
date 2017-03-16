
describe('#Label', function () {

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
        map.remove();
        REMOVE_CONTAINER(container);
    });

    describe('label fires events', function () {
        it('canvas events', function () {
            var vector = new maptalks.Label('test label', center);
            new COMMON_GEOEVENTS_TESTOR().testCanvasEvents(vector, map, vector.getCenter());
        });
    });

    describe('change position', function () {
        it('events', function () {
            var spy = sinon.spy();

            var vector = new maptalks.Label('test label', center);
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
            var label = '中文标签';
            var vector = new maptalks.Label(label, center);
            layer = new maptalks.VectorLayer('id');
            map.addLayer(layer);
            layer.addGeometry(vector);
            expect(vector.getContent()).to.be.eql(label);
            label = '中文标签-2';
            vector.setContent(label);
            expect(vector.getContent()).to.be.eql(label);
        });
    });

    describe('can get/set textAlign', function () {
        it('get/set textAlign', function () {
            var label = '中文标签';
            var vector = new maptalks.Label(label, center);
            vector.config('boxAutoSize', false);
            //default textalign
            expect(vector.options['boxTextAlign']).to.be.eql('middle');
            vector.config('boxTextAlign', 'right');
            expect(vector.options['boxTextAlign']).to.be.eql('right');
            layer = new maptalks.VectorLayer('id');
            map.addLayer(layer);
            layer.addGeometry(vector);
            expect(vector.options['boxTextAlign']).to.be.eql('right');
            vector.config('boxTextAlign', 'left');
            expect(vector.options['boxTextAlign']).to.be.eql('left');
        });
    });

    describe('can get/set symbol', function () {
        it('get/set symbol', function () {
            var label = '中文标签';
            var vector = new maptalks.Label(label, center);
            vector.setSymbol(null);
            //null symbol is allowed, means set to default symbol.
            expect(vector.getSymbol()).not.to.be.ok();
            layer = new maptalks.VectorLayer('id');
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
                'textWrapWidth': null, //auto
                'textWrapBefore': false,
                'textWrapCharacter': '\n',
                'textLineSpacing': 8,
                'textHorizontalAlignment': 'middle', //left middle right
                'textVerticalAlignment': 'top'//top middle bottom
            };
            vector.setSymbol(labelSymbol);
            //symbol's textName will be set.
            expect(vector.getSymbol()['textName']).not.to.be.empty();
        });
    });

    describe('alignment', function () {
        it('left', function () {
            var vector = new maptalks.Label('■■■', center, {
                box : false,
                symbol : {
                    'markerFillOpacity' : 0,
                    'markerLineOpacity' : 0,
                    'textHorizontalAlignment' : 'left'
                }
            });
            layer = new maptalks.VectorLayer('id', { 'drawImmediate' : true });
            map.addLayer(layer);
            layer.addGeometry(vector);
            var size = vector.getSize();
            expect(layer).to.be.painted(-3, 0);
            expect(layer).to.be.painted(-Math.floor(size.width / 2), 0);
            expect(layer).not.to.be.painted(3, 0);
        });

        it('right', function () {
            var vector = new maptalks.Label('■■■', center, {
                box : false,
                symbol : {
                    'markerFillOpacity' : 0,
                    'markerLineOpacity' : 0,
                    'textHorizontalAlignment' : 'right'
                }
            });
            layer = new maptalks.VectorLayer('id', { 'drawImmediate' : true });
            map.addLayer(layer);
            layer.addGeometry(vector);
            var size = vector.getSize();
            expect(layer).to.be.painted(3, 0);
            expect(layer).to.be.painted(Math.floor(size.width / 2), 0);
            expect(layer).not.to.be.painted(-3, 0);
        });

        it('top', function () {
            var vector = new maptalks.Label('■■■', center, {
                box : false,
                symbol : {
                    'markerFillOpacity' : 0,
                    'markerLineOpacity' : 0,
                    'textVerticalAlignment' : 'top'
                }
            });
            layer = new maptalks.VectorLayer('id', { 'drawImmediate' : true });
            map.addLayer(layer);
            layer.addGeometry(vector);
            var size = vector.getSize();
            expect(layer).to.be.painted(0, -5);
            expect(layer).to.be.painted(0, -Math.floor(size.height / 2));
            expect(layer).not.to.be.painted(0, 5);
        });

        it('bottom', function () {
            var vector = new maptalks.Label('■■■', center, {
                box : false,
                symbol : {
                    'markerFillOpacity' : 0,
                    'markerLineOpacity' : 0,
                    'textVerticalAlignment' : 'bottom'
                }
            });
            layer = new maptalks.VectorLayer('id', { 'drawImmediate' : true });
            map.addLayer(layer);
            layer.addGeometry(vector);
            var size = vector.getSize();
            expect(layer).to.be.painted(0, 7);
            expect(layer).to.be.painted(0, Math.floor(size.height / 2));
            expect(layer).not.to.be.painted(0, -5);
        });
    });

    describe('can config', function () {
        it('configs', function () {
            var label = new maptalks.Label('label', center);
            var defaultConfig = label.config();
            expect(defaultConfig).to.be.empty();

        });
    });

    it('autoSize', function () {
        var vector = new maptalks.Label('■■■', center, {
            box:true,
            boxAutoSize: true
        });
        var symbol = vector._getInternalSymbol();
        expect(symbol.markerWidth).to.be.above(5);
        expect(symbol.markerHeight).to.be.above(5);
    });

    it('can edit', function () {
        var vector = new maptalks.Label('label', center);
        layer = new maptalks.VectorLayer('id');
        map.addLayer(layer);
        layer.addGeometry(vector);
        vector.startEditText();
        expect(vector.isEditingText()).to.be.ok();
        vector.endEditText();
        expect(vector.isEditingText()).not.to.be.ok();
    });

    it('edit with special characters', function () {
        var vector = new maptalks.Label('\b\t\v\flabel\r\n', center);
        layer = new maptalks.VectorLayer('id');
        map.addLayer(layer);
        layer.addGeometry(vector);
        vector.startEditText();
        expect(vector.isEditingText()).to.be.ok();
        vector.endEditText();
        expect(vector.isEditingText()).not.to.be.ok();
        expect(vector.getContent()).to.be.eql('label\n');
    });

    it('edit with "Enter" characters', function () {
        var vector = new maptalks.Label('Label\r', center);
        layer = new maptalks.VectorLayer('id');
        map.addLayer(layer);
        layer.addGeometry(vector);
        vector.startEditText();
        expect(vector.isEditingText()).to.be.ok();
        vector.endEditText();
        expect(vector.isEditingText()).not.to.be.ok();
        expect(vector.getContent()).to.be.eql('Label\n');
    });

    describe('edit label', function () {
        it('can edit', function () {
            var vector = new maptalks.Label('label', center);
            layer = new maptalks.VectorLayer('id');
            map.addLayer(layer);
            layer.addGeometry(vector);
            vector.startEditText();
            expect(vector.isEditingText()).to.be.ok();
            vector.endEditText();
            expect(vector.isEditingText()).not.to.be.ok();
        });

        it('horizontal left', function () {
            var vector = new maptalks.Label('■■■', center, {
                box : false,
                symbol : {
                    'markerDx' : 0,
                    'markerDy' : 0,
                    'textDx' : 0,
                    'textDy' : 0,
                    'textHorizontalAlignment' : 'left'
                }
            });
            layer = new maptalks.VectorLayer('id');
            map.addLayer(layer);
            layer.addGeometry(vector);
            vector.startEditText();
            expect(vector.isEditingText()).to.be.ok();
            var editor = vector.getTextEditor();
            expect(editor.options['dx']).to.be(-2);
            expect(editor.options['dy']).to.be(-2);
            vector.endEditText();
            expect(vector.isEditingText()).not.to.be.ok();
        });

        it('horizontal right', function () {
            var vector = new maptalks.Label('■■■', center, {
                box : false,
                symbol : {
                    'markerDx' : 0,
                    'markerDy' : 0,
                    'textDx' : 0,
                    'textDy' : 0,
                    'textHorizontalAlignment' : 'right'
                }
            });
            layer = new maptalks.VectorLayer('id');
            map.addLayer(layer);
            layer.addGeometry(vector);
            vector.startEditText();
            expect(vector.isEditingText()).to.be.ok();
            var editor = vector.getTextEditor();
            expect(editor.options['dx']).to.be(-2);
            expect(editor.options['dy']).to.be(-2);
            vector.endEditText();
            expect(vector.isEditingText()).not.to.be.ok();
        });

        it('horizontal middle', function () {
            var vector = new maptalks.Label('■■■', center, {
                box : false,
                symbol : {
                    'markerDx' : 0,
                    'markerDy' : 0,
                    'textDx' : 0,
                    'textDy' : 0,
                    'textHorizontalAlignment' : 'middle'
                }
            });
            layer = new maptalks.VectorLayer('id');
            map.addLayer(layer);
            layer.addGeometry(vector);
            vector.startEditText();
            expect(vector.isEditingText()).to.be.ok();
            var editor = vector.getTextEditor();
            expect(editor.options['dx']).to.be(-2);
            expect(editor.options['dy']).to.be(-2);
            vector.endEditText();
            expect(vector.isEditingText()).not.to.be.ok();
        });

        it('filter with special characters', function () {
            var vector = new maptalks.Label('\b\t\v\fLabel', center);
            layer = new maptalks.VectorLayer('id');
            map.addLayer(layer);
            layer.addGeometry(vector);
            vector.startEditText();
            expect(vector.isEditingText()).to.be.ok();
            vector.endEditText();
            expect(vector.isEditingText()).not.to.be.ok();
            expect(vector.getContent()).to.be.eql('Label');
        });

        it('filter with "Enter" characters', function () {
            var vector = new maptalks.Label('Label\r', center);
            layer = new maptalks.VectorLayer('id');
            map.addLayer(layer);
            layer.addGeometry(vector);
            vector.startEditText();
            expect(vector.isEditingText()).to.be.ok();
            vector.endEditText();
            expect(vector.isEditingText()).not.to.be.ok();
            expect(vector.getContent()).to.be.eql('Label\n');
        });

        it('mock input characters', function () {
            var label = new maptalks.Label('I am a Text', center);
            layer = new maptalks.VectorLayer('id');
            map.addLayer(layer);
            layer.addGeometry(label);
            label.on('edittextstart', startEdit);
            label.on('edittextend', endEdit);
            label.startEditText();

            function startEdit() {
                expect(label.isEditingText()).to.be.ok();
                var dom = label.getTextEditor().getDOM();
                maptalks.DomUtil.on(dom, 'keyup', function (ev) {
                    var oEvent = ev || event;
                    var char = String.fromCharCode(oEvent.keyCode);
                    if (oEvent.shiftKey) {
                        if (char === '1') {
                            char = '!';
                        }
                    }
                    dom.innerText += char;
                    label.endEditText();
                });
                happen.keyup(dom, {
                    shiftKey: true,
                    keyCode: 49
                });
                expect(label.isEditingText()).to.not.be.ok();
            }
            function endEdit() {
                expect(label.getContent()).to.eql('I am a Text!');
            }
        });

        it('mock press “Enter” key', function () {
            var label = new maptalks.Label('I am a Text', center);
            layer = new maptalks.VectorLayer('id');
            map.addLayer(layer);
            layer.addGeometry(label);
            label.on('edittextstart', startEdit);
            label.on('edittextend', endEdit);
            label.startEditText();
            function startEdit() {
                var dom = label.getTextEditor().getDOM();
                maptalks.DomUtil.on(dom, 'keyup', function (ev) {
                    var oEvent = ev || event;
                    if (oEvent.keyCode === 13) {
                        dom.innerText += '\n';
                    }
                    var char = String.fromCharCode(oEvent.keyCode);
                    if (oEvent.shiftKey) {
                        if (char === '1') {
                            char = '!';
                            dom.innerText += char;
                            label.endEditText();
                        }
                    }
                });
                happen.keyup(dom, {
                    keyCode: 13
                });
                happen.keyup(dom, {
                    shiftKey: true,
                    keyCode: 49
                });
            }
            function endEdit() {
                var symbol = label._getInternalSymbol(),
                    font = maptalks.StringUtil.getFont(symbol),
                    spacing = symbol['textLineSpacing'] || 0;
                var h = maptalks.StringUtil.stringLength('test', font).height;
                var expected = h * 2 + spacing;
                expect(label.getSize()['height'] >= expected).to.be.ok();
            }
        });
    });
});
