describe("Control.Overview", function() {
    maptalks.control.Overview.prototype.loadDelay = 1;
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
            center: center,
            overviewControl : true
        };
        map = new Z.Map(container, option);
        tile = new Z.TileLayer('tile', {

            urlTemplate:"/resources/tile.png",
            subdomains: [1, 2, 3]
        });

    });

    afterEach(function () {
        removeContainer(container)
    });

    it('default', function () {
        expect(map.overviewControl).to.be.ok();
    });

    it("create", function(done) {
        map.on('baselayerload', function () {
            var overview = new maptalks.control.Overview().addTo(map);
            done();
        })
        map.setBaseLayer(tile);
    });

    it("baseLayer", function (done) {
        var overview = map.overviewControl;
        overview.on('load', function () {
            expect(overview._overview.getBaseLayer()).to.be.ok();
            done();
        });
        map.setBaseLayer(tile);

    });

    it("remove", function (done) {
        var overview = map.overviewControl;

        overview.on('load', function () {
            expect(map.listens('zoomend')).to.be(1);
            expect(map.listens('moveend')).to.be(1);
            overview.remove();
            expect(map.listens('moveend')).to.be(0);
            expect(map.listens('zoomend')).to.be(0);
            done();
        });
        map.setBaseLayer(tile);
    });

    it("move", function (done) {
        var overview = map.overviewControl;
        overview.on('load', function () {
            map.on('moveend', function () {
                expect(overview._overview.getCenter().toArray()).to.be.eql([0, 0]);
                done();
            });
            map.setCenter([0, 0]);
        });

    });

    it("zoom", function (done) {
        var overview = map.overviewControl;

        overview.on('load', function () {
            var zoom = overview._overview.getZoom();
            overview._overview.on('zoomend', function () {
            expect(overview._overview.getZoom()).to.be.eql(zoom + 1);
                done();
            });
            map.zoomIn();
        });

    });
});
