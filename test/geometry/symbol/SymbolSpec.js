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
        canvasContainer = map._panels.canvasContainer;
        layer = new maptalks.VectorLayer('id').addTo(map);
    });

    afterEach(function() {
        map.removeLayer(layer);
        removeContainer(container)
    });

    it('default', function() {
        var geometries = genAllTypeGeometries();
        var i;
        for (i = 0; i < geometries.length; i++) {
            expect(geometries[i].getSymbol()).not.to.be.ok();
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
            "markerType" : "ellipse",
            "markerWidth":20,
            "markerHeight":30
        };
        var marker = new maptalks.Marker(center);
        marker.setSymbol({
            "markerType" : "cross",
            "markerWidth":20,
            "markerHeight":30
        }).updateSymbol({
             "markerType" : "ellipse",
        });
        expect(marker.getSymbol()).to.be.eql(expected);
    });

    it('updateSymbol directly', function () {

        var marker = new maptalks.Marker(center);
        var expected = maptalks.Util.extend({}, marker._getInternalSymbol());
        expected.markerType = 'ellipse';
        marker.updateSymbol({
             "markerType" : "ellipse",
        });
        expect(marker.getSymbol()).to.be.eql(expected);
    });

    it('marker file', function() {
        var expected = location.href.substring(0, location.href.lastIndexOf('/'))+'/resources/x.svg';
        var marker = new maptalks.Marker([100,0], {
            symbol:{
                "markerFile" : "resources/x.svg",
                "markerWidth":20,
                "markerHeight":30
            }
        });
        var res = marker._getExternalResources();
        expect(res).to.have.length(1);
        expect(res[0][0]).to.be.eql(expected);
        expect(res[0][1]).to.be.eql(20);
        expect(res[0][2]).to.be.eql(30);
    });
    it('line pattern file', function() {
        var expected = location.href.substring(0, location.href.lastIndexOf('/'))+'/resources/x.svg';
        var line = new maptalks.Polygon([[100,0],[101,1],[105,10],[100,0]], {
            symbol:{
                "linePatternFile" : "resources/x.svg"
            }
        });
        var res = line._getExternalResources();
        expect(res).to.have.length(1);
        expect(res[0][0]).to.be.eql(expected);
    });

    it('polygon pattern file', function() {
        var expected = location.href.substring(0, location.href.lastIndexOf('/'))+'/resources/x.svg';
        var polygon = new maptalks.Polygon([[100,0],[101,1],[105,10],[100,0]], {
            symbol:{
                "polygonPatternFile" : "resources/x.svg"
            }
        });
        var res = polygon._getExternalResources();
        expect(res).to.have.length(1);
        expect(res[0][0]).to.be.eql(expected);
    });

    it('with a non-exist svg icon', function(done) {
        var marker = new maptalks.Marker([100,0], {
            symbol:{
                "markerFile" : "resources/not-existed.svg",
                "markerWidth":20,
                "markerHeight":30
            }
        });
        var vectorLayer = new maptalks.VectorLayer('v').addGeometry(marker);
        vectorLayer.once('layerload', function() {
            done();
        });
        map.addLayer(vectorLayer);
    });

    it('should be reloaded after zoomend', function(done) {
        var expected = location.href.substring(0, location.href.lastIndexOf('/'))+'/resources/x.svg';
        var marker = new maptalks.Marker([100,0], {
            symbol:{
                "markerFile" : "resources/x.svg",
                "markerWidth":20,
                "markerHeight":30
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
        map.on('zoomend', function() {
            var res = marker._getExternalResources();
            expect(res).to.have.length(1);
            expect(vectorLayer._getRenderer().resources.isResourceLoaded(res[0])).to.be.ok();
            done();
        });
        var vectorLayer = new maptalks.VectorLayer('v').addGeometry(marker);
        vectorLayer.once('layerload', function() {
            map.zoomIn();
        });
        map.addLayer(vectorLayer);
    });

    it('collection can _setExternSymbol', function() {
        var symbol = {
            'markerType' : 'ellipse',
            'markerWidth' : 10,
            'markerHeight' : 10
        }
        var markers = new maptalks.MultiPoint([[0, 0], [0, 1]]);
        markers._setExternSymbol(symbol);
        var children = markers.getGeometries();
        for (var i = 0; i < children.length; i++) {
            expect(children[i]._getInternalSymbol()).to.be.eql(symbol);
        }
    });

});
