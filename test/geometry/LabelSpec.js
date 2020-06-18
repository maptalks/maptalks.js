describe('Geometry.Label', function () {

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



    describe('events', function () {
        it('canvas events', function () {
            var vector = new maptalks.Label('test label', center);
            new COMMON_GEOEVENTS_TESTOR().testCanvasEvents(vector, map, vector.getCenter());
        });

        it('change position', function () {
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

    describe('get/set', function () {
        it('content', function () {
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

        it('textAlign', function () {
            var label = '中文标签';
            var vector = new maptalks.Label(label, center);
            var boxStyle = {
                'padding' : [12, 8],
                'verticalAlignment' : 'middle',
                'horizontalAlignment' : 'middle',
                'minWidth' : 0,
                'minHeight' : 0
            };
            vector.setBoxStyle(boxStyle);
            //default textalign
            expect(vector.getBoxStyle().verticalAlignment).to.be.eql('middle');
            expect(vector.getBoxStyle().horizontalAlignment).to.be.eql('middle');
            boxStyle.horizontalAlignment = 'right';
            expect(vector.getBoxStyle().horizontalAlignment).to.be.eql('middle');
            vector.setBoxStyle(boxStyle);
            expect(vector.getBoxStyle().horizontalAlignment).to.be.eql('right');
            layer = new maptalks.VectorLayer('id');
            map.addLayer(layer);
            layer.addGeometry(vector);
            expect(vector.getBoxStyle().horizontalAlignment).to.be.eql('right');
        });

        it('textSymbol', function () {
            var label = '中文标签';
            var vector = new maptalks.Label(label, center);
            //null symbol is allowed, means set to default symbol.
            expect(vector.getSymbol()).to.be.ok();
            layer = new maptalks.VectorLayer('id');
            map.addLayer(layer);
            layer.addGeometry(vector);
            var labelSymbol = {
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
            vector.setTextSymbol(labelSymbol);
            //symbol's textName will be set.
            expect(vector.getSymbol()['textName']).not.to.be.empty();
        });

        it('textSymbol and boxStyle by setSymbol', function () {
            var label = '中文标签';
            var vector = new maptalks.Label(label, center);
            //null symbol is allowed, means set to default symbol.
            expect(vector.getSymbol()).to.be.ok();
            layer = new maptalks.VectorLayer('id');
            map.addLayer(layer);
            layer.addGeometry(vector);
            var labelSymbol = {
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
            var boxStyle = {
                'markerType': 'square',
                'markerLineColor': '#00f',
                'markerLineWidth': 3,
                'markerLineOpacity': 2,
                'markerFill': '#f00',
                'markerOpacity': 0.5
            };
            vector.setSymbol(maptalks.Util.extend({}, labelSymbol, boxStyle));
            expect(vector.getTextSymbol()).to.be.eql(labelSymbol);
            expect(vector.getBoxStyle().symbol).to.be.eql(boxStyle);

            var json = vector.toJSON();
            expect(json.options.textSymbol).to.be.eql(labelSymbol);
            expect(json.options.boxStyle.symbol).to.be.eql(boxStyle);
        });
    });


    describe('alignment', function () {
        it('left', function () {
            var vector = new maptalks.Label('■■■', center, {
                textSymbol : {
                    'textFaceName': 'arial',
                    'textSize': 12,
                    'textHorizontalAlignment': 'left', //left middle right
                    'textVerticalAlignment': 'middle'//top middle bottom
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
                textSymbol : {
                    'textFaceName': 'arial',
                    'textSize': 12,
                    'textHorizontalAlignment': 'right', //left middle right
                    'textVerticalAlignment': 'middle'//top middle bottom
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
            if (maptalks.Browser.ie) {
                return;
            }
            var vector = new maptalks.Label('■■■', center, {
                textSymbol : {
                    'textFaceName': 'arial',
                    'textSize': 12,
                    'textHorizontalAlignment': 'middle', //left middle right
                    'textVerticalAlignment': 'top'//top middle bottom
                }
            });
            layer = new maptalks.VectorLayer('id', { 'drawImmediate' : true });
            map.addLayer(layer);
            layer.addGeometry(vector);
            var size = vector.getSize();
            expect(layer).to.be.painted(0, -7);
            expect(layer).to.be.painted(0, -Math.floor(size.height / 2));
            expect(layer).not.to.be.painted(0, 5);
        });

        it('bottom', function () {
            var vector = new maptalks.Label('■■■', center, {
                textSymbol : {
                    'textFaceName': 'arial',
                    'textSize': 12,
                    'textHorizontalAlignment': 'middle', //left middle right
                    'textVerticalAlignment': 'bottom'//top middle bottom
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

    it('should draw text halo', function () {
        var vector = new maptalks.Label('■■■', center, {
            textSymbol : {
                'textOpacity': 0,
                'textSize': 12,
                'textHaloRadius' : 10,
                'textHaloFill' : '#000'
            }
        });
        layer = new maptalks.VectorLayer('id', { 'drawImmediate' : true });
        map.addLayer(layer);
        layer.addGeometry(vector);
        var size = vector.getSize();
        expect(layer).to.be.painted(0, 10);
        expect(layer).not.to.be.painted(0, 0);
    });

    it('autoSize', function () {
        var vector = new maptalks.Label('■■■', center, {
            boxStyle : {
                'padding' : [12, 8],
                'verticalAlignment' : 'middle',
                'horizontalAlignment' : 'middle',
                'minWidth' : 0,
                'minHeight' : 0
            }
        });
        var symbol = vector._getInternalSymbol();
        expect(symbol.textWrapCharacter).to.be.eql('\n');
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
        var vector = new maptalks.Label('\b\t\v\flabe\r\nl', center);
        layer = new maptalks.VectorLayer('id');
        map.addLayer(layer);
        layer.addGeometry(vector);
        vector.startEditText();
        expect(vector.isEditingText()).to.be.ok();
        vector.endEditText();
        expect(vector.isEditingText()).not.to.be.ok();
        expect(vector.getContent()).to.be.eql('labe\nl');
    });

    it('edit with "Enter" characters', function () {
        var vector = new maptalks.Label('Labe\r\nl\r', center);
        layer = new maptalks.VectorLayer('id');
        map.addLayer(layer);
        layer.addGeometry(vector);
        vector.startEditText();
        expect(vector.isEditingText()).to.be.ok();
        vector.endEditText();
        expect(vector.isEditingText()).not.to.be.ok();
        expect(vector.getContent()).to.be.eql('Labe\nl');
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
                symbol : {
                    'markerDx' : 0,
                    'markerDy' : 0,
                    'textDx' : 0,
                    'textDy' : 0,
                    'textHorizontalAlignment' : 'left',
                    'textVerticalAlignment' : 'top'
                }
            });
            layer = new maptalks.VectorLayer('id');
            map.addLayer(layer);
            layer.addGeometry(vector);
            vector.startEditText();
            expect(vector.isEditingText()).to.be.ok();
            var editor = vector.getTextEditor();
            expect(Math.round(editor.options['dx'])).to.below(-10);
            expect(editor.options['dy'] <= 9).to.be.ok();
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
            expect(Math.round(editor.options['dx'])).to.above(5);
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
            expect(vector.getContent()).to.be.eql('Label');
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

    });
});
