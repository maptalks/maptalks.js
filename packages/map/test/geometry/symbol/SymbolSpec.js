// var CommonSpec = require('./CommonSpec');

describe('SymbolSpec', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center);
        container = setups.container;
        map = setups.map;
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('default', function () {
        var geometries = GEN_GEOMETRIES_OF_ALL_TYPES();
        var i;
        for (i = 0; i < geometries.length; i++) {
            if (geometries[i] instanceof maptalks.TextMarker) {
                expect(geometries[i].getSymbol()).to.be.ok();
            } else {
                expect(geometries[i].getSymbol()).not.to.be.ok();
            }
        }
        for (i = 0; i < geometries.length; i++) {
            if (!(geometries[i] instanceof maptalks.GeometryCollection)) {
                expect(geometries[i]._getInternalSymbol()).to.be.ok();
            } else {
                expect(geometries[i]._getInternalSymbol()).not.to.be.ok();
            }
        }
    });

    it('updateSymbol', function () {
        var expected = {
            'markerType' : 'ellipse',
            'markerWidth':20,
            'markerHeight':30
        };
        var marker = new maptalks.Marker(center);
        marker.setSymbol({
            'markerType' : 'cross',
            'markerWidth':20,
            'markerHeight':30
        }).updateSymbol({
            'markerType' : 'ellipse',
        });
        expect(marker.getSymbol()).to.be.eql(expected);
    });

    it('updateSymbol directly', function () {

        var marker = new maptalks.Marker(center);
        var expected = maptalks.Util.extend({}, marker._getInternalSymbol());
        expected.markerType = 'ellipse';
        marker.updateSymbol({
            'markerType' : 'ellipse',
        });
        expect(marker.getSymbol()).to.be.eql(expected);
    });

    it('updateSymbol with array 1', function () {
        var expected = [
            {
                'markerType': 'ellipse',
                'markerWidth': 40,
                'markerHeight': 30
            },
            {
                'markerType': 'square',
                'markerWidth': 50,
                'markerHeight': 40
            },
        ];
        var marker = new maptalks.Marker(center);
        marker.setSymbol([
            {
                'markerType': 'ellipse',
                'markerWidth':20,
                'markerHeight':30
            },
            {
                'markerType' : 'square',
                'markerWidth':50,
                'markerHeight':40
            },
        ]).updateSymbol([
            {
                'markerWidth' : 40,
            },
            {
                'markerWidth' : 50,
            }
        ]);
        expect(marker.getSymbol()).to.be.eql(expected);
    });

    it('updateSymbol with array 1.5', function () {
        var expected = [
            {
                'markerType': 'ellipse',
                'markerWidth': 40,
                'markerHeight': 30
            },
            {
                'markerType': 'square',
                'markerWidth': 50,
                'markerHeight': 40
            },
        ];
        var marker = new maptalks.Marker(center);
        marker.setSymbol([
            {
                'markerType': 'ellipse',
                'markerWidth':20,
                'markerHeight':30
            },
            {
                'markerType' : 'square',
                'markerWidth':50,
                'markerHeight':40
            },
        ]).updateSymbol([
            {
                'markerWidth' : 40,
            },
            {
                'markerWidth' : 50,
            },
            {
                'markerWidth' : 60,
            }
        ]);
        expect(marker.getSymbol()).to.be.eql(expected);
    });

    it('updateSymbol with array 2', function () {
        var expected = [
            {
                'markerType': 'ellipse',
                'markerWidth': 40,
                'markerHeight': 30
            },
            {
                'markerType': 'square',
                'markerWidth': 20,
                'markerHeight': 40
            },
        ];
        var marker = new maptalks.Marker(center);
        marker.setSymbol([
            {
                'markerType': 'ellipse',
                'markerWidth': 20,
                'markerHeight': 30
            },
            {
                'markerType': 'square',
                'markerWidth': 20,
                'markerHeight': 40
            },
        ]).updateSymbol([
            {
                'markerWidth': 40,
            }
        ]);
        expect(marker.getSymbol()).to.be.eql(expected);
    });

    it('updateSymbol with array 3', function () {
        var marker = new maptalks.Marker(center);
        marker.setSymbol([
            {
                'markerType': 'ellipse',
                'markerWidth':20,
                'markerHeight':30
            },
            {
                'markerType' : 'square',
                'markerWidth':20,
                'markerHeight':40
            },
        ]);
        expect(function () {
            marker.updateSymbol({ 'markerWidth' : 40 })
        }).to.throwException();
    });

    it('updateSymbol with array 4', function () {
        var marker = new maptalks.Marker(center);
        marker.setSymbol({
                'markerType' : 'ellipse',
                'markerWidth':20,
                'markerHeight':30
            });
        expect(function () {
            marker.updateSymbol([{ 'markerWidth' : 40 }])
        }).to.throwException();
    });

    it('marker file', function () {
        var marker = new maptalks.Marker([100, 0], {
            symbol:{
                'markerFile' : 'resources/x.svg',
                'markerWidth':20,
                'markerHeight':30
            }
        });
        var res = marker._getExternalResources();
        expect(res).to.have.length(1);
        expect(res[0][0]).to.be.eql('resources/x.svg');
        expect(res[0][1]).to.be.eql(20);
        expect(res[0][2]).to.be.eql(30);
    });

    it('marker path', function () {
        var expected = 'data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSIgPjxkZWZzPjwvZGVmcz4gPHBhdGggIGZpbGw9IiNERTMzMzMiIHN0cm9rZS1saW5lY2FwPSJidXR0IiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNOCAyM2wwIDAgMCAwIDAgMCAwIDAgMCAwYy00LC01IC04LC0xMCAtOCwtMTQgMCwtNSA0LC05IDgsLTlsMCAwIDAgMGM0LDAgOCw0IDgsOSAwLDQgLTQsOSAtOCwxNHogTTUsOSBhMywzIDAsMSwwLDAsLTAuOVoiPjwvcGF0aD4gPC9zdmc+';
        var marker = new maptalks.Marker([100, 0], {
            symbol:{
                'markerType'    : 'path',
                'markerPath'    : [
                    {
                        'path' : 'M8 23l0 0 0 0 0 0 0 0 0 0c-4,-5 -8,-10 -8,-14 0,-5 4,-9 8,-9l0 0 0 0c4,0 8,4 8,9 0,4 -4,9 -8,14z M5,9 a3,3 0,1,0,0,-0.9Z',
                        'fill' : '#DE3333'
                    }
                ],
                'markerWidth':20,
                'markerHeight':30
            }
        });
        var res = marker._getExternalResources();
        expect(res).to.have.length(1);
        expect(res[0][0]).to.be.eql(expected);
        expect(res[0][1]).to.be.eql(20);
        expect(res[0][2]).to.be.eql(30);
    });

    describe('symbol number properties in type of string', function () {
        it('vector path marker symbolizer', function () {
            var symbol = {
                'markerType'    : 'path',
                'markerPath'    : [
                    {
                        'path' : 'M8 23l0 0 0 0 0 0 0 0 0 0c-4,-5 -8,-10 -8,-14 0,-5 4,-9 8,-9l0 0 0 0c4,0 8,4 8,9 0,4 -4,9 -8,14z M5,9 a3,3 0,1,0,0,-0.9Z',
                        'fill' : '#DE3333'
                    }
                ],
                'markerWidth': '20',
                'markerHeight': '30',
                'markerOpacity' : '0.5'
            };
            var symbolizer = new maptalks.symbolizer.VectorPathMarkerSymbolizer(symbol);
            expect(symbolizer.style.markerWidth).to.be.eql(20);
            expect(symbolizer.style.markerHeight).to.be.eql(30);
            expect(symbolizer.style.markerOpacity).to.be.eql(0.5);
        });

        it('vector marker symbolizer', function () {
            var symbol = {
                'markerType' : 'ellipse',
                'markerWidth': '20',
                'markerHeight': '30',
                'markerFillOpacity' : '0.5',
                'markerLineWidth'       : '2',
                'markerLineOpacity'     : '0.6',
                'markerDx'              : '1',
                'markerDy'              : '2'
            };
            var symbolizer = new maptalks.symbolizer.VectorMarkerSymbolizer(symbol);
            expect(symbolizer.style.markerWidth).to.be.eql(20);
            expect(symbolizer.style.markerHeight).to.be.eql(30);
            expect(symbolizer.style.markerFillOpacity).to.be.eql(0.5);
            expect(symbolizer.style.markerLineWidth).to.be.eql(2);
            expect(symbolizer.style.markerLineOpacity).to.be.eql(0.6);
            expect(symbolizer.style.markerDx).to.be.eql(1);
            expect(symbolizer.style.markerDy).to.be.eql(2);
        });

        it('image marker symbolizer', function () {
            var symbol = {
                'markerFile' : 'foo.png',
                'markerWidth': '20',
                'markerHeight': '30',
                'markerOpacity' : '0.5',
                'markerDx': '1',
                'markerDy': '2',
            };
            var symbolizer = new maptalks.symbolizer.ImageMarkerSymbolizer(symbol);
            expect(symbolizer.style.markerWidth).to.be.eql(20);
            expect(symbolizer.style.markerHeight).to.be.eql(30);
            expect(symbolizer.style.markerOpacity).to.be.eql(0.5);
            expect(symbolizer.style.markerDx).to.be.eql(1);
            expect(symbolizer.style.markerDy).to.be.eql(2);
        });

        it('text marker symbolizer', function () {
            var symbol = {
                'textName' : 'foo',
                'textSize': '20',
                'textOpacity' : '0.5',
                'textHaloRadius' : '4',
                'textWrapWidth' : '3',
                'textLineSpacing' : '2',
                'textDx' : '1',
                'textDy' : '2',
            };
            var marker = new maptalks.Marker([0, 0], { symbol : symbol });
            var symbolizer = new maptalks.symbolizer.TextMarkerSymbolizer(symbol, marker);
            expect(symbolizer.style.textSize).to.be.eql(20);
            expect(symbolizer.style.textOpacity).to.be.eql(0.5);
            expect(symbolizer.style.textHaloRadius).to.be.eql(4);
            expect(symbolizer.style.textWrapWidth).to.be.eql(3);
            expect(symbolizer.style.textLineSpacing).to.be.eql(2);
            expect(symbolizer.style.textDx).to.be.eql(1);
            expect(symbolizer.style.textDy).to.be.eql(2);
        });
    });

    it('line pattern file', function () {
        var line = new maptalks.Polygon([[100, 0], [101, 1], [105, 10], [100, 0]], {
            symbol:{
                'linePatternFile' : 'resources/x.svg'
            }
        });
        var res = line._getExternalResources();
        expect(res).to.have.length(1);
        expect(res[0][0]).to.be.eql('resources/x.svg');
    });

    it('polygon pattern file', function () {
        var polygon = new maptalks.Polygon([[100, 0], [101, 1], [105, 10], [100, 0]], {
            symbol:{
                'polygonPatternFile' : 'resources/x.svg'
            }
        });
        var res = polygon._getExternalResources();
        expect(res).to.have.length(1);
        expect(res[0][0]).to.be.eql('resources/x.svg');
    });

    it('with a non-exist svg icon', function (done) {
        var marker = new maptalks.Marker([100, 0], {
            symbol:{
                'markerFile' : 'resources/not-existed.svg',
                'markerWidth':20,
                'markerHeight':30
            }
        });
        var vectorLayer = new maptalks.VectorLayer('v').addGeometry(marker);
        vectorLayer.once('layerload', function () {
            done();
        });
        map.addLayer(vectorLayer);
    });

    it('should be reloaded after zoomend', function (done) {
        var marker = new maptalks.Marker([100, 0], {
            symbol:{
                'markerFile' : 'resources/x.svg',
                'markerWidth':20,
                'markerHeight':30
            }
        });
        /*map.on('zoomstart', function() {
            marker.setSymbol(
                {
                    "markerFile" : "resources/x.svg",
                    "markerWidth":40,
                    "markerHeight":50
                }
            )
        });*/
        var vectorLayer = new maptalks.VectorLayer('v').addGeometry(marker);
        map.on('zoomend', function () {
            var res = marker._getExternalResources();
            expect(res).to.have.length(1);
            expect(vectorLayer._getRenderer().resources.isResourceLoaded(res[0])).to.be.ok();
            done();
        });
        vectorLayer.once('layerload', function () {
            map.zoomIn();
        });
        map.addLayer(vectorLayer);
    });

    it('collection can _setExternSymbol', function () {
        var symbol = {
            'markerType' : 'ellipse',
            'markerWidth' : 10,
            'markerHeight' : 10
        };
        var markers = new maptalks.MultiPoint([[0, 0], [0, 1]]);
        markers._setExternSymbol(symbol);
        var children = markers.getGeometries();
        for (var i = 0; i < children.length; i++) {
            expect(children[i]._getInternalSymbol()).to.be.eql(symbol);
        }
    });

    it('function type markerFile', function () {
        var marker = new maptalks.Marker([100, 0], {
            symbol:{
                'markerFile' : {
                    property:'count',
                    type:'interval',
                    stops: [
                        [0, 'resources/x.svg'],
                        [9, 'resources/x1.svg'],
                        [99, 'resources/x2.svg']
                    ]
                },
                'markerWidth':20,
                'markerHeight':30
            }
        });
        var res = marker._getExternalResources();
        expect(res).to.have.length(3);
        expect(res[0]).to.be.eql(['resources/x.svg', 20, 30]);
        expect(res[1]).to.be.eql(['resources/x1.svg', 20, 30]);
        expect(res[2]).to.be.eql(['resources/x2.svg', 20, 30]);
    });

    it('function type markerPath', function () {
        var expected0 = 'data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSIgPjxkZWZzPjwvZGVmcz4gPHBhdGggIHN0cm9rZS1saW5lY2FwPSJidXR0IiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNOCAyM2wwIDAgMCAwIDAgMCAwIDAgMCAwYy00LC01IC04LC0xMCAtOCwtMTQgMCwtNSA0LC05IDgsLTlsMCAwIDAgMGM0LDAgOCw0IDgsOSAwLDQgLTQsOSAtOCwxNHogTTUsOSBhMywzIDAsMSwwLDAsLTAuOVoiPjwvcGF0aD4gPC9zdmc+';
        var expected1 = 'data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSIgPjxkZWZzPjwvZGVmcz4gPHBhdGggIGZpbGw9IiNERTMzMzMiIHN0cm9rZS1saW5lY2FwPSJidXR0IiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNOCAyM2wwIDAgMCAwIDAgMCAwIDAgMCAwYy00LC01IC04LC0xMCAtOCwtMTQgMCwtNSA0LC05IDgsLTlsMCAwIDAgMGM0LDAgOCw0IDgsOSAwLDQgLTQsOSAtOCwxNHogTTUsOSBhMywzIDAsMSwwLDAsLTAuOVoiPjwvcGF0aD4gPC9zdmc+';
        var marker = new maptalks.Marker([100, 0], {
            symbol:{
                'markerType'    : 'path',
                'markerPath'    : {
                    property:'count',
                    type:'interval',
                    stops: [
                        [0, 'M8 23l0 0 0 0 0 0 0 0 0 0c-4,-5 -8,-10 -8,-14 0,-5 4,-9 8,-9l0 0 0 0c4,0 8,4 8,9 0,4 -4,9 -8,14z M5,9 a3,3 0,1,0,0,-0.9Z'],
                        [9, {
                            'path' : 'M8 23l0 0 0 0 0 0 0 0 0 0c-4,-5 -8,-10 -8,-14 0,-5 4,-9 8,-9l0 0 0 0c4,0 8,4 8,9 0,4 -4,9 -8,14z M5,9 a3,3 0,1,0,0,-0.9Z',
                            'fill' : '#DE3333'
                        }]
                    ]
                },
                'markerWidth':20,
                'markerHeight':30
            }
        });
        var res = marker._getExternalResources();
        expect(res).to.have.length(2);
        expect(res[0]).to.be.eql([expected0, 20, 30]);
        expect(res[1]).to.be.eql([expected1, 20, 30]);
    });
});
