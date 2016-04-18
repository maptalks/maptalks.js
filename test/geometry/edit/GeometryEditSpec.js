
describe('#GeometryEdit', function () {
    var container, eventContainer;
    var map;
    var tile;
    var center = new Z.Coordinate(118.846825, 32.046534);
    var layer;
    function dragGeometry(geometry, offset) {
        var domPosition = Z.DomUtil.getPagePosition(eventContainer);
        var point = map.coordinateToContainerPoint(geometry.getCenter()).add(domPosition);
        if (offset) {
            point._add(offset);
        }
        var requestAnimFn = Z.Util.requestAnimFrame;
        //replace original requestAnimFrame to immediate execution.
        Z.Util.requestAnimFrame=function(fn) {
            fn();
        };
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
        Z.Util.requestAnimFrame = requestAnimFn;
    }

    beforeEach(function() {
        var setups = commonSetupMap(center, null);
        container = setups.container;
        map = setups.map;
        eventContainer = map._panels.canvasContainer;
        layer = new Z.VectorLayer('id');
        map.addLayer(layer);
    });

    afterEach(function() {
        removeContainer(container)
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
            for (var i = 0; i < 1; i++) {
                var geo = geometries[i];
                if (geo instanceof Z.GeometryCollection) {
                    //not fit for geometry collection's test.
                    continue;
                }
                geo.startEdit();
                var center = geo.getCenter();
                dragGeometry(geo);
                expect(geo.getCenter()).not.to.nearCoord(center);
                //geo can only be dragged by center handle.
                var newCenter = geo.getCenter();
                dragGeometry(geo, new Z.Point(500,20));
                expect(geo.getCenter()).to.nearCoord(newCenter);
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
            expect(symbol.markerWidth).not.to.be.eql(20);
            expect(symbol.markerHeight).not.to.be.eql(20);
        });

        it('resize a circle',function() {
            var circle = new maptalks.Circle(map.getCenter(), 1000).addTo(layer);
            circle.startEdit();
            var size = circle.getSize();
            dragGeometry(circle, new maptalks.Point(size.width/2,0));
            var r = circle.getRadius();
            expect(r).not.to.be.eql(1000);
        });

        it('resize a ellipse',function() {
            var ellipse = new maptalks.Ellipse(map.getCenter(), 1000, 500).addTo(layer);
            ellipse.startEdit();
            var size = ellipse.getSize();
            dragGeometry(ellipse, new maptalks.Point(size.width/2,0));
            var r = ellipse.getWidth();
            expect(r).not.to.be.eql(1000);
        });

        it('resize a rectangle',function() {
            var rect = new maptalks.Rectangle(map.getCenter(), 1000, 500).addTo(layer);
            rect.startEdit();
            var size = rect.getSize();
            dragGeometry(rect, new maptalks.Point(size.width/2,size.height/2));
            var r = rect.getHeight();
            expect(r).not.to.be.eql(500);
        });

        it('change a polygon\'s vertex',function() {
            var rect = new maptalks.Rectangle(map.getCenter(), 1000, 500).addTo(layer);
            var shell = rect.getShell();
            var polygon = new maptalks.Polygon(rect.getShell()).addTo(layer);
            var o = polygon.toGeoJSON();
            polygon.startEdit();
            var size = polygon.getSize();
            dragGeometry(polygon, new maptalks.Point(size.width/2,size.height/2));
            expect(polygon.toGeoJSON()).not.to.eqlGeoJSON(o);
        });

    });


});
