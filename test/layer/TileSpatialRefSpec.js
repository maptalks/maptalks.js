describe('TileSpatialRefSpec', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    function createMap(center, zoom, spatialRef) {
        container = document.createElement('div');
        container.style.width = '512px';
        container.style.height = '512px';
        document.body.appendChild(container);
        var option = {
            center: center,
            zoom: zoom,
            spatialReference: spatialRef
        };
        map = new maptalks.Map(container, option);
    }

    afterEach(function () {
        if (map) {
            map.remove();
        }
        REMOVE_CONTAINER(container);
    });

    it('tilelayer with none pyramid spatialReference', function () {
        createMap([0, 0], 0, { projection: 'EPSG:4326' });
        var earchRadiusInMeters = 6378137;
        function getMeterPerMapUnit(mapUnit) {
            var meterPerMapUnit = 1;
            if (mapUnit === "meter") {
                meterPerMapUnit = 1;
            } else if (mapUnit === "degrees") {
                // 每度表示多少米。
                meterPerMapUnit = (Math.PI * 2 * earchRadiusInMeters) / 360;
            } else if (mapUnit === "kilometer") {
                meterPerMapUnit = 1.0e-3;
            } else if (mapUnit === "inch") {
                meterPerMapUnit = 1 / 2.5399999918e-2;
            } else if (mapUnit === "feet") {
                meterPerMapUnit = 0.3048;
            }
            return meterPerMapUnit;
        }

        var scaleDenominators =
            [
                591657527,
                295828763.5,
                147914381.75,
                73957190.875,
                36978595.4375,
                18489297.71875,
                11555811.0742188,
                9244648.859375,
                6933486.64453125,
                5777905.53710938,
                5200114.98339844,
                4622324.4296875,
                3466743.32226563,
                2311162.21484375,
                1155581.10742188,
                577790.55371094,
                288895.27685547,
                144447.638427735,
                72223.8192138675,
                36111.9096069337,
                18055.9548034669,
                9027.97740173345,
                4513.98870086672,
                2256.99435043336
            ];

        var scales = scaleDenominators.map(function (s) {
            return 1 / s;
        });
        var _scales = scales.map(function (s) {
            var a = getMeterPerMapUnit("degrees") || 1;
            return 1 / (0.0254 / (96 * s) / a);
        });

        var resolutions = _scales.map(function (s) {
            return 1 / s;
        });

        var crs = {
            projection: "EPSG:4326",
            resolutions: resolutions,
            fullExtent: {
                top: 90.0,
                left: -180.0,
                bottom: -90.0,
                right: 180.0
            }
        };
        var tileLayer = new maptalks.TileLayer('tile', {
            renderer : 'canvas',
            spatialReference: crs,
            urlTemplate : '#',
            placeholder : true,
            pyramidMode: 1,
            repeatWorld: true
        }).addTo(map);
        expect(tileLayer.getSpatialReference().isPyramid()).not.to.be.ok();
    });


    it('tilelayer with baidu projection on zoom 0', function () {
        createMap([0, 0], 0, { projection: 'baidu' });
        var tileLayer = new maptalks.TileLayer('tile', {
            renderer : 'canvas',
            urlTemplate : '#',
            placeholder : true,
            pyramidMode: 1,
            repeatWorld: true
        }).addTo(map);
        var tileGrid = tileLayer.getTiles().tileGrids[0];
        var tiles = tileGrid.tiles;
        var extent = tileGrid.extent;
        expect(extent.toJSON()).to.be.eql({ xmin: -256, ymin: -256, xmax: 256, ymax: 512 });
        var expected = '-1,-1,0,{"xmin":-256,"ymin":-256,"xmax":0,"ymax":0}|-1,0,0,{"xmin":-256,"ymin":0,"xmax":0,"ymax":256}|-1,1,0,{"xmin":-256,"ymin":256,"xmax":0,"ymax":512}|0,-1,0,{"xmin":0,"ymin":-256,"xmax":256,"ymax":0}|0,0,0,{"xmin":0,"ymin":0,"xmax":256,"ymax":256}|0,1,0,{"xmin":0,"ymin":256,"xmax":256,"ymax":512}';
        var actual = tiles.map(function (t) {
            return [t.idx, t.idy, t.z, JSON.stringify(t.extent2d.toJSON())].join();
        }).sort().join('|');
        expect(actual).to.be.eql(expected);
    });

     it('tilelayer with baidu projection on zoom 3', function () {
        createMap([0, 0], 3, { projection: 'baidu' });
        var tileLayer = new maptalks.TileLayer('tile', {
            renderer : 'canvas',
            urlTemplate : '#',
            placeholder : true,
            pyramidMode: 1,
            repeatWorld: true
        }).addTo(map);
        var tileGrid = tileLayer.getTiles().tileGrids[0];
        var tiles = tileGrid.tiles;
        var extent = tileGrid.extent;
        expect(extent.toJSON()).to.be.eql({ xmin: -512, ymin: -256, xmax: 256, ymax: 512 });
        var expected = '-1,-1,3,{"xmin":-256,"ymin":-256,"xmax":0,"ymax":0}|-1,0,3,{"xmin":-256,"ymin":0,"xmax":0,"ymax":256}|-1,1,3,{"xmin":-256,"ymin":256,"xmax":0,"ymax":512}|-2,-1,3,{"xmin":-512,"ymin":-256,"xmax":-256,"ymax":0}|-2,0,3,{"xmin":-512,"ymin":0,"xmax":-256,"ymax":256}|-2,1,3,{"xmin":-512,"ymin":256,"xmax":-256,"ymax":512}|0,-1,3,{"xmin":0,"ymin":-256,"xmax":256,"ymax":0}|0,0,3,{"xmin":0,"ymin":0,"xmax":256,"ymax":256}|0,1,3,{"xmin":0,"ymin":256,"xmax":256,"ymax":512}';
        var actual = tiles.map(function (t) {
            return [t.idx, t.idy, t.z, JSON.stringify(t.extent2d.toJSON())].join();
        }).sort().join('|');
        expect(actual).to.be.eql(expected);
    });

    it('tilelayer with baidu projection without pyramidMode on zoom 0', function () {
        createMap([0, 0], 0, { projection: 'baidu' });
        var tileLayer = new maptalks.TileLayer('tile', {
            renderer : 'canvas',
            urlTemplate : '#',
            placeholder : true,
            pyramidMode: 0,
            repeatWorld: true
        }).addTo(map);
        var tileGrid = tileLayer.getTiles().tileGrids[0];
        var tiles = tileGrid.tiles;
        var extent = tileGrid.extent;
        expect(extent.toJSON()).to.be.eql({ xmin: -256, ymin: -256, xmax: 256, ymax: 512 });
        var expected = '-1,-1,0,{"xmin":-256,"ymin":-256,"xmax":0,"ymax":0}|-1,0,0,{"xmin":-256,"ymin":0,"xmax":0,"ymax":256}|-1,1,0,{"xmin":-256,"ymin":256,"xmax":0,"ymax":512}|0,-1,0,{"xmin":0,"ymin":-256,"xmax":256,"ymax":0}|0,0,0,{"xmin":0,"ymin":0,"xmax":256,"ymax":256}|0,1,0,{"xmin":0,"ymin":256,"xmax":256,"ymax":512}';
        var actual = tiles.map(function (t) {
            return [t.idx, t.idy, t.z, JSON.stringify(t.extent2d.toJSON())].join();
        }).sort().join('|');
        expect(actual).to.be.eql(expected);
    });

    it('tilelayer with EPSG:3857 projection on zoom 0', function () {
        createMap([0, 0], 0, { projection: 'EPSG:3857' });
        var tileLayer = new maptalks.TileLayer('tile', {
            renderer : 'canvas',
            urlTemplate : '#',
            placeholder : true,
            pyramidMode: 1,
            repeatWorld: true
        }).addTo(map);
        var tileGrid = tileLayer.getTiles().tileGrids[0];
        var tiles = tileGrid.tiles;
        var extent = tileGrid.extent;
        expect(extent.toJSON()).to.be.eql({xmin: -384, ymin: -384, xmax: 384, ymax: 384});
        var expected = '-1,-1,0,{"xmin":-384,"ymin":128,"xmax":-128,"ymax":384}|-1,0,0,{"xmin":-384,"ymin":-128,"xmax":-128,"ymax":128}|-1,1,0,{"xmin":-384,"ymin":-384,"xmax":-128,"ymax":-128}|0,-1,0,{"xmin":-128,"ymin":128,"xmax":128,"ymax":384}|0,0,0,{"xmin":-128,"ymin":-128,"xmax":128,"ymax":128}|0,1,0,{"xmin":-128,"ymin":-384,"xmax":128,"ymax":-128}|1,-1,0,{"xmin":128,"ymin":128,"xmax":384,"ymax":384}|1,0,0,{"xmin":128,"ymin":-128,"xmax":384,"ymax":128}|1,1,0,{"xmin":128,"ymin":-384,"xmax":384,"ymax":-128}';
        var actual = tiles.map(function (t) {
            return [t.idx, t.idy, t.z, JSON.stringify(t.extent2d.toJSON())].join();
        }).sort().join('|');
        expect(actual).to.be.eql(expected);
    });

     it('tilelayer with EPSG:3857 projection on zoom 3', function () {
        createMap([0, 0], 3, { projection: 'EPSG:3857' });
        var tileLayer = new maptalks.TileLayer('tile', {
            renderer : 'canvas',
            urlTemplate : '#',
            placeholder : true,
            pyramidMode: 1,
            repeatWorld: true
        }).addTo(map);
        var tileGrid = tileLayer.getTiles().tileGrids[0];
        var tiles = tileGrid.tiles;
        var extent = tileGrid.extent;
        expect(extent.toJSON()).to.be.eql({xmin: -512, ymin: -512, xmax: 512, ymax: 512});
        var expected = '2,2,3,{"xmin":-512,"ymin":256,"xmax":-256,"ymax":512}|2,3,3,{"xmin":-512,"ymin":0,"xmax":-256,"ymax":256}|2,4,3,{"xmin":-512,"ymin":-256,"xmax":-256,"ymax":0}|2,5,3,{"xmin":-512,"ymin":-512,"xmax":-256,"ymax":-256}|3,2,3,{"xmin":-256,"ymin":256,"xmax":0,"ymax":512}|3,3,3,{"xmin":-256,"ymin":0,"xmax":0,"ymax":256}|3,4,3,{"xmin":-256,"ymin":-256,"xmax":0,"ymax":0}|3,5,3,{"xmin":-256,"ymin":-512,"xmax":0,"ymax":-256}|4,2,3,{"xmin":0,"ymin":256,"xmax":256,"ymax":512}|4,3,3,{"xmin":0,"ymin":0,"xmax":256,"ymax":256}|4,4,3,{"xmin":0,"ymin":-256,"xmax":256,"ymax":0}|4,5,3,{"xmin":0,"ymin":-512,"xmax":256,"ymax":-256}|5,2,3,{"xmin":256,"ymin":256,"xmax":512,"ymax":512}|5,3,3,{"xmin":256,"ymin":0,"xmax":512,"ymax":256}|5,4,3,{"xmin":256,"ymin":-256,"xmax":512,"ymax":0}|5,5,3,{"xmin":256,"ymin":-512,"xmax":512,"ymax":-256}';
        var actual = tiles.map(function (t) {
            return [t.idx, t.idy, t.z, JSON.stringify(t.extent2d.toJSON())].join();
        }).sort().join('|');
        expect(actual).to.be.eql(expected);
    });

    it('tilelayer with EPSG:3857 projection without pyramidMode on zoom 0', function () {
        createMap([0, 0], 0, { projection: 'EPSG:3857' });
        var tileLayer = new maptalks.TileLayer('tile', {
            renderer : 'canvas',
            urlTemplate : '#',
            placeholder : true,
            pyramidMode: 0,
            repeatWorld: true
        }).addTo(map);
        var tileGrid = tileLayer.getTiles().tileGrids[0];
        var tiles = tileGrid.tiles;
        var extent = tileGrid.extent;
        expect(extent.toJSON()).to.be.eql({xmin: -384, ymin: -384, xmax: 384, ymax: 384});
        var expected = '-1,-1,0,{"xmin":-384,"ymin":128,"xmax":-128,"ymax":384}|-1,0,0,{"xmin":-384,"ymin":-128,"xmax":-128,"ymax":128}|-1,1,0,{"xmin":-384,"ymin":-384,"xmax":-128,"ymax":-128}|0,-1,0,{"xmin":-128,"ymin":128,"xmax":128,"ymax":384}|0,0,0,{"xmin":-128,"ymin":-128,"xmax":128,"ymax":128}|0,1,0,{"xmin":-128,"ymin":-384,"xmax":128,"ymax":-128}|1,-1,0,{"xmin":128,"ymin":128,"xmax":384,"ymax":384}|1,0,0,{"xmin":128,"ymin":-128,"xmax":384,"ymax":128}|1,1,0,{"xmin":128,"ymin":-384,"xmax":384,"ymax":-128}';
        var actual = tiles.map(function (t) {
            return [t.idx, t.idy, t.z, JSON.stringify(t.extent2d.toJSON())].join();
        }).sort().join('|');
        expect(actual).to.be.eql(expected);
    });

    it('tilelayer with custom spatialRef without fullExtent', function () {
        var firstRes = 0.009507170090264933;
        var res = [];
        for (var i = 0; i <= 5; i++) {
          res.push(firstRes / Math.pow(2, i));
        }
        var crs = {
          projection: "EPSG:4326",
          resolutions: res,
          // fullExtent: {
          //   top: 42.31,
          //   left: 114.59,
          //   bottom: 37.44232891378436,
          //   right:  119.45767108621564
          // }
        };
        createMap([114.59, 42.31], 0, crs);
        var tileLayer = new maptalks.TileLayer("base", {
          urlTemplate: '#',
          // repeatWorld:true,
          spatialReference: crs,
          tileSystem: [1, -1, 114.59, 42.31]
        }).addTo(map);
        var tileGrid = tileLayer.getTiles().tileGrids[0];
        var tiles = tileGrid.tiles;
        var extent = tileGrid.extent;
        expect(extent.toJSON()).to.be.eql({ xmin: 11797.008299213752, ymin: 4194.32534374495, xmax: 12565.008299213752, ymax: 4706.32534374495 });
        var expected = '-1,-1,0,{"xmin":11797.008299213752,"ymin":4450.32534374495,"xmax":12053.008299213752,"ymax":4706.32534374495}|-1,0,0,{"xmin":11797.008299213752,"ymin":4194.32534374495,"xmax":12053.008299213752,"ymax":4450.32534374495}|0,-1,0,{"xmin":12053.008299213752,"ymin":4450.32534374495,"xmax":12309.008299213752,"ymax":4706.32534374495}|0,0,0,{"xmin":12053.008299213752,"ymin":4194.32534374495,"xmax":12309.008299213752,"ymax":4450.32534374495}|1,-1,0,{"xmin":12309.008299213752,"ymin":4450.32534374495,"xmax":12565.008299213752,"ymax":4706.32534374495}|1,0,0,{"xmin":12309.008299213752,"ymin":4194.32534374495,"xmax":12565.008299213752,"ymax":4450.32534374495}';
        var actual = tiles.map(function (t) {
            return [t.idx, t.idy, t.z, JSON.stringify(t.extent2d.toJSON())].join();
        }).sort().join('|');
        if (!maptalks.Browser.ie) {
            expect(actual).to.be.eql(expected);
        }
    });

    it('tilelayer with custom spatialRef with fullExtent', function () {
        var firstRes = 0.009507170090264933;
        var res = [];
        for (var i = 0; i <= 5; i++) {
          res.push(firstRes / Math.pow(2, i));
        }
        var crs = {
          projection: "EPSG:4326",
          resolutions: res,
          fullExtent: {
            top: 42.31,
            left: 114.59,
            bottom: 37.44232891378436,
            right:  119.45767108621564
          }
        };
        createMap([114.59, 42.31], 0, crs);
        var tileLayer = new maptalks.TileLayer("base", {
          debug: true,
          urlTemplate: '#',
          // repeatWorld:true,
          spatialReference: crs,
          tileSystem: [1, -1, 114.59, 42.31]
        }).addTo(map);
        var tileGrid = tileLayer.getTiles().tileGrids[0];
        var tiles = tileGrid.tiles;
        var extent = tileGrid.extent;
        expect(extent.toJSON()).to.be.eql({ xmin: 11797.008299213752, ymin: 3938.3253437449503, xmax: 12309.008299213752, ymax: 4706.32534374495 });
        var expected = '-1,-1,0,{"xmin":11797.008299213752,"ymin":4450.32534374495,"xmax":12053.008299213752,"ymax":4706.32534374495}|-1,0,0,{"xmin":11797.008299213752,"ymin":4194.32534374495,"xmax":12053.008299213752,"ymax":4450.32534374495}|-1,1,0,{"xmin":11797.008299213752,"ymin":3938.3253437449503,"xmax":12053.008299213752,"ymax":4194.32534374495}|0,-1,0,{"xmin":12053.008299213752,"ymin":4450.32534374495,"xmax":12309.008299213752,"ymax":4706.32534374495}|0,0,0,{"xmin":12053.008299213752,"ymin":4194.32534374495,"xmax":12309.008299213752,"ymax":4450.32534374495}|0,1,0,{"xmin":12053.008299213752,"ymin":3938.3253437449503,"xmax":12309.008299213752,"ymax":4194.32534374495}';
        var actual = tiles.map(function (t) {
            return [t.idx, t.idy, t.z, JSON.stringify(t.extent2d.toJSON())].join();
        }).sort().join('|');
        if (!maptalks.Browser.ie) {
            expect(actual).to.be.eql(expected);
        }

    });

    it('tilelayer with custom spatialRef with fullExtent and no repeatWorld', function () {
        var firstRes = 0.009507170090264933;
        var res = [];
        for (var i = 0; i <= 5; i++) {
          res.push(firstRes / Math.pow(2, i));
        }
        var crs = {
          projection: "EPSG:4326",
          resolutions: res,
          fullExtent: {
            top: 42.31,
            left: 114.59,
            bottom: 37.44232891378454,
            right:  119.45767108621599
          }
        };
        createMap([114.59, 42.31], 0, crs);
        var tileLayer = new maptalks.TileLayer("base", {
          urlTemplate: '#',
          repeatWorld: false,
          spatialReference: crs,
          tileSystem: [1, -1, 114.59, 42.31]
        }).addTo(map);
        var tileGrid = tileLayer.getTiles().tileGrids[0];
        var tiles = tileGrid.tiles;
        var extent = tileGrid.extent;
        expect(extent.toJSON()).to.be.eql({ xmin: 12053.008299213752, ymin: 3938.3253437449507, xmax: 12565.008299213754, ymax: 4450.32534374495 });
        var expected =  '0,0,0,{"xmin":12053.008299213752,"ymin":4194.32534374495,"xmax":12309.008299213752,"ymax":4450.32534374495}|0,1,0,{"xmin":12053.008299213752,"ymin":3938.3253437449507,"xmax":12309.008299213752,"ymax":4194.32534374495}|1,0,0,{"xmin":12309.008299213752,"ymin":4194.32534374495,"xmax":12565.008299213754,"ymax":4450.32534374495}|1,1,0,{"xmin":12309.008299213752,"ymin":3938.3253437449507,"xmax":12565.008299213754,"ymax":4194.32534374495}';
        var actual = tiles.map(function (t) {
            return [t.idx, t.idy, t.z, JSON.stringify(t.extent2d.toJSON())].join();
        }).sort().join('|');
        if (!maptalks.Browser.ie) {
            expect(actual).to.be.eql(expected);
        }

    });

    it('tilelayer with custom spatialRef with fullExtent in getCascadedTiles', function () {
        var firstRes = 0.009507170090264933;
        var res = [];
        for (var i = 0; i <= 5; i++) {
          res.push(firstRes / Math.pow(2, i));
        }
        var crs = {
          projection: "EPSG:4326",
          resolutions: res,
          fullExtent: {
            top: 42.31,
            left: 114.59,
            bottom: 37.44232891378436,
            right:  119.45767108621564
          }
        };
        createMap([114.59, 42.31], 0, crs);
        var tileLayer = new maptalks.TileLayer("base", {
          urlTemplate: '#',
          // repeatWorld:true,
          debug: true,
          spatialReference: crs,
          pyramidMode: 0,
          tileSystem: [1, -1, 114.59, 42.31]
        }).addTo(map);
        var tileGrid = tileLayer.getTiles().tileGrids[0];
        var tiles = tileGrid.tiles;
        var extent = tileGrid.extent;
        expect(extent.toJSON()).to.be.eql({ xmin: 11797.008299213752, ymin: 3938.3253437449503, xmax: 12309.008299213752, ymax: 4706.32534374495 });
        var expected = '-1,-1,0,{"xmin":11797.008299213752,"ymin":4450.32534374495,"xmax":12053.008299213752,"ymax":4706.32534374495}|-1,0,0,{"xmin":11797.008299213752,"ymin":4194.32534374495,"xmax":12053.008299213752,"ymax":4450.32534374495}|-1,1,0,{"xmin":11797.008299213752,"ymin":3938.3253437449503,"xmax":12053.008299213752,"ymax":4194.32534374495}|0,-1,0,{"xmin":12053.008299213752,"ymin":4450.32534374495,"xmax":12309.008299213752,"ymax":4706.32534374495}|0,0,0,{"xmin":12053.008299213752,"ymin":4194.32534374495,"xmax":12309.008299213752,"ymax":4450.32534374495}|0,1,0,{"xmin":12053.008299213752,"ymin":3938.3253437449503,"xmax":12309.008299213752,"ymax":4194.32534374495}';
        var actual = tiles.map(function (t) {
            return [t.idx, t.idy, t.z, JSON.stringify(t.extent2d.toJSON())].join();
        }).sort().join('|');
        if (!maptalks.Browser.ie) {
            expect(actual).to.be.eql(expected);
        }
    });

    it('tilelayer with 3857 in map of 4326', function () {
        var crs = {
          projection: "EPSG:4326"
        };
        createMap([121.47791752169039,31.18614357868957], 17, crs);
        var tileLayer = new maptalks.TileLayer("base", {
          urlTemplate: '#',
          // repeatWorld:true,
          spatialReference:{
            projection:'EPSG:3857'
          }
        }).addTo(map);
        var tileGrid = tileLayer.getTiles().tileGrids[0];
        var tiles = tileGrid.tiles;
        var extent = tileGrid.extent;
        expect(extent.toJSON()).to.be.eql({ xmin: 11322112, ymin: 2906396.2408107626, xmax: 11322880, ymax: 2907054.2476699273 });
        var expected = '109763,53574,17,{"xmin":11322112,"ymin":2906834.2476699273,"xmax":11322368,"ymax":2907054.2476699273}|109763,53575,17,{"xmin":11322112,"ymin":2906615.2469585394,"xmax":11322368,"ymax":2906835.2469585394}|109763,53576,17,{"xmin":11322112,"ymin":2906396.2408107626,"xmax":11322368,"ymax":2906616.2408107626}|109764,53574,17,{"xmin":11322368,"ymin":2906834.2476699273,"xmax":11322624,"ymax":2907054.2476699273}|109764,53575,17,{"xmin":11322368,"ymin":2906615.2469585394,"xmax":11322624,"ymax":2906835.2469585394}|109764,53576,17,{"xmin":11322368,"ymin":2906396.2408107626,"xmax":11322624,"ymax":2906616.2408107626}|109765,53574,17,{"xmin":11322624,"ymin":2906834.2476699273,"xmax":11322880,"ymax":2907054.2476699273}|109765,53575,17,{"xmin":11322624,"ymin":2906615.2469585394,"xmax":11322880,"ymax":2906835.2469585394}|109765,53576,17,{"xmin":11322624,"ymin":2906396.2408107626,"xmax":11322880,"ymax":2906616.2408107626}';
        var actual = tiles.map(function (t) {
            return [t.idx, t.idy, t.z, JSON.stringify(t.extent2d.toJSON())].join();
        }).sort().join('|');
        if (!maptalks.Browser.ie) {
            expect(actual).to.be.eql(expected);
        }
    });

    it('tilelayer with 3857 in map of 4326, #1802', function () {
        var crs = {
          projection: "EPSG:4326"
        };
        createMap([121.47791752169039,31.18614357868957], 17.1, crs);
        var tileLayer = new maptalks.TileLayer("base", {
          urlTemplate: '#',
          // repeatWorld:true,
          spatialReference:{
            projection:'EPSG:3857'
          }
        }).addTo(map);
        var tileGrid = tileLayer.getTiles().tileGrids[0];
        var tiles = tileGrid.tiles;
        var extent = tileGrid.extent;
        expect(extent.toJSON()).to.be.eql({ xmin: 11322112, ymin: 2906396.2408107626, xmax: 11322880, ymax: 2907054.2476699273 });
        var expected = '109763,53574,17,{"xmin":11322112,"ymin":2906834.2476699273,"xmax":11322368,"ymax":2907054.2476699273},0.000010728836059570312|109763,53575,17,{"xmin":11322112,"ymin":2906615.2469585394,"xmax":11322368,"ymax":2906835.2469585394},0.000010728836059570312|109763,53576,17,{"xmin":11322112,"ymin":2906396.2408107626,"xmax":11322368,"ymax":2906616.2408107626},0.000010728836059570312|109764,53574,17,{"xmin":11322368,"ymin":2906834.2476699273,"xmax":11322624,"ymax":2907054.2476699273},0.000010728836059570312|109764,53575,17,{"xmin":11322368,"ymin":2906615.2469585394,"xmax":11322624,"ymax":2906835.2469585394},0.000010728836059570312|109764,53576,17,{"xmin":11322368,"ymin":2906396.2408107626,"xmax":11322624,"ymax":2906616.2408107626},0.000010728836059570312|109765,53574,17,{"xmin":11322624,"ymin":2906834.2476699273,"xmax":11322880,"ymax":2907054.2476699273},0.000010728836059570312|109765,53575,17,{"xmin":11322624,"ymin":2906615.2469585394,"xmax":11322880,"ymax":2906835.2469585394},0.000010728836059570312|109765,53576,17,{"xmin":11322624,"ymin":2906396.2408107626,"xmax":11322880,"ymax":2906616.2408107626},0.000010728836059570312';
        var actual = tiles.map(function (t) {
            return [t.idx, t.idy, t.z, JSON.stringify(t.extent2d.toJSON()), t.res].join();
        }).sort().join('|');
        if (!maptalks.Browser.ie) {
            expect(actual).to.be.eql(expected);
        }
    });
});
