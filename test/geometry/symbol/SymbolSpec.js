// var CommonSpec = require('./CommonSpec');

describe('SymbolSpec', function() {

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
        canvasContainer = map._panels.mapMask;
    });

    afterEach(function() {
        map.removeLayer(layer);
        removeContainer(container)
    });

    describe('external resource', function() {
        it('marker file', function() {
            var expected = location.href.substring(0, location.href.lastIndexOf('/'))+'/foo/x.svg';
            var marker = new maptalks.Marker([100,0], {
                symbol:{
                    "marker-file" : "foo/x.svg",
                    "marker-width":20,
                    "marker-height":30
                }
            });
            var res = marker._getExternalResource();
            expect(res).to.have.length(1);
            expect(res[0][0]).to.be.eql(expected);
            expect(res[0][1]).to.be.eql(20);
            expect(res[0][2]).to.be.eql(30);
        });
        it('line pattern file', function() {
            var expected = location.href.substring(0, location.href.lastIndexOf('/'))+'/foo/x.svg';
            var line = new maptalks.Polygon([[100,0],[101,1],[105,10],[100,0]], {
                symbol:{
                    "line-pattern-file" : "foo/x.svg"
                }
            });
            var res = line._getExternalResource();
            expect(res).to.have.length(1);
            expect(res[0][0]).to.be.eql(expected);
        });

        it('polygon pattern file', function() {
            var expected = location.href.substring(0, location.href.lastIndexOf('/'))+'/foo/x.svg';
            var polygon = new maptalks.Polygon([[100,0],[101,1],[105,10],[100,0]], {
                symbol:{
                    "polygon-pattern-file" : "foo/x.svg"
                }
            });
            var res = polygon._getExternalResource();
            expect(res).to.have.length(1);
            expect(res[0][0]).to.be.eql(expected);
        });

        it('should be reloaded after zoomend', function(done) {
            var expected = location.href.substring(0, location.href.lastIndexOf('/'))+'/foo/x.svg';
            var marker = new maptalks.Marker([100,0], {
                symbol:{
                    "marker-file" : "foo/x.svg",
                    "marker-width":20,
                    "marker-height":30
                }
            });
            map.on('zoomstart', function() {
                marker.setSymbol(
                    {
                        "marker-file" : "foo/x.svg",
                        "marker-width":40,
                        "marker-height":50
                    }
                )
            });
            map.on('zoomend', function() {
                var res = marker._getExternalResource();
                expect(res).to.have.length(1);
                expect(vectorLayer._getRenderer().isResourceLoaded(res[0])).to.be.ok();
                done();
            });
            var vectorLayer = new maptalks.VectorLayer('v').addGeometry(marker);
            vectorLayer.once('layerload', function() {
                map.zoomIn();
            });
            map.addLayer(vectorLayer);


        });
    });
});
