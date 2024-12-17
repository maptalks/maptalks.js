describe('TileLayer with Offset Specs', function () {

    var map, container;
    var center = new maptalks.Coordinate(121.49867630004883, 31.25405711739208);

    function createMap(zoom, bearing, pitch) {
        container = document.createElement('div');
        container.style.width = '1000px';
        container.style.height = '1500px';
        document.body.appendChild(container);
        var option = {
            zoom: zoom,
            pitch: pitch,
            center: center,
            bearing: bearing
        };
        map = new maptalks.Map(container, option);
    }

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '1000px';
        container.style.height = '1000px';
        document.body.appendChild(container);
    });

    afterEach(function () {
        if (map) {
            map.remove();
        }
        REMOVE_CONTAINER(container);
    });

    it('tiles with dynamic offset', function () {
        createMap(16, 80, 1);
        var tile = new maptalks.TileLayer('tile', {
            offset: function (z) {
                //实时计算wgs84和gcj02瓦片的偏移量
                var center = map.getCenter();
                var c = maptalks.CRSTransform.transform(center.toArray(), 'WGS84', 'GCJ02');
                var offset = map.coordToPoint(center, z).sub(map.coordToPoint(new maptalks.Coordinate(c), z));
                return offset._round().toArray();
            },
            renderer: 'canvas',
            urlTemplate: '#'
        }).addTo(map);
        var tiles = tile.getTiles();
        expect(tiles.tileGrids.length).to.be.eql(1);
        expect(tiles.tileGrids[0].tiles.length).to.be.eql(37);
        expect(tile._getTileOffset(tiles.tileGrids[0].tiles[0].z)).to.be.eql([-207, 109]);
        // console.log(tiles.tileGrids[0].tiles[0]);

    });
    it('#1824 tiles with offset Array', function (done) {
        createMap(16, 0, 0);
        var tile = new maptalks.TileLayer('tile', {
            offset: [100, 100],
            renderer: 'canvas',
            urlTemplate: '/resources/tile-green-256.png'
        }).addTo(map);

        setTimeout(() => {
            expect(tile).to.be.painted(0, 0);
            done();
        }, 500);

    });
    it('#1824 tiles with offset Number', function (done) {
        createMap(16, 0, 0);
        var tile = new maptalks.TileLayer('tile', {
            offset: 100,
            renderer: 'canvas',
            urlTemplate: '/resources/tile-green-256.png'
        }).addTo(map);

        setTimeout(() => {
            expect(tile).to.be.painted(0, 0);
            done();
        }, 500);

    });

    it('#2421 _getTileBBox Consider offset', function (done) {
        createMap(16, 0, 0);

        map.setView({
            "center": [110.32920106, 25.27279731], "zoom": 16.305775789479334, "pitch": 46.800000000000104, "bearing": 1.2000000000000455
        });

        //is WGS84
        const shield = {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [
                            110.32250576374257,
                            25.28102209831316
                        ],
                        [
                            110.32409363147939,
                            25.281953416813796
                        ],
                        [
                            110.32559566852773,
                            25.282651900997177
                        ],
                        [
                            110.32790840417357,
                            25.283212444189076
                        ],
                        [
                            110.32966793328734,
                            25.28375570437403
                        ],
                        [
                            110.33138454705687,
                            25.28379450857985
                        ],
                        [
                            110.3325432613513,
                            25.282785595194014
                        ],
                        [
                            110.33373821077467,
                            25.280502147206814
                        ],
                        [
                            110.33429611024978,
                            25.279570817564924
                        ],
                        [
                            110.33505172194086,
                            25.277973332578497
                        ],
                        [
                            110.33593167510243,
                            25.27676999761006
                        ],
                        [
                            110.33670415129872,
                            25.274829659771175
                        ],
                        [
                            110.33773411956044,
                            25.274247552369303
                        ],
                        [
                            110.33884991851065,
                            25.272734060056557
                        ],
                        [
                            110.33940781798573,
                            25.271569822356483
                        ],
                        [
                            110.33968999753338,
                            25.269847624923436
                        ],
                        [
                            110.33850982556683,
                            25.269847624923436
                        ],
                        [
                            110.33681466946942,
                            25.270196902362258
                        ],
                        [
                            110.33522164876206,
                            25.27070742845115
                        ],
                        [
                            110.33211028630478,
                            25.271211936410623
                        ],
                        [
                            110.33122593468767,
                            25.27160278339744
                        ],
                        [
                            110.33023115394707,
                            25.271581310042173
                        ],
                        [
                            110.32855745552179,
                            25.27165892622897
                        ],
                        [
                            110.32819267509575,
                            25.27086335796126
                        ],
                        [
                            110.3277088968281,
                            25.270124814946108
                        ],
                        [
                            110.32674330158272,
                            25.268456034898886
                        ],
                        [
                            110.32597853083944,
                            25.26743455749359
                        ],
                        [
                            110.32544037140936,
                            25.266171432216623
                        ],
                        [
                            110.32434603013128,
                            25.265705713297294
                        ],
                        [
                            110.32340189255804,
                            25.265977382884028
                        ],
                        [
                            110.32342335023016,
                            25.26672670329696
                        ],
                        [
                            110.32367997454732,
                            25.269072049176387
                        ],
                        [
                            110.3236585168752,
                            25.271893599759114
                        ],
                        [
                            110.32360967234699,
                            25.27387151593713
                        ],
                        [
                            110.32334962566374,
                            25.27587146624989
                        ],
                        [
                            110.32338824947355,
                            25.27749357688312
                        ],
                        [
                            110.32225099285124,
                            25.27999655193813
                        ],
                        [
                            110.32235828121183,
                            25.280889073188973
                        ],
                        [
                            110.32250576374257,
                            25.28102209831316
                        ]
                    ]
                ]
            },
            "id": "shield",
            "properties": null
        };
        const mask = new maptalks.GeoJSON.toGeometry(shield);

        function offset(z) {
            const map = this.getMap();
            const center = map.getCenter();
            const c = maptalks.CRSTransform.transform(center.toArray(), "GCJ02", "WGS84");
            const offset = map
                .coordToPoint(center, z)
                .sub(map.coordToPoint(new maptalks.Coordinate(c), z));
            return offset._round().toArray();
        }


        var tileLayer = new maptalks.TileLayer('tile', {
            offset,
            renderer: 'canvas',
            urlTemplate: '/resources/tile-green-256.png'
        }).addTo(map);

        tileLayer.setMask(mask);

        setTimeout(() => {
            expect(tileLayer.getTiles().count).to.be.equal(16);
            done();
        }, 500);

    });
});
