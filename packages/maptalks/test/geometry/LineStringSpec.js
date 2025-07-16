describe('Geometry.LineString', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var layer;

    function getLineCoordinates() {
        return [
            [
                120.61225798855435,
                31.182050959259158
            ],
            [
                120.61296882457759,
                31.180502956281003
            ],
            [
                120.61345348550253,
                31.178719957200855
            ],
            [
                120.61354234000555,
                31.176992212883675
            ],
            [
                120.61343733013837,
                31.175789684232683
            ],
            [
                120.61305767908061,
                31.17428304632554
            ],
            [
                120.61212066795895,
                31.172278766086123
            ],
            [
                120.61136944352529,
                31.170972505445064
            ],
            [
                120.61023049035157,
                31.168712424644156
            ],
            [
                120.60917231399878,
                31.166479937150513
            ],
            [
                120.60837262347263,
                31.164579171038184
            ],
            [
                120.60768602049563,
                31.16311382713033
            ],
            [
                120.60683786387699,
                31.161005627505375
            ],
            [
                120.60644205745484,
                31.160079387264744
            ],
            [
                120.60547273560496,
                31.157950382837186
            ],
            [
                120.6051334729575,
                31.157058675212028
            ]
        ];
    }

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center, null, {
            width: 400,
            height: 300
        });
        container = setups.container;
        map = setups.map;
        layer = new maptalks.VectorLayer('id', { 'drawImmediate': true });
        map.addLayer(layer);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('getCenter', function () {
        var polyline = new maptalks.LineString([
            { x: 0, y: 0 },
            { x: 120, y: 0 }
        ]);
        var got = polyline.getCenter();
        expect(got.x).to.eql(60);
        expect(got.y).to.eql(0);
    });

    it('getCenterInExtent', function () {
        var polyline = new maptalks.LineString([
            { x: 0, y: 0 },
            { x: 120, y: 0 }
        ]);
        var got = polyline.getCenterInExtent(new maptalks.Extent(20, -20, 40, 50));
        expect(got.x).to.eql(30);
        expect(got.y).to.eql(0);
    });

    it('getExtent', function () {
        var polyline = new maptalks.LineString([
            { x: 0, y: 0 },
            { x: 120, y: 10 }
        ]);

        var extent = polyline.getExtent();
        expect(extent.getWidth()).to.be.above(0);
        expect(extent.getHeight()).to.be.above(0);
    });

    it('getSize', function () {
        var polyline = new maptalks.LineString([
            { x: 0, y: 0 },
            { x: 10, y: 10 },
            { x: 20, y: 30 }
        ]);
        layer.addGeometry(polyline);
        var size = polyline.getSize();

        expect(size.width).to.be.above(0);
        expect(size.height).to.be.above(0);
    });


    it('getCoordinates', function () {
        var path = [
            { x: 0, y: 0 },
            { x: 10, y: 10 },
            { x: 20, y: 30 }
        ];
        var polyline = new maptalks.LineString(path);
        layer.addGeometry(polyline);
        var coords = polyline.getCoordinates();

        for (var i = 0; i < coords.length; i++) {
            expect(coords[i]).to.closeTo(path[i]);
        }
        // expect(polyline.getCoordinates()).to.eql(path);
    });

    it('setCoordinates', function () {
        var path = [
            { x: 0, y: 0, z: 0 },
            { x: 10, y: 10, z: 0 },
            { x: 20, y: 30, z: 0 }
        ];
        var polyline = new maptalks.LineString([]);
        layer.addGeometry(polyline);
        polyline.setCoordinates(path);

        expect(polyline.getCoordinates()).to.eql(path);
    });


    describe('creation', function () {
        it('normal constructor', function () {
            var points = [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]];
            var polyline = new maptalks.LineString(points);
            var coordinates = polyline.getCoordinates();
            expect(coordinates).to.have.length(points.length);
            var geojsonCoordinates = maptalks.Coordinate.toNumberArrays(coordinates);
            expect(geojsonCoordinates).to.eql(points);
        });

        it('can be empty.', function () {
            var polyline = new maptalks.LineString();
            expect(polyline.getCoordinates()).to.have.length(0);
        });

    });

    describe('getCenter', function () {
        it('should return center', function () {
            var polyline = new maptalks.LineString([
                { x: 0, y: 0 },
                { x: 0, y: 10 },
                { x: 0, y: 80 }
            ]);
            layer.addGeometry(polyline);

            expect(polyline.getCenter()).to.closeTo(new maptalks.Coordinate(0, 30));
        });
    });

    it('getExtent', function () {
        var polyline = new maptalks.LineString([
            { x: 0, y: 0 },
            { x: 0, y: 10 },
            { x: 0, y: 80 }
        ]);
        // layer.addGeometry(polyline);

        expect(polyline.getExtent().toJSON()).to.eql(new maptalks.Extent(0, 0, 0, 80).toJSON());
    });

    describe('rotate the geometry', function () {
        it('without a pivot', function () {
            var polyline = new maptalks.LineString([
                { x: 0, y: 0 },
                { x: 0, y: 10 },
                { x: 0, y: 80 }
            ]);
            polyline.rotate(20);

            var expected = [[10.796595235854738, 1.80922137642275], [7.350247889302295, 11.206147584281835], [-33.81727811172436, 76.98463103929541]];
            var json = polyline.toGeoJSON().geometry.coordinates;
            expect(json).to.eql(expected);
        });

        it('with a pivot', function () {
            var polyline = new maptalks.LineString([
                { x: 0, y: 0 },
                { x: 0, y: 10 },
                { x: 0, y: 80 }
            ]);
            polyline.rotate(20, [0, 0]);

            var expected = [[0, 0], [-3.4356383421962846, 9.396926207859085], [-42.531359521789, 75.17540966287267]];
            var json = polyline.toGeoJSON().geometry.coordinates;
            console.log(json);
            expect(json).to.eql(expected);
        });
    });

    describe('geometry fires events', function () {
        it('events', function () {
            var points = [
                { x: 0, y: 0 },
                { x: 0, y: 10 },
                { x: 0, y: 80 }
            ];
            var vector = new maptalks.LineString(points);
            new COMMON_GEOEVENTS_TESTOR().testCanvasEvents(vector, map, vector.getCenter());
        });
    });

    it('can have various symbols', function (done) {
        var points = [
            { x: 0, y: 0 },
            { x: 0, y: 10 },
            { x: 0, y: 80 }
        ];
        var vector = new maptalks.LineString(points);
        COMMON_SYMBOL_TESTOR.testGeoSymbols(vector, map, done);
    });

    it('LineString.containsPoint', function () {
        var lineWidth = 8;
        var line = new maptalks.LineString([map.getCenter(), map.getCenter().add(0.1, 0)], {
            symbol: [{
                'lineWidth': lineWidth
            },
            {
                'lineWidth': 4
            }]
        });
        layer.addGeometry(line);
        var cp = map.coordinateToContainerPoint(map.getCenter());
        expect(line.containsPoint(cp)).to.be.ok();
        expect(line.containsPoint(cp.add(-5, 0), 0)).not.to.be.ok();
        // expect(line.containsPoint(cp.add(-lineWidth / 2 - 1, 0))).not.to.be.ok();
        expect(line.containsPoint(cp.add(0, lineWidth / 2 - 1), 0)).to.be.ok();
        expect(line.containsPoint(cp.add(0, lineWidth / 2 + 5), 0)).not.to.be.ok();
    });

    it('containsPoint with lineCap', function () {
        var lineWidth = 8;
        var line = new maptalks.LineString([map.getCenter(), map.getCenter().add(0.1, 0)], {
            symbol: [{
                'lineWidth': lineWidth,
                'lineCap': 'round'
            },
            {
                'lineWidth': 4
            }]
        });
        layer.addGeometry(line);
        var cp = map.coordinateToContainerPoint(map.getCenter());
        expect(line.containsPoint(cp)).to.be.ok();
        expect(line.containsPoint(cp.add(-1, 0), 0)).to.be.ok();
    });

    it('containsPoint with dynamic linewidth', function () {
        var line = new maptalks.LineString([map.getCenter(), map.getCenter().add(0.1, 0)], {
            symbol: {
                'lineWidth': { stops: [[0, 1], [12, 8]] }
            }
        });
        layer.addGeometry(line);
        var cp = map.coordinateToContainerPoint(map.getCenter());
        expect(line.containsPoint(cp)).to.be.ok();
    });

    it('containsPoint with arrow of vertex-first', function () {
        var lineWidth = 8;
        var line = new maptalks.LineString([map.getCenter(), map.getCenter().add(0.1, 0)], {
            enableSimplify: false,
            arrowStyle: 'classic',
            arrowPlacement: 'vertex-first',
            symbol: {
                'lineWidth': lineWidth
            }
        });
        layer.addGeometry(line);
        var cp = map.coordinateToContainerPoint(map.getCenter());
        expect(line.containsPoint(cp.add(-lineWidth / 2, 0))).to.be.ok();
        expect(line.containsPoint(cp.add(lineWidth * 4, lineWidth + 7))).to.be.ok();
        // expect(line.containsPoint(cp.add(lineWidth * 4, lineWidth + 10))).not.to.be.ok();
    });

    it('containsPoint with arrow of point', function () {
        var lineWidth = 8;
        var line = new maptalks.LineString([map.getCenter().substract(0.001, 0), map.getCenter(), map.getCenter().add(0.001, 0)], {
            enableSimplify: false,
            arrowStyle: 'classic',
            arrowPlacement: 'point',
            symbol: {
                'lineWidth': lineWidth
            }
        });
        layer.addGeometry(line);
        var cp = map.coordinateToContainerPoint(map.getCenter());
        expect(line.containsPoint(cp.add(-4 * lineWidth, lineWidth + 7))).to.be.ok();
        expect(line.containsPoint(cp.add(-4 * lineWidth, -lineWidth - 7))).to.be.ok();
    });
    it('bug: create with dynamic textSize', function () {
        // bug desc:
        // when creating a linestring with dynamic textsize, geometry._getPainter() will create a textMarkerSymbolizer.
        // the dynamic textSize in the symbol will read map's zoom, which is still null.
        //
        // fix:
        // forbidden to getPainter when geometry is not added to a map.
        var points = [
            { x: 0, y: 0 },
            { x: 0, y: 10 },
            { x: 0, y: 80 }
        ];
        var symbol = { 'lineWidth': 1, 'lineColor': '#000', 'textName': '{count}', 'textSize': { 'type': 'interval', 'stops': [[0, 0], [16, 5], [17, 10], [18, 20], [19, 40]] } };
        new maptalks.LineString(points, {
            'symbol': symbol,
            'properties': { 'count': 1 }
        });
    });

    it('should get2DLength', function () {
        var line = new maptalks.LineString([map.getCenter(), map.getCenter().add(0.1, 0)]);
        layer.addGeometry(line);
        expect(line._get2DLength()).to.be.above(0);
    });

    //issue #666
    it('arc curve identify', function () {
        var line = new maptalks.ArcCurve([map.getCenter(), map.getCenter().add(0.001, 0)]);
        layer.addGeometry(line);

        expect(layer.identify({ x: 118.84733998413094, y: 32.04636121481619 }).length).to.be.above(0);
    });

    //issue #1595
    it('identify line with dx, dy, #1595', function () {
        var line = new maptalks.LineString([map.getCenter(), map.getCenter().add(0.001, 0)], { symbol: { lineDx: 20, lineDy: 20, lineWidth: 4 } });
        layer.addGeometry(line);

        var point = new maptalks.Point(map.width / 2 + 20, map.height / 2 + 20);
        expect(layer.identifyAtPoint(point).length).to.be.above(0);
    });

    //issue #522
    it('drawn with arrow of vertex-first', function () {
        map.setPitch(60);
        map.setCenterAndZoom([-0.113049, 51.49856], 10);
        layer.config('drawImmediate', true);
        var lineWidth = 8;
        var center = map.getCenter();
        var line = new maptalks.LineString([
            center.sub(0.1, 0),
            center.add(0.1, 0),
            center.add(0.1, -0.1)
        ], {
            arrowStyle: 'classic',
            arrowPlacement: 'vertex-firstlast',
            symbol: {
                'lineWidth': lineWidth
            }
        });
        layer.addGeometry(line);
        var cp = map.coordinateToContainerPoint(map.getCenter());
        expect(layer).to.be.painted(-43, -12);
    });

    describe('smoothness', function () {
        it('draw 2 points with smoothness', function () {
            layer.config('drawImmediate', true);
            var center = map.getCenter();
            var line = new maptalks.LineString([
                center.sub(0.1, 0),
                center.add(0.1, 0)
            ], {
                smoothness: 0.5,
                symbol: {
                    'lineColor': '#000',
                    'lineWidth': 4
                }
            }).addTo(layer);
            expect(layer).to.be.painted();
        });

        it('draw 3 points with smoothness', function () {
            layer.config('drawImmediate', true);
            var center = map.getCenter();
            var line = new maptalks.LineString([
                center.sub(0.001, 0),
                center.add(0.001, 0),
                center.add(0.001, -0.001)
            ], {
                smoothness: 0.5,
                symbol: {
                    'lineColor': '#000',
                    'lineWidth': 8
                }
            }).addTo(layer);
            expect(layer).not.to.be.painted(0, 0);
            expect(layer).to.be.painted(0, -7);
        });
    });

    describe('outline', function () {
        it('display outline', function () {
            layer.config('drawImmediate', true);
            var center = map.getCenter();
            var line = new maptalks.LineString([
                center.sub(0.001, 0),
                center.add(0.001, 0),
                center.add(0.001, -0.001)
            ], {
                symbol: {
                    'lineColor': '#000',
                    'lineWidth': 8
                }
            }).addTo(layer);
            var outline = line.getOutline().updateSymbol({ polygonFill: '#0f0' }).addTo(layer);
            expect(layer).not.to.be.painted(0, -20);
            expect(layer).to.be.painted(0, 10, [0, 255, 0]);
        });
    });

    describe('animateShow', function () {
        it('#animateShow', function (done) {
            layer = new maptalks.VectorLayer('id2');
            var polyline = new maptalks.LineString([
                map.getCenter(),
                map.getCenter().add(0.01, 0.01)
            ], {
                'visible': false,
                'symbol': {
                    'lineColor': '#1bbc9b',
                    'lineWidth': 6,
                    "lineOpacity ": 1,
                    'textName': 'name',
                    'textPlacement': 'vertex-last',
                    'textSize': 14,
                    'textFill': '#0f0',
                }
            });
            layer.once('layerload', function () {
                var geojson = polyline.toGeoJSON();
                expect(layer._getRenderer().isBlank()).to.be.ok();
                polyline.animateShow({
                    'duration': 100,
                    'easing': 'out'
                }, function (frame) {
                    if (frame.state.playState !== 'finished') {
                        expect(polyline.toGeoJSON()).not.to.be.eql(geojson);
                    } else {
                        expect(layer).to.be.painted(0, 0);
                        expect(polyline.toGeoJSON()).to.be.eql(geojson);
                        done();
                    }
                });

            });
            layer.addGeometry(polyline).addTo(map);
        });
        it('#animateShow with smoothness', function (done) {
            layer = new maptalks.VectorLayer('id2', { enableAltitude: true });
            var polyline = new maptalks.LineString([
                map.getCenter(),
                map.getCenter().add(0.01, 0.01),
                map.getCenter().add(0.01, 0),
                map.getCenter().add(0, 0),
            ], {
                'smoothness': 0.1,
                'visible': false,
                'properties': {
                    altitude: 300
                },
                'symbol': {
                    'lineColor': '#1bbc9b',
                    'lineWidth': 6,
                    "lineOpacity ": 1,
                    'textName': 'name',
                    'textPlacement': 'vertex-first',
                    'textSize': 14,
                    'textFill': '#0f0',
                }
            });
            layer.once('layerload', function () {
                var geojson = polyline.toGeoJSON();
                expect(layer._getRenderer().isBlank()).to.be.ok();
                polyline.animateShow({
                    'duration': 100,
                    'easing': 'out'
                }, function (frame) {
                    if (frame.state.playState === 'finished') {
                        expect(layer).to.be.painted(0, 0);
                        expect(polyline.toGeoJSON()).to.be.eql(geojson);
                        done();
                    }
                });

            });
            layer.addGeometry(polyline).addTo(map);
        });
        it('#649 fix infinite loop if removed during animateShow', function (done) {
            layer = new maptalks.VectorLayer('id2', { drawImmediate: true });
            var polyline = new maptalks.LineString([
                map.getCenter(),
                map.getCenter().add(0.01, 0.01)
            ]);
            layer.addGeometry(polyline).addTo(map);
            var geojson = polyline.toGeoJSON();
            polyline.animateShow({
                'duration': 20000,
                'easing': 'out'
            });
            setTimeout(function () {
                polyline.remove();
                setTimeout(function () {
                    done();
                }, 60);
            }, 10);
        });
        it('The current coordinate should be correct', function (done) {
            layer = new maptalks.VectorLayer('animateShow_layer');
            var polyline = new maptalks.LineString([
                map.getCenter(),
                map.getCenter().add(0.05, 0)
            ], {
                'visible': false
            });
            layer.once('layerload', function () {
                expect(layer._getRenderer().isBlank()).to.be.ok();
                polyline.animateShow({
                    'duration': 100,
                    'easing': 'out'
                }, function (frame, curCoord) {
                    if (frame.state.playState !== 'finished') {
                        expect(curCoord.x >= map.getCenter().x && curCoord.x < map.getCenter().x + 0.05).to.be.true;
                        expect(curCoord.y === map.getCenter().y).to.be.true;
                    } else {
                        expect(curCoord.x === map.getCenter().x + 0.05).to.be.true;
                        expect(curCoord.y === map.getCenter().y).to.be.true;
                        done();
                    }
                });
            });
            layer.addGeometry(polyline).addTo(map);
        });

        it('line containerExtent when drawing altitude', function () {
            map.setPitch(60);
            map.setBearing(70);
            layer = new maptalks.VectorLayer('id2', { enableAltitude: true, drawAltitude: true }).addTo(map);
            var polyline = new maptalks.LineString([
                map.getCenter(),
                map.getCenter().add(0.01, 0.01),
                map.getCenter().add(0.01, 0),
                map.getCenter().add(0, 0),
            ], {
                'visible': true,
                'properties': {
                    altitude: 10
                }
            }).addTo(layer);
            var extent = polyline.getContainerExtent().round().toString();
            console.log(extent);
            expect(extent).to.be.eql('-405,-38,320,151');
        });

        it('markerPlacement of vertex-first with LineString of 1 coord', function () {
            var lineWidth = 8;
            var line = new maptalks.LineString([map.getCenter()], {
                symbol: [{
                    'lineColor': '#1bbc9b',
                    'lineWidth': 6,
                    'lineJoin': 'round', //miter, round, bevel
                    'lineCap': 'round', //butt, round, square
                    'lineDasharray': null, //dasharray, e.g. [10, 5, 5]
                    'lineOpacity ': 1
                }, {
                    markerType: 'ellipse',
                    markerPlacement: 'vertex-first',
                }]
            });
            layer.addGeometry(line);
        });

        it('markerPlacement of vertex-last with LineString of 1 coord', function () {
            var lineWidth = 8;
            var line = new maptalks.LineString([map.getCenter()], {
                symbol: [{
                    'lineColor': '#1bbc9b',
                    'lineWidth': 6,
                    'lineJoin': 'round', //miter, round, bevel
                    'lineCap': 'round', //butt, round, square
                    'lineDasharray': null, //dasharray, e.g. [10, 5, 5]
                    'lineOpacity ': 1
                }, {
                    markerType: 'ellipse',
                    markerPlacement: 'vertex-last',
                }]
            });
            layer.addGeometry(line);
        });

        it('fix missing z,the coordinates should carray z', function (done) {
            const c1 = map.getCenter();
            const c2 = c1.add(0.001, 0);
            c1.z = 10;
            c2.z = 20;
            var line = new maptalks.LineString([c1, c2], {
                symbol: [{
                    'lineColor': '#1bbc9b',
                    'lineWidth': 6,
                    'lineJoin': 'round', //miter, round, bevel
                    'lineCap': 'round', //butt, round, square
                    'lineDasharray': null, //dasharray, e.g. [10, 5, 5]
                    'lineOpacity ': 1
                }]
            });
            layer.addGeometry(line);

            setTimeout(() => {
                const player = line.animateShow({ duration: 3000 }, ((frame, current) => {
                    expect(current).to.be.a('object');
                    expect(current.z).to.be.a('number');
                    expect(current.z).to.be.within(10, 20);
                    player.cancel();
                    done();
                }));
            }, 100);
        });
    });

    it('#2167 line draw altitude wall ', function (done) {
        map.setView({
            pitch: 60,
            bearing: 55
        });
        layer.options.enableAltitude = true;
        layer.options.drawAltitude = {
            polygonFill: "#1bbc9b",
            polygonOpacity: 0.3,
            lineWidth: 0,
        }
        const center = map.getCenter();
        const symbol = {
            lineWidth: 0,
            lineColor: 'red'
        };

        let p;
        function getLine() {
            const offset = 0.001;
            function randomOffset() {
                return offset / 2 + offset * Math.random()
            }
            const c1 = center.add(-randomOffset(), 0), c2 = center.add(randomOffset(), 0);
            const p1 = map.coordinateToContainerPoint(c1), p2 = map.coordinateToContainerPoint(c2);
            const pixel = {
                x: p1.x / 2 + p2.x / 2,
                y: p1.y / 2 + p2.y / 2
            };

            const size = map.getSize();
            const cx = size.width / 2, cy = size.height / 2;
            const x = pixel.x - cx, y = pixel.y - cy;
            p = { x: Math.round(x), y: Math.round(y) };

            c1.z = 50 + Math.random() * 10;
            c2.z = 50 + Math.random() * 10;
            const line = new maptalks.LineString([c1, c2], {
                symbol: symbol,
                properties: {
                    altitude: [c1.z, c2.z]
                }
            })
            return line;
        }

        layer.clear();
        const line1 = getLine();
        layer.addGeometry(line1);
        setTimeout(() => {
            expect(layer).to.be.painted(p.x, p.y - 2);
            layer.clear();
            const line2 = getLine();
            //clear properties.altitude
            line2.setProperties({});
            layer.addGeometry(line2);
            setTimeout(() => {
                expect(layer).to.be.painted(p.x, p.y - 2);
                done();
            }, 30);
        }, 30);

    });

    describe('#2440 symbol textPlacement/markerPlacement marker should rotate', function () {
        it('#2440 textPlacement=line ', function (done) {

            layer.clear();
            const line = new maptalks.LineString(getLineCoordinates(), {
                symbol: {
                    lineWidth: 16,
                    lineColor: 'black',
                    textName: '苏州湾大道',
                    // // textPlacement?: 'point' | 'vertex' | 'line' | 'vertex-first' | 'vertex-last';
                    textPlacement: 'line',
                    textFill: 'yellow'
                }
            }).addTo(layer);

            map.setView({
                "center": [120.61702517, 31.17030688], "zoom": 14.838606578929996, "pitch": 0.20000000000003001, "bearing": -3
            });


            setTimeout(() => {
                expect(line._getPainter().symbolizers[0].rotations.length).to.be.above(0);
                done();
            }, 1000);
        });

        it('#2440 markerPlacement=line ', function (done) {
            layer.clear();
            var base64 = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            const line = new maptalks.LineString(getLineCoordinates(), {
                symbol: {
                    lineWidth: 16,
                    lineColor: 'black',
                    markerFile: '/resources/arrow.png',
                    markerPlacement: 'line',
                    markerVerticalAlignment: 'middle'
                }
            }).addTo(layer);
            map.setView({
                "center": [120.61702517, 31.17030688], "zoom": 14.838606578929996, "pitch": 0.20000000000003001, "bearing": -3
            });

            setTimeout(() => {
                expect(line._getPainter().symbolizers[0].rotations.length).to.be.above(0);
                done();
            }, 1000);
        });
    });

    describe('text along path', function () {
        it('#573 text along path ', function (done) {

            layer.clear();
            layer.config({
                collision: true,
                collisionDelay: 0,
            });

            const symbol = {
                lineWidth: 8,
                lineColor: 'black',
                textName: '苏州湾大道',
                // textName: 'Hello World',
                // textPlacement?: 'point' | 'vertex' | 'line' | 'vertex-first' | 'vertex-last';
                textPlacement: 'line',
                textSpacing: 500,
                textFill: 'yellow',
                textFaceName: '微软雅黑',
                textWeight: 'bold',
                textSize: 12,
                textOpacity: 1,
                // textDy: 10,
                textHaloFill: '#000',
                textHaloRadius: 1,
                textHaloOpacity: 1,
                // textAlongDebug: true
            }
            const line = new maptalks.LineString(getLineCoordinates(), {
                symbol: Object.assign({}, symbol)
            }).addTo(layer);

            map.setView({
                "center": getLineCoordinates()[1], "zoom": 18.530837475845765, "pitch": 0, "bearing": 4.499999999999204
            })
            setTimeout(() => {
                expect(layer).to.be.painted(0, 0);
                done();
            }, 1000);
        });


    });

});
