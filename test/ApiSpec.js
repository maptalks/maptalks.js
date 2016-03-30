// var utils = require('./Specjs');

describe('API', function () {

    var container;
    var map;
    var tile;
    var center = new Z.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '800px';
        container.style.height = '600px';
        document.body.appendChild(container);
        var option = {
            zoom: 17,
            center: center
        };
        map = new Z.Map(container, option);
        tile = new Z.TileLayer('tile', {
            urlTemplate:"http://t{s}.tianditu.com/DataServer?T=vec_w&x={x}&y={y}&l={z}",
            subdomains: [1, 2, 3]
        });
        map.setBaseLayer(tile);
    });

    afterEach(function () {
        document.body.removeChild(container);
    });

    describe('Map', function () {

        it('getSize', function () {
            var size = map.getSize();

            expect(size).to.have.property('width');
            expect(size).to.have.property('height');
            expect(size.width).to.be.above(0);
            expect(size.height).to.be.above(0);
        });

        it('getExtent', function () {
            var extent = map.getExtent();

            expect(extent).to.not.be(null);
        });

        it('getCenter', function () {
            var center = map.getCenter();

            expect(center).to.not.be(null);
        });

        it('setCenter', function () {
            expect(function () {
                map.setCenter({x: 0, y: 0});
            }).to.not.throwException();
        });

        it('getZoom', function () {
            var zoom = map.getZoom();

            expect(zoom).to.be.above(0);
        });

        it('setZoom', function () {
            var zoom = map.getZoom();
            zoom = Math.ceil(zoom / 2);
            expect(function () {
                map.setZoom(zoom);
            }).to.not.throwException();
        });

        it('getMaxZoom', function () {
            var zoom = map.getMaxZoom();

            expect(zoom).to.be.above(0);
        });

        it('setMaxZoom', function () {
            var zoom = map.getMaxZoom();
            zoom = Math.ceil(zoom / 2);
            expect(function () {
                map.setMaxZoom(zoom);
            }).to.not.throwException();
        });

        it('getMinZoom', function () {
            var zoom = map.getMinZoom();

            expect(zoom).to.be.above(-1);
        });

        it('setMinZoom', function () {
            var zoom = map.getMinZoom();
            zoom = Math.ceil(zoom / 2);
            expect(function () {
                map.setMinZoom(zoom);
            }).to.not.throwException();
        });

        it('zoomIn', function () {
            expect(function () {
                map.zoomIn();
            }).to.not.throwException();
        });

        it('zoomOut', function () {
            expect(function () {
                map.zoomOut();
            }).to.not.throwException();
        });

        it('setCenterAndZoom', function () {
            var zoom = map.getZoom();
            zoom = Math.ceil(zoom / 2);

            expect(function () {
                map.setCenterAndZoom({x: 0, y: 0}, zoom);
            }).to.not.throwException();
        });

        it('getFitZoom', function () {
            var extent = map.getExtent();
            var zoom = map.getZoom();
            var fitZoom = map.getFitZoom(extent);

            expect(fitZoom).to.eql(zoom);
        });

        it('getBaseLayer', function () {
            expect(map.getBaseLayer()).to.equal(tile);
        });

        it('setBaseLayer', function () {
            var tile2 = new Z.TileLayer('tile2', {

                urlTemplate:"http://t{s}.tianditu.com/DataServer?T=vec_w&x={x}&y={y}&l={z}",
                subdomains: [0, 1, 2]
            });
            expect(function () {
                map.setBaseLayer(tile2);
            }).to.not.throwException();
        });

        it('getLayer', function () {
        });

        it('addLayer', function () {
        });

        // it('getCRS', function () {
        //     var t = map.getCRS();

        //     expect(t).to.not.be(null);
        // });

        it('coordinateToContainerPoint', function () {
            var point = map.coordinateToContainerPoint({x: 1, y: 1});

            expect(point).to.not.be(null);
        });

        it('containerPointToCoordinate', function () {
            var coord = map.containerPointToCoordinate(new Z.Point(0, 0));

            expect(coord).to.not.be(null);
        });

    });

    describe('Map.Pan', function() {

        it('panTo', function() {
            var coord = {x: 1, y: 1};

            expect(function () {
                map.panTo(coord);
            }).to.not.throwException();
        });

        it('panBy', function() {
            var offset = {x: 20, y: 20};

            expect(function () {
                map.panBy(offset);
            }).to.not.throwException();
        });

    });

    describe('Map.ContextMenu', function() {

        it('setMenu', function() {
            var spy = sinon.spy();

            expect(function () {
                map.setMenu({
                    items: []
                });
                map.setMenu({
                    items: [
                        {item: 'item1', callback: spy},
                        {item: 'item2', callback: spy}
                    ],
                    width: 250
                });
            }).to.not.throwException();
        });

        it('setMenuItems', function() {
            var spy = sinon.spy();
            var items_1 = [];
            var items_2 = [
                {item: 'item1', callback: spy},
                {item: 'item2', callback: spy}
            ];

            expect(function () {
                map.setMenuItems(items_1);
                map.setMenuItems(items_2);
            }).to.not.throwException();
        });

        it('openMenu', function() {
            var pos = {x: 25, y: 25};

            expect(function () {
                map.openMenu();
                map.openMenu(pos);
            }).to.not.throwException();
        });

        it('closeMenu', function() {
            expect(function () {
                map.closeMenu();
            }).to.not.throwException();
        });

    });

    describe('Map.FullScreen', function() {

        it('requestFullScreen', function(done) {
            expect(function () {
                map.requestFullScreen();
                done();
            }).to.not.throwException();
        });

        it('cancelFullScreen', function(done) {
            expect(function () {
                map.cancelFullScreen();
                done();
            }).to.not.throwException();
        });

    });

    describe('Map.Snap', function() {
        it('snap');
    });

    /*describe('Map.CartoCSS', function() {

        var layer;

        beforeEach(function() {
            layer = new Z.VectorLayer('layer1');
            map.addLayer(layer);
        });

        afterEach(function() {
            map.removeLayer(layer);
        });

        it('CartoCSS 1', function () {
            var cartocss = [
                '#layer1 {',
                ' marker-width: 2',
                '}'
            ].join('');
            map.cartoCSS(cartocss);
            var marker = new Z.Marker(center);
            // marker.setProperties({});
            layer.addGeometry(marker);
            var style = map._cartoCSSGeometry(marker);

            expect(style['marker-width']).to.eql(2);
        });

        it('CartoCSS 2', function () {
            var cartocss = [
                '#layer1 {',
                ' marker-width: [my-width]',
                '}'
            ].join('');
            map.cartoCSS(cartocss);
            var marker = new Z.Marker(center);
            marker.setProperties({
                'my-width': 2
            });
            layer.addGeometry(marker);
            var style = map._cartoCSSGeometry(marker);

            expect(style['marker-width']).to.eql(2);
        });

        it('CartoCSS 3', function () {
            var cartocss = [
                '#layer1 {',
                ' marker-width: [my-width];',
                ' [property>3] { marker-width: 5; }',
                '}'
            ].join('');
            map.cartoCSS(cartocss);
            var marker = new Z.Marker(center);
            marker.setProperties({
                'my-width': 2,
                'property': 4
            });
            layer.addGeometry(marker);
            var style = map._cartoCSSGeometry(marker);

            expect(style['marker-width']).to.eql(5);
        });

    });*/

    describe('Map.Topo', function() {

        it('computeDistance', function() {
            var lonlat1 = new Z.Coordinate([0, 0]);
            var lonlat2 = new Z.Coordinate([1, 1]);
            var distance = map.computeDistance(lonlat1, lonlat2);

            expect(distance).to.be.above(0);
        });

        it('computeGeodesicLength', function() {
            var all = genAllTypeGeometries();

            expect(function () {
                for (var i = 0; i < all.length; i++) {
                    var g = all[i];
                    map.computeGeodesicLength(g);
                }
            }).to.not.throwException();
        });

        it('computeGeodesicArea', function() {
            var all = genAllTypeGeometries();

            expect(function () {
                for (var i = 0; i < all.length; i++) {
                    var g = all[i];
                    map.computeGeodesicArea(g);
                }
            }).to.not.throwException();
        });

        it('buffer');

        it('relate');

        it('identify', function() {
            var spy = sinon.spy();
            var layer = new Z.VectorLayer('id');
            var geometries = genAllTypeGeometries();
            //var point = map.coordinateToContainerPoint(center);
            layer.addGeometry(geometries);
            map.addLayer(layer);

            expect(function () {
                map.identify({
                    coordinate: center,
                    layers: [layer]
                }, spy);
            }).to.not.throwException();

        });

    });

    describe('Map.UI.InfoWindow', function() {

        it('show/hide/isVisible', function() {

            var options = {
                title: 'title',
                content: 'content'
            };
            var win = new Z.ui.InfoWindow(options);
            // win.setOptions(options);
            win.addTo(map);
            var pos = {x: 10, y: 10};

            expect(function () {
                win.show(pos);
                win.isVisible();
                win.hide();
            }).to.not.throwException();
        });

    });

    describe('Map.UI.Menu', function() {

        // it('setOptions', function() {
        //     var menu = new Z.ui.Menu();
        //     var options = {
        //         position: null,
        //         beforeOpen: null,
        //         items: [
        //             {item: 'item1'},
        //             {item: 'item2'}
        //         ],
        //         width: 160
        //     };

        //     expect(function () {
        //         menu.setOptions(options);
        //     }).to.not.throwException();
        // });

        // it('getOptions', function() {
        //     var menu = new Z.ui.Menu();
        //     var options = {
        //         position: null,
        //         beforeOpen: null,
        //         items: [
        //             {item: 'item1'},
        //             {item: 'item2'}
        //         ],
        //         width: 160
        //     };
        //     menu.setOptions(options);

        //     var got = menu.getOptions();

        //     expect(got).to.eql(options);
        // });

        it('addTo', function() {

            var options = {
                position: null,
                beforeOpen: null,
                items: [
                    {item: 'item1'},
                    {item: 'item2'}
                ],
                width: 160
            };
            var menu = new Z.ui.Menu(options);

            expect(function () {
                menu.addTo(map);
            }).to.not.throwException();
        });

        it('setItems', function() {
            var menu = new Z.ui.Menu();
            var items = [
                {item: 'item1'},
                {item: 'item2'}
            ];

            expect(function () {
                menu.setItems(items);
            }).to.not.throwException();
        });

        it('close/remove', function() {
            var options = {
                position: null,
                beforeOpen: null,
                items: [
                    {item: 'item1'},
                    {item: 'item2'}
                ],
                width: 160
            };
            var menu = new Z.ui.Menu(options);
            menu.addTo(map);
            var pos = new Z.Coordinate(10,10);
            menu.show(pos);

            expect(function () {
                // menu.close();
                menu.remove();
            }).to.not.throwException();
        });

        it('show/hide/isVisible', function() {
            var options = {
                position: null,
                beforeOpen: null,
                items: [
                    {item: 'item1'},
                    {item: 'item2'}
                ],
                width: 160
            };
            var menu = new Z.ui.Menu(options);
            menu.addTo(map);
            var pos = new Z.Coordinate(10,10);

            expect(function () {
                menu.show(pos);
                menu.hide();
                menu.isVisible();
            }).to.not.throwException();
        });

    });

    describe('Map.UI.Tip', function() {
        // TODO
    });

    describe('Map.UI.Label', function() {
        // TODO
    });

    describe('Control', function() {

        function buildOn() {
            return Z.DomUtil.createEl('div');
        }

        it('setOption');

        it('getOption');

        it('addTo', function() {
            var control = new Z.Control({
                id: 'id1',
                position: {top: 10, left: 10}
            });
            control.buildOn = buildOn;

            expect(function () {
                control.addTo(map);
            }).to.not.throwException();
        });

        it('setPosition', function() {
            var control = new Z.Control({
                id: 'id1',
                position: {top: 10, left: 10}
            });
            control.buildOn = buildOn;
            control.addTo(map);
            var pos = {
                top: 20,
                left: 30
            };

            expect(function () {
                control.setPosition(pos);
            }).to.not.throwException();
        });

        it('getPosition', function() {
            var control = new Z.Control({
                id: 'id1',
                position: {top: 10, left: 10}
            });
            var undef;

            expect(control.getPosition()).to.not.eql(undef);
        });

    });

    describe('Control.Attribution', function() {

        it('setContent', function() {
            var attribution = new Z.control.Attribution({
                id: 'id',
                position: {
                    bottom: 10,
                    right: 10
                }
            });
            attribution.addTo(map);

            expect(function () {
                attribution.setContent('new content');
            }).to.not.throwException();
        });

    });

    describe('OverlayLayer', function() {

        function paint(geometries) {}

        it('setId');

        it('getId');

        it('getExtent');

        it('bringToFront');

        it('bringToBack');

        it('addGeometry', function() {
            var layer = new Z.OverlayLayer();
            layer._paintGeometries = paint;
            layer.setId('id');
            // map.addLayer(layer);
            var geometry = new Z.Polygon([
                [
                    {x: 121.111, y: 30.111},
                    {x: 121.222, y: 30.222},
                    {x: 121.333, y: 30.333}
                ]
            ]);

            expect(function () {
                // layer.addGeometry(geometry);
                layer.addGeometry(geometry, true);
            }).to.not.throwException();
        });

        it('getGeometries', function() {
            var layer = new Z.OverlayLayer();
            layer.paintGeometries = paint;
            layer.setId('id');
            // map.addLayer(layer);
            var count = 10;
            for (var i = 0; i < count; i++) {
                var geometry = new Z.Polygon([
                    [
                        {x: 121.111, y: 30.111},
                        {x: 121.222, y: 30.222},
                        {x: 121.333, y: 30.333}
                    ]
                ]);
                layer.addGeometry(geometry);
            }
            var geometries = layer.getGeometries();

            expect(geometries).to.have.length(count);
        });

        it('getGeometryById', function() {
            var layer = new Z.OverlayLayer();
            layer.paintGeometries = paint;
            layer.setId('id');
            // map.addLayer(layer);
            var geometry = new Z.Polygon([
                [
                    {x: 121.111, y: 30.111},
                    {x: 121.222, y: 30.222},
                    {x: 121.333, y: 30.333}
                ]
            ]);
            geometry.setId('id');
            layer.addGeometry(geometry);

            expect(layer.getGeometryById('id')).to.not.be(null);
            expect(layer.getGeometryById(null)).to.be(null);
            expect(layer.getGeometryById('')).to.be(null);
        });

        it('removeGeometry', function() {
            var layer = new Z.VectorLayer('layer');
            layer.paintGeometries = paint;
            layer.setId('id');
            // map.addLayer(layer);
            var polygon = new Z.Polygon([
                [
                    {x: 121.111, y: 30.111},
                    {x: 121.222, y: 30.222},
                    {x: 121.333, y: 30.333}
                ]
            ]);
            polygon.setId('polygon');
            var polyline = new Z.Polyline([
                {x: 121.111, y: 30.111},
                {x: 121.222, y: 30.222}
            ]);
            polyline.setId('polyline');
            layer.addGeometry(polygon);
            layer.addGeometry(polyline);

            var got;

            layer.removeGeometry('polyline');
            got = layer.getGeometryById('polyline');
            expect(got).to.be(null);

            layer.removeGeometry(polygon);
            got = layer.getGeometryById('polygon');
            expect(got).to.be(null);
        });

        it('clear', function() {
            var layer = new Z.VectorLayer('layer');
            layer.paintGeometries = paint;
            layer.setId('id');
            // map.addLayer(layer);
            var polygon = new Z.Polygon([
                [
                    {x: 121.111, y: 30.111},
                    {x: 121.222, y: 30.222},
                    {x: 121.333, y: 30.333}
                ]
            ]);
            polygon.setId('polygon');
            var polyline = new Z.Polyline([
                {x: 121.111, y: 30.111},
                {x: 121.222, y: 30.222}
            ]);
            polyline.setId('polyline');
            layer.addGeometry(polygon);
            layer.addGeometry(polyline);

            layer.clear();

            var geometries = layer.getGeometries();
            expect(geometries).to.be.empty();
        });

    });

    describe('OverlayLayer.SVGLayer', function() {
        it('show/hide/isVisible', function() {
            var layer = new Z.VectorLayer('svg');
            map.addLayer(layer);
            var geometry = new Z.Polygon([
                [
                    {x: 121.111, y: 30.111},
                    {x: 121.222, y: 30.222},
                    {x: 121.333, y: 30.333}
                ]
            ]);
            layer.addGeometry(geometry);

            expect(function () {
                layer.show();
                layer.hide();
                layer.isVisible();
            }).to.not.throwException();
        });
    });

    describe('OverlayLayer.CanvasLayer', function() {
        it('show/hide/isVisible', function() {
            var layer = new Z.VectorLayer('canvas', {render: 'canvas'});
            map.addLayer(layer);
            var geometry = new Z.Polygon([
                [
                    {x: 121.111, y: 30.111},
                    {x: 121.222, y: 30.222},
                    {x: 121.333, y: 30.333}
                ]
            ]);
            layer.addGeometry(geometry);

            expect(function () {
                layer.show();
                layer.hide();
                layer.isVisible();
            }).to.not.throwException();
        });
    });

    describe('TileLayer', function() {
    });

    describe('DynamicLayer', function() {
    });

    describe('DrawTool', function() {

        it('addTo', function() {
            var drawTool = new Z.DrawTool({
                mode: Z.Geometry.TYPE_POLYLINE,
                symbol: {
                    strokeSymbol: {
                        stroke: '#ff0000',
                        'stroke-width': 3,
                        opacity: 0.6
                    }
                }
            });

            expect(function () {
                drawTool.addTo(map);
            }).to.not.throwException();
        });

        it('enable/disable', function() {
            var drawTool = new Z.DrawTool({
                mode: Z.Geometry.TYPE_POLYLINE,
                symbol: {
                    strokeSymbol: {
                        stroke: '#ff0000',
                        'stroke-width': 3,
                        opacity: 0.6
                    }
                }
            });
            drawTool.addTo(map);

            expect(function () {
                 drawTool.disable();
                 drawTool.enable();
             }).to.not.throwException();
        });

        it('setMode', function() {
            var drawTool = new Z.DrawTool({
                mode: Z.Geometry.TYPE_POLYLINE
            });
            drawTool.addTo(map);

            expect(function () {
                drawTool.setMode(Z.Geometry.TYPE_POLYGON);
            }).to.not.throwException();
        });

        it('setSymbol', function() {
            var drawTool = new Z.DrawTool({
                mode: Z.Geometry.TYPE_POLYLINE
            });
            drawTool.addTo(map);
            var symbol = {
                strokeSymbol: {
                    stroke: '#ff0000',
                    'stroke-width': 3,
                    opacity: 0.6
                }
            };

            expect(function () {
                drawTool.setSymbol(symbol);
            }).to.not.throwException();
        });

        it('getSymbol', function() {
            var drawTool = new Z.DrawTool({
                mode: Z.Geometry.TYPE_POLYLINE
            });
            drawTool.addTo(map);

            expect(function () {
                drawTool.getSymbol();
            }).to.not.be(null);
        });

    });

    describe('AreaTool', function() {
        it('enable/disable', function() {
            var tool = new Z.AreaTool();

            expect(function () {
                tool.addTo(map);
                tool.enable();
                tool.disable();
            }).to.not.throwException();
        });
    });

    describe('DistanceTool', function() {
        it('enable/disable', function() {
            var tool = new Z.DistanceTool();

            expect(function () {
                tool.addTo(map);
                tool.enable();
                tool.disable();
            }).to.not.throwException();
        });
    });

    describe('Query', function() {
        it('query');
    });

    describe('RemoteQuery', function() {

        it('query');

        it('identify');

    });

    describe('Geometry', function() {

        function getPainter() {}

        it('fromJson', function() {
            // TODO
        });

        it('fromGeoJSON', function() {
            // TODO
        });

        it('setId/getId', function() {
            var geometry = new Z.Geometry();
            var undef;

            expect(geometry.getId()).to.equal(undef);

            geometry.setId('id');

            expect(geometry.getId()).to.eql('id');
        });

        it('setSymbol/getSymbol', function() {
            var geometry = new Z.Geometry();
            geometry._getPainter = getPainter;
            var symbol = {

                    'lineColor': '#ff0000',
                    'lineWidth': 3,
                    'lineOpacity': 0.6

            };
            var undef;

            expect(geometry.getSymbol()).to.eql(undef);

            geometry.setSymbol(symbol);
            var got = geometry.getSymbol();

            expect(got).to.not.be(null);
            expect(got).to.only.have.keys([
                'lineColor',
                'lineWidth',
                'lineOpacity'
            ]);
        });

        it('[set|get]Properties');

        it('getLayer');

        it('getMap');

        it('getType');

        it('isVector');

    });

    describe('Geometry.Marker', function() {

        var layer;

        beforeEach(function () {
            layer = new Z.VectorLayer('svg');
            map.addLayer(layer);
        });

        afterEach(function () {
            map.removeLayer(layer);
        });

        it('setCoordinates', function() {
            var marker = new Z.Marker({x: 0, y: 0});

            expect(function () {
                marker.setCoordinates({x: 1, y: 1});
                layer.addGeometry(marker);
                marker.setCoordinates({x: -180, y: 75});
            }).to.not.throwException();
        });

        it('getCenter', function() {
            var marker = new Z.Marker({x: 0, y: 0});

            expect(function () {
                marker.getCenter();
            }).to.not.throwException();
        });

        it('getExtent', function() {
            var marker = new Z.Marker({x: 0, y: 0});

            expect(function () {
                marker.getExtent();
            }).to.not.throwException();
        });

        it('getSize', function() {
            var marker = new Z.Marker(map.getCenter());
            layer.addGeometry(marker);
            var size = marker.getSize();

            expect(size.width).to.be.above(0);
            expect(size.height).to.be.above(0);
        });

        it('show/hide/isVisible', function() {
            var marker = new Z.Marker({x: 0, y: 0});
            layer.addGeometry(marker);

            expect(function () {
                marker.show();
                marker.hide();
                marker.isVisible();
            }).to.not.throwException();
        });

        it('remove', function() {
            var marker = new Z.Marker({x: 0, y: 0});
            layer.addGeometry(marker);
            marker.remove();

            expect(marker.getLayer()).to.be(null);
        });

        it('copy');

        it('toJSON', function() {
        });

    });

    describe('Geometry.Circle', function() {

        var layer;

        beforeEach(function () {
            layer = new Z.VectorLayer('svg');
            map.addLayer(layer);
        });

        afterEach(function () {
            map.removeLayer(layer);
        });

        it('setCoordinates', function() {
            var circle = new Z.Circle({x: 0, y: 0}, 1);

            expect(function () {
                circle.setCoordinates({x: 1, y: 1});
                layer.addGeometry(circle);
                circle.setCoordinates({x:180, y: 75});
            }).to.not.throwException();
        });

        it('getCenter', function() {
            var circle = new Z.Circle({x: 0, y: 0}, 1);
            var got = circle.getCenter();

            expect(got.x).to.eql(0);
            expect(got.y).to.eql(0);
        });

        it('getExtent', function() {
            var circle = new Z.Circle({x: 0, y: 0}, 1);

            expect(function () {
                circle.getExtent();
            }).to.not.throwException();
        });

        it('getSize', function() {
            var circle = new Z.Circle({x: 0, y: 0}, 100);
            layer.addGeometry(circle);
            var size = circle.getSize();

            expect(size.width).to.be.above(0);
            expect(size.height).to.be.above(0);
        });

        it('show/hide/isVisible', function() {
            var circle = new Z.Circle({x: 0, y: 0}, 100);
            layer.addGeometry(circle);

            expect(function () {
                circle.show();
                circle.hide();
                circle.isVisible();
            }).to.not.throwException();
        });

        it('remove', function() {
            var circle = new Z.Circle({x: 0, y: 0}, 100);
            layer.addGeometry(circle);
            circle.remove();

            expect(circle.getLayer()).to.be(null);
        });

        it('copy');

        it('toJSON', function() {
        });

        it('setRadius/getRadius', function() {
            var circle = new Z.Circle({x: 0, y: 0}, 1);

            expect(circle.getRadius()).to.eql(1);

            circle.setRadius(20);

            expect(circle.getRadius()).to.eql(20);
        });

        it('getShell', function() {
            var circle = new Z.Circle({x: 0, y: 0}, 1);
            var shell = circle.getShell();

            expect(shell).to.have.length(circle.options.numberOfShellPoints);
        });

    });

    describe('Geometry.Ellipse', function() {

        var layer;

        beforeEach(function () {
            layer = new Z.VectorLayer('svg');
            map.addLayer(layer);
        });

        afterEach(function () {
            map.removeLayer(layer);
        });

        it('setCoordinates', function() {
            var ellipse = new Z.Ellipse({x: 0, y: 0}, 1, 1);

            expect(function () {
                ellipse.setCoordinates({x: -180, y: -75});
                layer.addGeometry(ellipse);
                ellipse.setCoordinates({x: -180, y: 75});
            }).to.not.throwException();
        });

        it('getCenter', function() {
            var ellipse = new Z.Ellipse({x: 0, y: 0}, 1, 1);
            var got = ellipse.getCenter();

            expect(got.x).to.eql(0);
            expect(got.y).to.eql(0);
        });

        it('getExtent', function() {
            var ellipse = new Z.Ellipse({x: 0, y: 0}, 1, 1);

            expect(function () {
                ellipse.getExtent();
            }).to.not.throwException();
        });

        it('getSize', function() {
            var ellipse = new Z.Ellipse({x: 0, y: 0}, 100, 100);
            layer.addGeometry(ellipse);
            var size = ellipse.getSize();

            expect(size.width).to.be.above(0);
            expect(size.height).to.be.above(0);
        });

        it('show/hide/isVisible', function() {
            var ellipse = new Z.Ellipse({x: 0, y: 0}, 1, 1);
            layer.addGeometry(ellipse);

            expect(function () {
                ellipse.show();
                ellipse.hide();
                ellipse.isVisible();
            }).to.not.throwException();
        });

        it('remove', function() {
            var ellipse = new Z.Ellipse({x: 0, y: 0}, 1, 1);
            layer.addGeometry(ellipse);
            ellipse.remove();

            expect(ellipse.getLayer()).to.be(null);
        });

        it('copy');

        it('toJSON', function() {
        });

        it('getWidth/getHeight]', function() {
            var ellipse = new Z.Ellipse({x: 0, y: 0}, 1, 1);
            var w = ellipse.getWidth();
            var h = ellipse.getHeight();

            expect(w).to.eql(1);
            expect(h).to.eql(1);
        });

        it('setWidth/setHeight', function() {
            var ellipse = new Z.Ellipse({x: 0, y: 0}, 1, 1);
            ellipse.setWidth(100);
            ellipse.setHeight(200);
            var w = ellipse.getWidth();
            var h = ellipse.getHeight();

            expect(w).to.eql(100);
            expect(h).to.eql(200);
        });

        it('getShell', function() {
            var ellipse = new Z.Ellipse({x: 0, y: 0}, 1, 1);
            var shell = ellipse.getShell();

            expect(shell).to.have.length(ellipse.options.numberOfShellPoints);
        });

    });

    describe('Geometry.Sector', function() {

        var layer;

        beforeEach(function () {
            layer = new Z.VectorLayer('svg');
            map.addLayer(layer);
        });

        afterEach(function () {
            map.removeLayer(layer);
        });

        it('setCoordinates', function() {
            var sector = new Z.Sector({x: 0, y: 0}, 1, 30, 60);

            expect(function () {
                sector.setCoordinates({x: 180, y: -75});
                layer.addGeometry(sector);
                sector.setCoordinates({x: 180, y: 75});
            }).to.not.throwException();
        });

        it('getCenter', function() {
            var sector = new Z.Sector({x: 0, y: 0}, 1, 30, 60);
            var got = sector.getCenter();

            expect(got.x).to.eql(0);
            expect(got.y).to.eql(0);
        });

        it('getExtent', function() {
            var sector = new Z.Sector({x: 0, y: 0}, 1, 30, 60);

            expect(function () {
                sector.getExtent();
            }).to.not.throwException();
        });

        it('getSize', function() {
            var sector = new Z.Sector({x: 0, y: 0}, 1, 30, 60);
            layer.addGeometry(sector);
            var size = sector.getSize();

            expect(size.width).to.be.above(0);
            expect(size.height).to.be.above(0);
        });

        it('show/hide/isVisible', function() {
            var sector = new Z.Sector({x: 0, y: 0}, 1, 30, 60);
            layer.addGeometry(sector);

            expect(function () {
                sector.show();
                sector.hide();
                sector.isVisible();
            }).to.not.throwException();
        });

        it('remove', function() {
            var sector = new Z.Sector({x: 0, y: 0}, 1, 30, 60);
            layer.addGeometry(sector);
            sector.remove();

            expect(sector.getLayer()).to.be(null);
        });

        it('copy');

        it('toJSON', function() {
        });

        it('getRadius/getStartAngle/getEndAngle', function() {
            var sector = new Z.Sector({x: 0, y: 0}, 1, 30, 60);
            var r = sector.getRadius();
            var s = sector.getStartAngle();
            var e = sector.getEndAngle();

            expect(r).to.eql(1);
            expect(s).to.eql(30);
            expect(e).to.eql(60);
        });

        it('setRadius/setStartAngle/setEndAngle', function() {
            var sector = new Z.Sector({x: 0, y: 0}, 1, 30, 60);
            sector.setRadius(2);
            sector.setStartAngle(60);
            sector.setEndAngle(120);
            var r = sector.getRadius();
            var s = sector.getStartAngle();
            var e = sector.getEndAngle();

            expect(r).to.eql(2);
            expect(s).to.eql(60);
            expect(e).to.eql(120);
        });

        it('getPoints', function() {
            var sector = new Z.Sector({x: 0, y: 0}, 1, 30, 60);
            var shell = sector.getShell();

            expect(shell).to.have.length(sector.options.numberOfShellPoints);
        });

    });

    describe('Geometry.Rectangle', function() {

        var layer;

        beforeEach(function () {
            layer = new Z.VectorLayer('svg');
            map.addLayer(layer);
        });

        afterEach(function () {
            map.removeLayer(layer);
        });

        it('getCenter', function() {
            var rect = new Z.Rectangle({x: 0, y: 0}, 200, 100);
            var got = rect.getCenter();

            expect(got).to.nearCoord(new Z.Coordinate([0.000898, -0.000449]));
        });

        it('getExtent', function() {
            var rect = new Z.Rectangle({x: 0, y: 0}, 200, 100);

            expect(function () {
                rect.getExtent();
            }).to.not.throwException();
        });

        it('getSize', function() {
            var rect = new Z.Rectangle({x: 0, y: 0}, 200, 100);
            layer.addGeometry(rect);
            var size = rect.getSize();

            expect(size.width).to.be.above(0);
            expect(size.height).to.be.above(0);
        });

        it('show/hide/isVisible', function() {
            var rect = new Z.Rectangle({x: 0, y: 0}, 200, 100);
            layer.addGeometry(rect);

            expect(function () {
                rect.show();
                rect.hide();
                rect.isVisible();
            }).to.not.throwException();
        });

        it('remove', function() {
            var rect = new Z.Rectangle({x: 0, y: 0}, 200, 100);
            layer.addGeometry(rect);
            rect.remove();

            expect(rect.getLayer()).to.be(null);
        });

        it('copy');

        it('toJSON', function() {
        });

        it('getNw/getWidth/getHeight', function() {
            var rect = new Z.Rectangle({x: 0, y: 0}, 200, 100);
            var nw = rect.getCoordinates();
            var w = rect.getWidth();
            var h = rect.getHeight();

            expect(nw).to.eql({x: 0, y: 0});
            expect(w).to.eql(200);
            expect(h).to.eql(100);
        });

        it('setNw/getWidth/getHeight', function() {
            var rect = new Z.Rectangle({x: 0, y: 0}, 200, 100);
            rect.setCoordinates({x: -180, y: 75});
            rect.setWidth(401);
            rect.setHeight(201);
            var nw = rect.getCoordinates();
            var w = rect.getWidth();
            var h = rect.getHeight();

            expect(nw).to.eql({x: -180, y: 75});
            expect(w).to.eql(401);
            expect(h).to.eql(201);
        });

        it('getShell', function() {
            var rect = new Z.Rectangle({x: 0, y: 0}, 200, 100);
            layer.addGeometry(rect);
            var points = rect.getShell();

            expect(points).to.have.length(5);
            expect(points[0]).to.eql(points[4]);
        });

    });

    describe('Geometry.Polyline', function() {

        var layer;

        beforeEach(function () {
            layer = new Z.VectorLayer('svg');
            map.addLayer(layer);
        });

        afterEach(function () {
            map.removeLayer(layer);
        });

        it('getCenter', function() {
            var polyline = new Z.Polyline([
              {x: 0, y: 0},
              {x: 120, y: 0}
            ]);
            var got = polyline.getCenter();

            // sum ?
            expect(got.x).to.eql(60);
            expect(got.y).to.eql(0);
        });

        it('getExtent', function() {
            var polyline = new Z.Polyline([
              {x: 0, y: 0},
              {x: 120, y: 0}
            ]);

            expect(function () {
                polyline.getExtent();
            }).to.not.throwException();
        });

        it('getSize', function() {
            var polyline = new Z.Polyline([
              {x: 0, y: 0},
              {x: 10, y: 10},
              {x: 20, y: 30}
            ]);
            layer.addGeometry(polyline);
            var size = polyline.getSize();

            expect(size.width).to.be.above(0);
            expect(size.height).to.be.above(0);
        });

        it('show/hide/isVisible', function() {
            var polyline = new Z.Polyline([
              {x: 0, y: 0},
              {x: 10, y: 10},
              {x: 20, y: 30}
            ]);
            layer.addGeometry(polyline);

            expect(function () {
                polyline.show();
                polyline.hide();
                polyline.isVisible();
            }).to.not.throwException();
        });

        it('remove', function() {
            var polyline = new Z.Polyline([
              {x: 0, y: 0},
              {x: 10, y: 10},
              {x: 20, y: 30}
            ]);
            layer.addGeometry(polyline);
            polyline.remove();

            expect(polyline.getLayer()).to.be(null);
        });

        it('copy');

        it('toJSON', function() {
        });

        it('getCoordinates', function() {
            var path = [
              {x: 0, y: 0},
              {x: 10, y: 10},
              {x: 20, y: 30}
            ];
            var polyline = new Z.Polyline(path);
            layer.addGeometry(polyline);
            var coords = polyline.getCoordinates();

            for(var i = 0; i < coords.length; i++) {
                expect(coords[i]).to.nearCoord(path[i]);
            }
            // expect(polyline.getCoordinates()).to.eql(path);
        });

        it('setCoordinates', function() {
            var path = [
              {x: 0, y: 0},
              {x: 10, y: 10},
              {x: 20, y: 30}
            ];
            var polyline = new Z.Polyline([]);
            layer.addGeometry(polyline);
            polyline.setCoordinates(path);

            expect(polyline.getCoordinates()).to.eql(path);
        });

    });

    describe('Geometry.Polygon', function() {

        var layer;

        beforeEach(function () {
            layer = new Z.VectorLayer('svg');
            map.addLayer(layer);
        });

        afterEach(function () {
            map.removeLayer(layer);
        });

        it('getCenter', function() {
            var rings = [
                [
                    {x: -1, y: 1},
                    {x: 1, y: 1},
                    {x: 1, y: -1},
                    {x: -1, y: -1}
                ]
            ];
            var polygon = new Z.Polygon(rings);
            var got = polygon.getCenter();

            expect(got).to.nearCoord(new Z.Coordinate([0, 0]));
        });

        it('getExtent', function() {
            var rings = [
                [
                    {x: 20, y: 0},
                    {x: 20, y: 10},
                    {x: 0, y: 10},
                    {x: 0, y: 0}
                ]
            ];
            var polygon = new Z.Polygon(rings);

            expect(function () {
                polygon.getExtent();
            }).to.not.throwException();
        });

        it('getSize', function() {
            var rings = [
                [
                    {x: 20, y: 0},
                    {x: 20, y: 10},
                    {x: 0, y: 10},
                    {x: 0, y: 0}
                ]
            ];
            var polygon = new Z.Polygon(rings);
            layer.addGeometry(polygon);
            var size = polygon.getSize();

            expect(size.width).to.be.above(0);
            expect(size.height).to.be.above(0);
        });

        it('show/hide/isVisible', function() {
            var rings = [
                [
                    {x: 20, y: 0},
                    {x: 20, y: 10},
                    {x: 0, y: 10},
                    {x: 0, y: 0}
                ]
            ];
            var polygon = new Z.Polygon(rings);
            layer.addGeometry(polygon);

            expect(function () {
                polygon.show();
                polygon.hide();
                polygon.isVisible();
            }).to.not.throwException();
        });

        it('remove', function() {
            var rings = [
                [
                    {x: 20, y: 0},
                    {x: 20, y: 10},
                    {x: 0, y: 10},
                    {x: 0, y: 0}
                ]
            ];
            var polygon = new Z.Polygon(rings);
            layer.addGeometry(polygon);
            polygon.remove();

            expect(polygon.getLayer()).to.be(null);
        });

        it('copy');

        it('toJSON', function() {
        });

        it('getCoordinates', function() {
            var rings = [
                {x: 20, y: 0},
                {x: 20, y: 10},
                {x: 0, y: 10},
                {x: 0, y: 0}
            ];
            var holes = [
                {x: 1, y: 1},
                {x: 3, y: 2},
                {x: 2, y: 3}
            ];
            var polygon = new Z.Polygon([rings, holes]);

            rings.push(rings[0]);
            holes.push(holes[0]);
            expect(polygon.getCoordinates()[0]).to.eql(rings);
            expect(polygon.getCoordinates()[1]).to.eql(holes);
        });

        it('setCoordinates', function() {
            var rings = [
                {x: 20, y: 0},
                {x: 20, y: 10},
                {x: 0, y: 10},
                {x: 0, y: 0}
            ];
            var holes = [
                {x: 1, y: 1},
                {x: 3, y: 2},
                {x: 2, y: 3}
            ];
            var polygon = new Z.Polygon([[]]);
            polygon.setCoordinates([rings, holes]);

            rings.push(rings[0]);
            holes.push(holes[0]);
            expect(polygon.getCoordinates()[0]).to.eql(rings);
            expect(polygon.getCoordinates()[1]).to.eql(holes);
        });

        it('hasHoles', function() {
            var rings = [
                {x: 20, y: 0},
                {x: 20, y: 10},
                {x: 0, y: 10},
                {x: 0, y: 0}
            ];
            var holes = [
                {x: 1, y: 1},
                {x: 3, y: 2},
                {x: 2, y: 3}
            ];
            var polygon = new Z.Polygon([rings]);

            expect(polygon.hasHoles()).to.not.be.ok();

            polygon.setCoordinates([rings, holes]);

            expect(polygon.hasHoles()).to.be.ok();
        });

    });

    describe('Geometry.GeometryCollection', function() {

        var layer;

        beforeEach(function () {
            layer = new Z.VectorLayer('svg');
            map.addLayer(layer);
        });

        afterEach(function () {
            map.removeLayer(layer);
        });

        it('getCenter', function() {
            var geometries = genAllTypeGeometries();
            var collection = new Z.GeometryCollection(geometries);

            expect(collection.getCenter()).to.not.be(null);
        });

        it('getExtent', function() {
            var geometries = genAllTypeGeometries();
            var collection = new Z.GeometryCollection(geometries);

            expect(collection.getExtent()).to.not.be(null);
        });

        it('getSize', function() {
            var geometries = genAllTypeGeometries();
            var collection = new Z.GeometryCollection(geometries);
            layer.addGeometry(collection);
            var size = collection.getSize();

            expect(size.width).to.be.above(0);
            expect(size.height).to.be.above(0);
        });

        it('show/hide/isVisible', function() {
            var geometries = genAllTypeGeometries();
            var collection = new Z.GeometryCollection(geometries);
            layer.addGeometry(collection);

            expect(function () {
                collection.show();
                collection.hide();
                collection.isVisible();
            }).to.not.throwException();
        });

        it('remove', function() {
            var geometries = genAllTypeGeometries();
            var collection = new Z.GeometryCollection(geometries);
            layer.addGeometry(collection);
            collection.remove();

            expect(collection.getLayer()).to.be(null);
        });

        it('copy');

        it('toJSON', function() {
        });

        it('getGeometries/setGeometries', function() {
            var collection = new Z.GeometryCollection([]);

            expect(collection.getGeometries()).to.be.empty();

            var geometries = genAllTypeGeometries();
            collection.setGeometries(geometries);

            expect(collection.getGeometries()).to.eql(geometries);
        });

        it('isEmpty', function() {
            var collection = new Z.GeometryCollection([]);

            expect(collection.isEmpty()).to.be.ok();

            var geometries = genAllTypeGeometries();
            collection.setGeometries(geometries);

            expect(collection.isEmpty()).to.not.be.ok();
        });

    });

    describe('Geometry.MultiPoint', function() {

        var layer;

        beforeEach(function () {
            layer = new Z.VectorLayer('svg');
            map.addLayer(layer);
        });

        afterEach(function () {
            map.removeLayer(layer);
        });

        it('getCenter', function() {
        });

        it('getExtent', function() {
        });

        it('getSize', function() {
        });

        it('show/hide/isVisible', function() {
        });

        it('remove', function() {
        });

        it('copy');

        it('toJSON', function() {
        });

    });

    describe('Geometry.MultiPolyline', function() {

        var layer;

        beforeEach(function () {
            layer = new Z.VectorLayer('svg');
            map.addLayer(layer);
        });

        afterEach(function () {
            map.removeLayer(layer);
        });

        it('getCenter', function() {
            var mp = new Z.MultiPolyline([]);
            var coords = [];
            coords[0] = [
                {x: 1, y: 2},
                {x: 3, y: 4},
                {x: 4, y: 3}
            ];
            coords[1] = [
                {x: 5, y: 6},
                {x: 7, y: 8},
                {x: 6, y: 5}
            ];
            mp.setCoordinates(coords);

            expect(mp.getCenter()).to.not.be(null);
        });

        it('getExtent', function() {
            var mp = new Z.MultiPolyline([]);
            var coords = [];
            coords[0] = [
                {x: 1, y: 2},
                {x: 3, y: 4},
                {x: 4, y: 3}
            ];
            coords[1] = [
                {x: 5, y: 6},
                {x: 7, y: 8},
                {x: 6, y: 5}
            ];
            mp.setCoordinates(coords);

            expect(mp.getExtent()).to.not.be(null);
        });

        it('getSize', function() {
            var mp = new Z.MultiPolyline([]);
            var coords = [];
            coords[0] = [
                {x: 1, y: 2},
                {x: 3, y: 4},
                {x: 4, y: 3}
            ];
            coords[1] = [
                {x: 5, y: 6},
                {x: 7, y: 8},
                {x: 6, y: 5}
            ];
            mp.setCoordinates(coords);
            layer.addGeometry(mp);
            var size = mp.getSize();

            expect(size.width).to.be.above(0);
            expect(size.height).to.be.above(0);
        });

        it('show/hide/isVisible', function() {
            var mp = new Z.MultiPolyline([]);
            var coords = [];
            coords[0] = [
                {x: 1, y: 2},
                {x: 3, y: 4},
                {x: 4, y: 3}
            ];
            coords[1] = [
                {x: 5, y: 6},
                {x: 7, y: 8},
                {x: 6, y: 5}
            ];
            mp.setCoordinates(coords);
            layer.addGeometry(mp);

            expect(function () {
                mp.show();
                mp.hide();
                mp.isVisible();
            }).to.not.throwException();
        });

        it('remove', function() {
            var mp = new Z.MultiPolyline([]);
            var coords = [];
            coords[0] = [
                {x: 1, y: 2},
                {x: 3, y: 4},
                {x: 4, y: 3}
            ];
            coords[1] = [
                {x: 5, y: 6},
                {x: 7, y: 8},
                {x: 6, y: 5}
            ];
            mp.setCoordinates(coords);
            layer.addGeometry(mp);
            mp.remove();

            expect(mp.getLayer()).to.be(null);
        });

        it('copy');

        it('toJSON', function() {
        });

        it('getCoordinates/setCoordinates', function() {
            var mp = new Z.MultiPolyline([]);

            expect(mp.getCoordinates()).to.be.empty();

            var coords = [];
            coords[0] = [
                {x: 1, y: 2},
                {x: 3, y: 4},
                {x: 4, y: 3}
            ];
            coords[1] = [
                {x: 5, y: 6},
                {x: 7, y: 8},
                {x: 6, y: 5}
            ];
            mp.setCoordinates(coords);

            expect(mp.getCoordinates()).to.eql(coords);
        });

    });

    describe('Geometry.MultiPolygon', function() {

        var layer;

        beforeEach(function () {
            layer = new Z.VectorLayer('svg');
            map.addLayer(layer);
        });

        afterEach(function () {
            map.removeLayer(layer);
        });

        it('getCenter', function() {
            var mp = new Z.MultiPolygon([]);
            var coords = [];
            coords[0] = [
                [
                    {x: 1, y: 2},
                    {x: 3, y: 4},
                    {x: 4, y: 3}
                ]
            ];
            coords[1] = [
                [
                    {x: 5, y: 6},
                    {x: 7, y: 8},
                    {x: 6, y: 5}
                ]
            ];
            mp.setCoordinates(coords);

            expect(mp.getCenter()).to.not.be(null);
        });

        it('getExtent', function() {
            var mp = new Z.MultiPolygon([]);
            var coords = [];
            coords[0] = [
                [
                    {x: 1, y: 2},
                    {x: 3, y: 4},
                    {x: 4, y: 3}
                ]
            ];
            coords[1] = [
                [
                    {x: 5, y: 6},
                    {x: 7, y: 8},
                    {x: 6, y: 5}
                ]
            ];
            mp.setCoordinates(coords);

            expect(mp.getExtent()).to.not.be(null);
        });

        it('getSize', function() {
            var mp = new Z.MultiPolygon([]);
            var coords = [];
            coords[0] = [
                [
                    {x: 1, y: 2},
                    {x: 3, y: 4},
                    {x: 4, y: 3}
                ]
            ];
            coords[1] = [
                [
                    {x: 5, y: 6},
                    {x: 7, y: 8},
                    {x: 6, y: 5}
                ]
            ];
            mp.setCoordinates(coords);
            layer.addGeometry(mp);
            var size = mp.getSize();

            expect(size.width).to.be.above(0);
            expect(size.height).to.be.above(0);
        });

        it('show/hide/isVisible', function() {
            var mp = new Z.MultiPolygon([]);
            var coords = [];
            coords[0] = [
                [
                    {x: 1, y: 2},
                    {x: 3, y: 4},
                    {x: 4, y: 3}
                ]
            ];
            coords[1] = [
                [
                    {x: 5, y: 6},
                    {x: 7, y: 8},
                    {x: 6, y: 5}
                ]
            ];
            mp.setCoordinates(coords);
            layer.addGeometry(mp);

            expect(function () {
                mp.show();
                mp.hide();
                mp.isVisible();
            }).to.not.throwException();
        });

        it('remove', function() {
            var mp = new Z.MultiPolygon([]);
            var coords = [];
            coords[0] = [
                [
                    {x: 1, y: 2},
                    {x: 3, y: 4},
                    {x: 4, y: 3}
                ]
            ];
            coords[1] = [
                [
                    {x: 5, y: 6},
                    {x: 7, y: 8},
                    {x: 6, y: 5}
                ]
            ];
            mp.setCoordinates(coords);
            layer.addGeometry(mp);
            mp.remove();

            expect(mp.getLayer()).to.be(null);
        });

        it('copy');

        it('toJSON', function() {
        });

        it('getCoordinates/setCoordinates', function() {
            var mp = new Z.MultiPolygon([]);

            expect(mp.getCoordinates()).to.be.empty();

            var coords = [];
            coords[0] = [
                [
                    {x: 1, y: 2},
                    {x: 3, y: 4},
                    {x: 4, y: 3},
                    {x: 1, y: 2}
                ]
            ];
            coords[1] = [
                [
                    {x: 5, y: 6},
                    {x: 7, y: 8},
                    {x: 6, y: 5},
                    {x: 5, y: 6}
                ]
            ];
            mp.setCoordinates(coords);

            expect(mp.getCoordinates()).to.eql(coords);
        });

    });

    describe('Geometry.Extent', function() {

        it('static.combine', function() {
            var e1 = new Z.Extent(2, 2, 5, 5);
            var e2 = new Z.Extent(3, 3, 6, 6);
            var combined =e1.combine(e2);

            expect(combined.xmin).to.eql(2);
            expect(combined.ymin).to.eql(2);
            expect(combined.xmax).to.eql(6);
            expect(combined.ymax).to.eql(6);
        });

        it('static.expand', function() {
            var extent = new Z.Extent(2, 2, 6, 6);
            var e1 = extent.expand(1);
            var e2 = extent.expand(-2);
            var e3 = extent.expand(-3);

            expect(e1.xmin).to.eql(1);
            expect(e1.ymin).to.eql(1);
            expect(e1.xmax).to.eql(7);
            expect(e1.ymax).to.eql(7);

            expect(e2.xmin).to.eql(4);
            expect(e2.ymin).to.eql(4);
            expect(e2.xmax).to.eql(4);
            expect(e2.ymax).to.eql(4);

            // expect(e3.xmin).to.eql(4);
            // expect(e3.ymin).to.eql(4);
            // expect(e3.xmax).to.eql(4);
            // expect(e3.ymax).to.eql(4);
        });

        it('intersects', function() {
            var e1 = new Z.Extent(1, 1, 5, 5);
            var e2 = new Z.Extent(2, 2, 6, 6);

            expect(e1.intersects(e2)).to.be.ok();
        });

        it('contains');

    });

    describe('Geometry.Edit', function() {

        var layer;

        beforeEach(function () {
            layer = new Z.VectorLayer('svg');
            map.addLayer(layer);
        });

        afterEach(function () {
            map.removeLayer(layer);
        });

        it('edit', function() {
            var geometries = genAllTypeGeometries();
            layer.addGeometry(geometries);

            expect(function () {
                for (var i = 0; i < geometries.length; i++) {
                    var geometry = geometries[i];
                    /*if ((geometry instanceof Z.MultiPoint) ||
                        (geometry instanceof Z.MultiPolyline) ||
                        (geometry instanceof Z.MultiPolygon)) {
                        continue;
                    }*/
                    geometry.startEdit();
                    geometry.endEdit();
                }
            }).to.not.throwException();
        });

        /*it('drag', function() {
            var geometries = genAllTypeGeometries();
            layer.addGeometry(geometries);

            expect(function () {
                for (var i = 0; i < geometries.length; i++) {
                    var geometry = geometries[i];
                    geometry.startDrag();
                }
            }).to.not.throwException();
        });*/

    });

});
