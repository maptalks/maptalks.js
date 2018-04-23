describe('Geometry.Edit', function () {
    var container, eventContainer;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var layer;
    function dragGeometry(geometry, offset) {
        var domPosition = GET_PAGE_POSITION(container);
        var point = map.coordinateToContainerPoint(geometry.getCenter()).add(domPosition);
        if (offset) {
            point._add(offset);
        }
        happen.mousedown(eventContainer, {
            'clientX':point.x,
            'clientY':point.y
        });
        for (var i = 0; i < 10; i++) {
            happen.mousemove(document, {
                'clientX':point.x + i,
                'clientY':point.y + i
            });
        }
        happen.mouseup(document);
    }

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center, null);
        container = setups.container;
        map = setups.map;
        map.config('panAnimation', false);
        map.config('onlyVisibleGeometryEvents', false);
        eventContainer = map._panels.canvasContainer;
        layer = new maptalks.VectorLayer('id');
        map.addLayer(layer);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    describe('edit all kinds of geometries', function () {
        it('can only be edited on a map', function () {
            var marker = new maptalks.Marker(map.getCenter());
            marker.startEdit();
            expect(marker.isEditing()).not.to.be.ok();
        });

        it('should can change coordinates when being edited', function () {
            var geometries = GEN_GEOMETRIES_OF_ALL_TYPES();
            var coords = geometries.map(function (g) {
                return maptalks.Coordinate.toNumberArrays(g.getCoordinates());
            });

            var changed = [];
            geometries.forEach(function (g) {
                g.startEdit();
                g.translate(0.1, 0.2);
                changed.push(maptalks.Coordinate.toNumberArrays(g.getCoordinates()));
                g.endEdit();
            });

            expect(coords.length).to.be.eql(changed.length);
            for (var i = 0, l = coords.length; i < l; i++) {
                expect(coords[i]).not.to.be.eql(changed[i]);
            }
        });

        describe('drag all kinds of geometries', function () {
            var geometries = GEN_GEOMETRIES_OF_ALL_TYPES();
            function testDrag(geo) {
                return function () {
                    if (geo instanceof maptalks.GeometryCollection || geo instanceof maptalks.Sector) {
                        //not fit for geometry collection's test.
                        return;
                    }
                    layer.addGeometry(geo);
                    geo.startEdit();
                    var center = geo.getCenter();
                    dragGeometry(geo);
                    expect(geo.getCenter()).not.to.closeTo(center);
                    //geo can only be dragged by center handle.
                    var newCenter = geo.getCenter();
                    dragGeometry(geo, new maptalks.Point(500, 20));
                    if (!(geo instanceof maptalks.Marker) || geo._canEdit()) {
                        expect(geo.getCenter()).to.closeTo(newCenter);
                        geo.undoEdit();
                        var c = geo.getCenter();
                        expect(c.x).to.be.approx(center.x, 1E-4);
                        expect(c.y).to.be.approx(center.y, 1E-4);
                        geo.redoEdit();
                        expect(geo.getCenter()).to.closeTo(newCenter);
                    }
                    geo.endEdit();
                };
            }
            for (var i = 0; i < geometries.length; i++) {
                it('drag geometry ' + geometries[i].getType(), testDrag(geometries[i]));
            }
        });
    });

    describe('edit a geometry', function () {
        it('not all markers can be edited', function () {
            for (var i = 0; i < COMMON_SYMBOL_TESTOR.markerSymbols.length; i++) {
                var symbol = COMMON_SYMBOL_TESTOR.markerSymbols[i];
                var marker = new maptalks.Marker(center, { symbol:symbol });
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
            var label = new maptalks.Label('label', center);
            label.startEdit();
            //label can't be edited.
            expect(label.isEditing()).not.to.be.ok();
            label.endEdit();
        });

        it('resize a vector marker', function () {
            var marker = new maptalks.Marker(map.getCenter(), {
                symbol : {
                    markerType:'ellipse',
                    markerWidth:20,
                    markerHeight:20
                }
            }).addTo(layer);
            var size = marker.getSize();
            var fired = false;
            marker.on('resizing', function () {
                fired = true;
            });
            marker.startEdit();
            dragGeometry(marker, new maptalks.Point(size.width / 2, 0));
            var symbol = marker.getSymbol();
            expect(symbol.markerWidth).to.be.approx(39);
            expect(symbol.markerHeight).to.be.approx(20);
            expect(fired).to.be.ok();
            marker.undoEdit();
            symbol = marker.getSymbol();
            expect(symbol.markerWidth).to.be.approx(20);
            expect(symbol.markerHeight).to.be.approx(20);
            marker.redoEdit();
            symbol = marker.getSymbol();
            expect(symbol.markerWidth).to.be.approx(39);
            expect(symbol.markerHeight).to.be.approx(20);
            marker.endEdit();
        });

        it('resize a vector marker with fix aspect ratio', function () {
            var marker = new maptalks.Marker(map.getCenter(), {
                symbol : {
                    markerType:'ellipse',
                    markerWidth:20,
                    markerHeight:20
                }
            }).addTo(layer);
            var fired = false;
            marker.on('resizing', function () {
                fired = true;
            });
            marker.startEdit({ 'fixAspectRatio' : true });
            var size = marker.getSize();
            dragGeometry(marker, new maptalks.Point(size.width / 2, 0));
            var symbol = marker.getSymbol();
            expect(symbol.markerWidth).to.be.approx(39);
            expect(symbol.markerHeight).to.be.approx(39);
            expect(fired).to.be.ok();
            marker.undoEdit();
            symbol = marker.getSymbol();
            expect(symbol.markerWidth).to.be.approx(20);
            expect(symbol.markerHeight).to.be.approx(20);
            marker.redoEdit();
            symbol = marker.getSymbol();
            expect(symbol.markerWidth).to.be.approx(39);
            expect(symbol.markerHeight).to.be.approx(39);
            marker.endEdit();
        });

        it('resize a text box', function () {
            var marker = new maptalks.TextBox('textbox', map.getCenter(), 20, 20).addTo(layer);
            var size = marker.getSize();
            var fired = false;
            marker.on('resizing', function () {
                fired = true;
            });
            marker.startEdit();
            dragGeometry(marker, new maptalks.Point(size.width / 2, 0));
            expect(marker.getWidth()).to.be.above(30);
            expect(marker.getHeight()).to.be.approx(20);
            expect(fired).to.be.ok();
            marker.undoEdit();

            expect(marker.getWidth()).to.be.approx(20);
            expect(marker.getHeight()).to.be.approx(20);
            marker.redoEdit();

            expect(marker.getWidth()).to.be.above(30);
            expect(marker.getHeight()).to.be.approx(20);
            marker.endEdit();
        });

        it('resize a circle', function () {
            var circle = new maptalks.Circle(map.getCenter(), 1000).addTo(layer);
            var fired = false;
            circle.on('resizing', function () {
                fired = true;
            });
            circle.startEdit();
            var size = circle.getSize();
            dragGeometry(circle, new maptalks.Point(size.width / 2, 0));
            expect(circle.getRadius()).to.be.above(1005);

            circle.undoEdit();
            expect(circle.getRadius()).to.be.eql(1000);
            circle.redoEdit();
            expect(circle.getRadius()).to.be.above(1005);

            circle.endEdit();
            expect(fired).to.be.ok();
        });

        it('resize a ellipse', function () {
            var ellipse = new maptalks.Ellipse(map.getCenter(), 1000, 500).addTo(layer);
            var fired = false;
            ellipse.on('resizing', function () {
                fired = true;
            });
            ellipse.startEdit();
            var size = ellipse.getSize();
            dragGeometry(ellipse, new maptalks.Point(size.width / 2, size.height / 2));
            expect(ellipse.getWidth()).to.be.above(1010);
            expect(ellipse.getHeight()).to.be.above(510);

            ellipse.undoEdit();
            expect(ellipse.getWidth()).to.be.approx(1000);
            expect(ellipse.getHeight()).to.be.approx(500);
            ellipse.redoEdit();
            expect(ellipse.getWidth()).to.be.above(1010);
            expect(ellipse.getHeight()).to.be.above(510);

            ellipse.endEdit();
            expect(fired).to.be.ok();
        });

        it('resize a ellipse with fix aspect ratio', function () {
            var ellipse = new maptalks.Ellipse(map.getCenter(), 100, 50).addTo(layer);
            var fired = false;
            ellipse.on('resizing', function () {
                fired = true;
            });
            ellipse.startEdit({ 'fixAspectRatio' : true });
            var size = ellipse.getSize();
            var ratio = ellipse.getWidth() / ellipse.getHeight();
            dragGeometry(ellipse, new maptalks.Point(size.width / 2, 0));
            expect(ellipse.getWidth()).to.be.above(114);
            expect(ellipse.getHeight()).to.be.approx(ellipse.getWidth() / ratio);

            ellipse.undoEdit();
            expect(ellipse.getWidth()).to.be.approx(100);
            expect(ellipse.getHeight()).to.be.approx(50);

            ellipse.redoEdit();
            expect(ellipse.getWidth()).to.be.above(114);
            expect(ellipse.getHeight()).to.be.approx(ellipse.getWidth() / ratio);

            ellipse.endEdit();
            expect(fired).to.be.ok();
        });

        it('resize a rectangle', function () {
            var rect = new maptalks.Rectangle(map.getCenter(), 1000, 500).addTo(layer);
            var fired = false;
            rect.on('resizing', function () {
                fired = true;
            });
            rect.startEdit();
            var size = rect.getSize();
            dragGeometry(rect, new maptalks.Point(size.width / 2, size.height / 2));
            expect(rect.getWidth()).to.be.above(1008);
            expect(rect.getHeight()).to.be.above(508);

            rect.undoEdit();
            expect(rect.getWidth()).to.be.approx(1000);
            expect(rect.getHeight()).to.be.approx(500);
            rect.redoEdit();
            expect(rect.getWidth()).to.be.above(1008);
            expect(rect.getHeight()).to.be.above(508);

            rect.endEdit();
            expect(fired).to.be.ok();
        });

        it('resize a rectangle with fix aspect ratio', function () {
            var rect = new maptalks.Rectangle(map.getCenter(), 100, 50).addTo(layer);
            var fired = false;
            rect.on('resizing', function () {
                fired = true;
            });
            rect.startEdit({ 'fixAspectRatio' : true });
            var size = rect.getSize();
            var ratio = rect.getWidth() / rect.getHeight();
            dragGeometry(rect, new maptalks.Point(size.width / 2, 0));
            expect(rect.getWidth()).to.be.above(108);
            expect(rect.getHeight()).to.be.approx(rect.getWidth() / ratio, 3);

            rect.undoEdit();
            expect(rect.getWidth()).to.be.approx(100);
            expect(rect.getHeight()).to.be.approx(50);
            rect.redoEdit();
            expect(rect.getWidth()).to.be.above(108);
            expect(rect.getHeight()).to.be.approx(rect.getWidth() / ratio, 3);

            rect.endEdit();
            expect(fired).to.be.ok();
        });

        it('change a polygon vertex', function () {
            var rect = new maptalks.Rectangle(map.getCenter(), 1000, 500).addTo(layer);
            var polygon = new maptalks.Polygon(rect.getShell()).addTo(layer);
            var o = polygon.toGeoJSON();

            polygon.startEdit();
            var size = polygon.getSize();
            dragGeometry(polygon, new maptalks.Point(size.width / 2, size.height / 2));
            expect(polygon.toGeoJSON()).not.to.be.eqlGeoJSON(o);
            var expected = {"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[118.84682499999997,32.04653400000004],[118.85742312186676,32.04653400000004],[118.85751916135894,32.04196057399085],[118.84682499999997,32.04204242358057],[118.84682499999997,32.04653400000004]]]},"properties":null};
            expect(polygon.toGeoJSON()).to.be.eqlGeoJSON(expected);

            polygon.undoEdit();
            expect(polygon.toGeoJSON()).to.be.eqlGeoJSON(o);
            polygon.redoEdit();
            expect(polygon.toGeoJSON()).to.be.eqlGeoJSON(expected);

            polygon.endEdit();
        });

        it('click to remove a polygon vertex', function () {
            var rect = new maptalks.Rectangle(map.getCenter(), 1000, 500).addTo(layer);
            var polygon = new maptalks.Polygon(rect.getShell()).addTo(layer);
            expect(polygon.getCoordinates()[0].length).to.be(5);

            polygon.startEdit({
                'removeVertexOn' : 'click'
            });
            var size = polygon.getSize();
            var domPosition = GET_PAGE_POSITION(container);
            var point = map.coordinateToContainerPoint(polygon.getCenter()).add(domPosition);
            point._add(new maptalks.Point(size.width / 2, size.height / 2));

            happen.click(eventContainer, {
                'clientX':point.x,
                'clientY':point.y
            });

            polygon.endEdit();
            expect(polygon.getCoordinates()[0].length).to.be(4);
        });

        it('update symbol when editing', function (done) {
            var circle = new maptalks.Circle(map.getCenter(), 1000, {
                symbol : {
                    'polygonFill' : '#f00'
                }
            }).addTo(layer);
            circle.startEdit();
            var editStage = circle._editor._shadowLayer;
            editStage.once('layerload', function () {
                expect(editStage).to.be.painted(0, 20, [255, 0, 0]);
                editStage.once('layerload', function () {
                    expect(editStage).to.be.painted(0, 20, [255, 255, 0]);
                    circle.endEdit();
                    done();
                });
                circle.updateSymbol({
                    'polygonFill' : '#ff0'
                });
            });
        });
    });


});
