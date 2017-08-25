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
        map.remove();
        REMOVE_CONTAINER(container);
    });

    describe('events', function () {
        it('canvas events', function () {
            var vector = new maptalks.TextBox('test label', center, 100, 40);
            new COMMON_GEOEVENTS_TESTOR().testCanvasEvents(vector, map, vector.getCenter());
        });

        it('change position', function () {
            var spy = sinon.spy();

            var vector = new maptalks.TextBox('test label', center, 100, 40);
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
            var content = '中文标签';
            var vector = new maptalks.TextBox(content, center, 100, 40);
            layer = new maptalks.VectorLayer('id');
            map.addLayer(layer);
            layer.addGeometry(vector);
            expect(vector.getContent()).to.be.eql(content);
            content = '中文标签-2';
            vector.setContent(content);
            expect(vector.getContent()).to.be.eql(content);
        });

        it('textAlign', function () {
            var content = '中文标签';
            var vector = new maptalks.TextBox(content, center, 100, 40);
            var textStyle = {
                'wrap' : true,
                'padding' : [12, 8],
                'verticalAlignment' : 'middle',
                'horizontalAlignment' : 'middle'
            };
            vector.setTextStyle(textStyle);
            //default textalign
            expect(vector.getTextStyle().verticalAlignment).to.be.eql('middle');
            expect(vector.getTextStyle().horizontalAlignment).to.be.eql('middle');
            textStyle.horizontalAlignment = 'right';
            expect(vector.getTextStyle().horizontalAlignment).to.be.eql('middle');
            vector.setTextStyle(textStyle);
            expect(vector.getTextStyle().horizontalAlignment).to.be.eql('right');
            layer = new maptalks.VectorLayer('id');
            map.addLayer(layer);
            layer.addGeometry(vector);
            expect(vector.getTextStyle().horizontalAlignment).to.be.eql('right');
        });

        it('boxSymbol', function () {
            var content = '中文标签';
            var vector = new maptalks.TextBox(content, center, 100, 40);
            //null symbol is allowed, means set to default symbol.
            expect(vector.getSymbol()).to.be.ok();
            layer = new maptalks.VectorLayer('id');
            map.addLayer(layer);
            layer.addGeometry(vector);
            var boxSymbol = {
                'markerType': 'square',
                'markerLineColor': '#000',
                'markerLineWidth': 2,
                'markerLineOpacity': 1,
                'markerFill': '#fff',
                'markerOpacity': 1
            };
            vector.setBoxSymbol(boxSymbol);
            //symbol's textName will be set.
            expect(vector.getSymbol().markerWidth).to.be.ok();
            expect(vector.getSymbol().markerHeight).to.be.ok();
        });
    });

    describe('can config', function () {
        it('configs', function () {
            var vector = new maptalks.TextBox('textbox', center, 100, 40);
            var defaultConfig = vector.config();
            expect(defaultConfig).to.be.empty();

        });
    });

    describe('alignment', function () {
        var padding = [12, 8];
        it('left', function () {
            var vector = new maptalks.TextBox('■■■', center, 100, 100, {
                textStyle : {
                    'wrap' : true,
                    'padding' : padding,
                    'verticalAlignment' : 'middle',
                    'horizontalAlignment' : 'left'
                },
                boxSymbol : {
                    'markerType' : 'square',
                    'markerFillOpacity' : 0,
                    'markerLineOpacity' : 0
                }
            });
            layer = new maptalks.VectorLayer('id', { 'drawImmediate' : true });
            map.addLayer(layer);
            layer.addGeometry(vector);
            expect(layer).to.be.painted(-100 / 2 + padding[0] + 1, 0);
            expect(layer).not.to.be.painted(-100 / 2 + padding[0] - 1, 0);
            expect(layer).not.to.be.painted(0, 0);
        });

        it('right', function () {
            var vector = new maptalks.TextBox('■■■', center, 100, 100, {
                textStyle : {
                    'wrap' : true,
                    'padding' : padding,
                    'verticalAlignment' : 'middle',
                    'horizontalAlignment' : 'right'
                },
                boxSymbol : {
                    'markerType' : 'square',
                    'markerFillOpacity' : 0,
                    'markerLineOpacity' : 0
                }
            });
            layer = new maptalks.VectorLayer('id', { 'drawImmediate' : true });
            map.addLayer(layer);
            layer.addGeometry(vector);
            expect(layer).to.be.painted(100 / 2 - padding[0] - 2, 0);
            expect(layer).not.to.be.painted(100 / 2 - padding[0], 0);
            expect(layer).not.to.be.painted(0, 0);
        });

        it('top', function () {
            var vector = new maptalks.TextBox('■■■', center, 100, 100, {
                textStyle : {
                    'wrap' : true,
                    'padding' : padding,
                    'verticalAlignment' : 'top',
                    'horizontalAlignment' : 'middle'
                },
                boxSymbol : {
                    'markerType' : 'square',
                    'markerFillOpacity' : 0,
                    'markerLineOpacity' : 0
                }
            });
            layer = new maptalks.VectorLayer('id', { 'drawImmediate' : true });
            map.addLayer(layer);
            layer.addGeometry(vector);
            expect(layer).to.be.painted(0, -100 / 2 + padding[1] + 7);
            expect(layer).not.be.painted();
        });

        it('bottom', function () {
            var vector = new maptalks.TextBox('■■■', center, 100, 100, {
                textStyle : {
                    'wrap' : true,
                    'padding' : padding,
                    'verticalAlignment' : 'bottom',
                    'horizontalAlignment' : 'middle'
                },
                boxSymbol : {
                    'markerType' : 'square',
                    'markerFillOpacity' : 0,
                    'markerLineOpacity' : 0
                }
            });
            layer = new maptalks.VectorLayer('id', { 'drawImmediate' : true });
            map.addLayer(layer);
            layer.addGeometry(vector);
            expect(layer).to.be.painted(0, 100 / 2 - padding[1] - 7);
            expect(layer).not.be.painted();
        });
    });

    it('width, height', function () {
        var vector = new maptalks.TextBox('■■■', center, 100, 50);
        var symbol = vector.getSymbol();
        expect(symbol.markerWidth).to.be.eql(100);
        expect(symbol.markerHeight).to.be.eql(50);
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
        var vector = new maptalks.TextBox('\b\t\v\ftextbox', center, 100, 50);
        layer = new maptalks.VectorLayer('id');
        map.addLayer(layer);
        layer.addGeometry(vector);
        vector.on('edittextstart', function () {
            expect(vector.isEditingText()).to.be.ok();
        });
        vector.on('edittextend', function () {
            expect(vector.isEditingText()).not.to.be.ok();
        });
        vector.startEditText();
        vector.endEditText();
        expect(vector.getContent()).to.be.eql('textbox');
    });

    it('edit with "Enter" characters', function () {
        var vector = new maptalks.TextBox('textbox\r', center, 100, 50);
        layer = new maptalks.VectorLayer('id');
        map.addLayer(layer);
        layer.addGeometry(vector);
        vector.startEditText();
        expect(vector.isEditingText()).to.be.ok();
        vector.endEditText();
        expect(vector.isEditingText()).not.to.be.ok();
        expect(vector.getContent()).to.be.eql('textbox');
    });

    it('clear unused text caches', function (done) {
        var cachekey = maptalks.symbolizer.TextMarkerSymbolizer.CACHE_KEY;

        var vector = new maptalks.TextBox('test label', center, 100, 40);

        layer = new maptalks.VectorLayer('id', vector);
        layer.once('layerload', function () {
            expect(Object.keys(vector[cachekey]).length).to.be.eql(1);
            layer.once('layerload', function () {
                expect(Object.keys(vector[cachekey]).length).to.be.eql(1);
                done();
            });
            vector.setContent('1');
            expect(Object.keys(vector[cachekey]).length).to.be.eql(2);
        });
        map.addLayer(layer);

    });
});
