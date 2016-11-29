
describe('#GeometryEdit', function () {
    var container, eventContainer;
    var map;
    var tile;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var layer;
    function dragGeometry(geometry, offset) {
        var domPosition = maptalks.DomUtil.getPagePosition(container);
        var point = map.coordinateToContainerPoint(geometry.getCenter()).add(domPosition);
        if (offset) {
            point._add(offset);
        }
        happen.mousedown(eventContainer,{
                'clientX':point.x,
                'clientY':point.y
                });
        for (var i = 0; i < 10; i++) {
            happen.mousemove(document,{
                'clientX':point.x+i,
                'clientY':point.y+i
                });
        };
        happen.mouseup(document);
    }

    beforeEach(function() {
        var setups = commonSetupMap(center, null);
        container = setups.container;
        map = setups.map;
        map.config('panAnimation', false);
        eventContainer = map._panels.canvasContainer;
        layer = new maptalks.VectorLayer('id');
        map.addLayer(layer);
    });

    afterEach(function() {
        // removeContainer(container)
    });

    describe('edit all kinds of geometries',function() {
        it('can only be edited on a map', function() {
            var marker = new maptalks.Marker(map.getCenter());
            marker.startEdit();
            expect(marker.isEditing()).not.to.be.ok();
        });

        it('drag all kinds of geometries', function() {
            this.timeout(8000);
            var geometries = genAllTypeGeometries();
            layer.addGeometry(geometries);
            for (var i = 0; i < geometries.length; i++) {
                var geo = geometries[i];
                if (geo instanceof maptalks.GeometryCollection || geo instanceof maptalks.Sector) {
                    //not fit for geometry collection's test.
                    continue;
                }
                geo.startEdit();
                var center = geo.getCenter();
                dragGeometry(geo);
                expect(geo.getCenter()).not.to.closeTo(center);
                //geo can only be dragged by center handle.
                var newCenter = geo.getCenter();
                dragGeometry(geo, new maptalks.Point(500,20));
                expect(geo.getCenter()).to.closeTo(newCenter);
            }
        });
    });

    describe('edit a geometry', function() {
        /*it('not all markers can be edited', function() {
            for (var i = 0; i < GeoSymbolTester.markerSymbols.length; i++) {
                var symbol = GeoSymbolTester.markerSymbols[i];
                var marker = new maptalks.Marker(center, {symbol:symbol});
                marker.addTo(layer);
                marker.startEdit();
                if (symbol['text-name']) {
                    //text markers can't be edited.
                    expect(marker.isEditing()).not.to.be.ok();
                } else {
                    //image marker and vector marker can be edited.
                    expect(marker.isEditing()).to.be.ok();
                }
                marker.endEdit();
                expect(marker.isEditing()).not.to.be.ok();
            }
            var label = new maptalks.Label('label',center);
            label.startEdit();
            //label can't be edited.
            expect(label.isEditing()).not.to.be.ok();
        });*/

        it('resize a vector marker',function() {
            var marker = new maptalks.Marker(map.getCenter(), {
                markerType:'ellipse',
                markerWidth:20,
                markerHeight:20
            }).addTo(layer);
            marker.startEdit();
            var size = marker.getSize();
            dragGeometry(marker, new maptalks.Point(size.width/2,0));
            var symbol = marker.getSymbol();
            expect(symbol.markerWidth).to.be.approx(24);
            expect(symbol.markerHeight).to.be.approx(42.99999999);
        });

        it('resize a circle',function() {
            var circle = new maptalks.Circle(map.getCenter(), 1000).addTo(layer);
            circle.startEdit();
            var size = circle.getSize();
            dragGeometry(circle, new maptalks.Point(size.width/2,0));
            var r = circle.getRadius();
            expect(r).to.be.eql(1010.22151);
        });

        it('resize a ellipse',function() {
            var ellipse = new maptalks.Ellipse(map.getCenter(), 1000, 500).addTo(layer);
            ellipse.startEdit();
            var size = ellipse.getSize();
            dragGeometry(ellipse, new maptalks.Point(size.width/2, size.height/2));
            expect(ellipse.getWidth()).to.be.approx(1020.27122);
            expect(ellipse.getHeight()).to.be.approx(520.2339);
        });

        it('resize a rectangle',function() {
            var rect = new maptalks.Rectangle(map.getCenter(), 1000, 500).addTo(layer);
            rect.startEdit();
            var size = rect.getSize();
            dragGeometry(rect, new maptalks.Point(size.width/2,size.height/2));
            expect(rect.getWidth()).to.be.approx(1010.07427);
            expect(rect.getHeight()).to.be.approx(510.0983);
        });

        it('change a polygon vertex',function() {
            var rect = new maptalks.Rectangle(map.getCenter(), 1000, 500).addTo(layer);
            var shell = rect.getShell();
            var polygon = new maptalks.Polygon(rect.getShell()).addTo(layer);
            var o = polygon.toGeoJSON();
            polygon.startEdit();
            var size = polygon.getSize();
            dragGeometry(polygon, new maptalks.Point(size.width/2,size.height/2));
            expect(polygon.toGeoJSON()).not.to.be.eqlGeoJSON(o);
            var expected = {"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[118.84682500000001,32.046534],[118.85742312186674,32.046534],[118.85751916135895,32.041960573990714],[118.84682500000001,32.04204242358055],[118.84682500000001,32.046534]]]},"properties":null};
            expect(polygon.toGeoJSON()).to.be.eqlGeoJSON(expected);
        });

        it('update symbol when editing', function (done) {
            var rect = new maptalks.Circle(map.getCenter(), 1000, {
                symbol : {
                    'polygonFill' : '#f00'
                }
            }).addTo(layer);
            rect.startEdit();
            var editStage = rect._editor._editStageLayer;
            editStage.once('layerload', function () {
                expect(editStage).to.be.painted(0, 20, [255, 0, 0]);
                editStage.once('layerload', function () {
                    expect(editStage).to.be.painted(0, 20, [255, 255, 0]);
                    done();
                });
                rect.updateSymbol({
                    'polygonFill' : '#ff0'
                });
            })
        });
    });


});
