describe('Geometry.TextBox', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var layer;

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center, null, {
            width : 800,
            height : 600
        });
        container = setups.container;
        map = setups.map;
        map.config('centerCross', true);
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

        it('textStyle and boxSymbol by setSymbol', function () {
            var content = '中文标签';
            var vector = new maptalks.TextBox(content, center, 100, 40);
            //null symbol is allowed, means set to default symbol.
            expect(vector.getSymbol()).to.be.ok();
            layer = new maptalks.VectorLayer('id');
            map.addLayer(layer);
            layer.addGeometry(vector);
            var textStyle = {
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
            var boxSymbol = {
                'markerType': 'square',
                'markerLineColor': '#00f',
                'markerLineWidth': 3,
                'markerLineOpacity': 2,
                'markerFill': '#f00',
                'markerOpacity': 0.5
            };
            vector.setSymbol(maptalks.Util.extend({}, textStyle, boxSymbol));
            expect(vector.getTextStyle().symbol).to.be.eql(textStyle);
            expect(vector.getBoxSymbol()).to.be.eql(boxSymbol);

            var json = vector.toJSON();
            expect(json.options.textStyle.symbol).to.be.eql(textStyle);
            expect(json.options.boxSymbol).to.be.eql(boxSymbol);
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
            expect(layer).not.to.be.painted(100 / 2 - padding[0] + 1, 0);
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
            expect(layer).to.be.painted(0, 100 / 2 - padding[1] - 9);
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
            expect(Object.keys(vector[cachekey]).length).to.be.eql(1);
        });
        map.addLayer(layer);

    });

    it('JSON of previous version\'s TextBox', function () {
        var json = {"content":"岭南站/SM/A","feature":{"geometry":{"coordinates":[113.120816,23.033914],"type":"Point"},"id":"NWP_LABEL_3","type":"Feature"},"options":{"boxAutoSize":true,"boxMinHeight":30,"boxMinWidth":100,"boxPadding":{"height":8,"width":15},"draggable":true,"visible":true,"zIndex":1},"subType":"TextBox","symbol":{"markerFill":"#ffffff","markerFillOpacity":1,"markerHeight":40,"markerLineColor":"#cccccc","markerLineOpacity":0.8,"markerLineWidth":1,"markerOpacity":0.8,"markerType":"square","markerWidth":140,"opacity":1,"textDx":0,"textDy":0,"textFaceName":"microsoft yahei","textFill":"#000000","textHorizontalAlignment":"middle","textLineSpacing":1,"textName":"岭南站/SM/A","textOpacity":0.8,"textSize":18,"textSpacing":0,"textVerticalAlignment":"middle","textWrapBefore":false,"textWrapCharacter":"\n"}};
        var textBox = maptalks.Geometry.fromJSON(json);
        expect(textBox instanceof maptalks.TextBox).to.be.ok();
        expect(maptalks.Util.extend({}, textBox.getTextStyle().symbol, textBox.getBoxSymbol())).to.be.eql(json.symbol);
    });
});
