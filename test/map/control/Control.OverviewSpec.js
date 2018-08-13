describe('Control.Overview', function () {
    var container;
    var map;
    var tile;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '50px';
        container.style.height = '50px';
        document.body.appendChild(container);
        var option = {
            zoom: 17,
            zoomAnimationDuration : 20,
            center: center,
            overviewControl : true
        };
        map = new maptalks.Map(container, option);
        tile = new maptalks.TileLayer('tile', {
            renderer : 'canvas',
            fadeAnimation : false,
            urlTemplate : '#'
        });

    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('default', function () {
        expect(map.overviewControl).to.be.ok();
    });
    /*
    it('create', function (done) {
        map.on('baselayerload', function () {
            new maptalks.control.Overview().addTo(map);
            done();
        });
        map.setBaseLayer(tile);
    }); */

    it('baseLayer', function () {
        var overview = new maptalks.control.Overview();
        map.setBaseLayer(tile);
        overview.addTo(map);
        expect(overview._overview.getBaseLayer()).to.be.ok();
    });

    it('baseLayer with customized getTileUrl method', function () {
        var fn = function () { return '' };
        tile.getTileUrl = fn;
        var overview = new maptalks.control.Overview();
        map.setBaseLayer(tile);
        overview.addTo(map);
        var overviewBaseLayer = overview._overview.getBaseLayer();
        expect(overviewBaseLayer.getTileUrl === fn).to.be.ok();
    });

    it('remove', function () {
        var overview = new maptalks.control.Overview();
        overview.addTo(map);
        expect(map.listens('viewchange')).to.be(2);
        overview.remove();
        expect(map.listens('viewchange')).to.be(1);
        map.setBaseLayer(tile);
    });

    it('move', function (done) {
        var overview = new maptalks.control.Overview();
        overview.addTo(map);
        map.on('viewchange', function () {
            expect(overview._overview.getCenter().toArray()).to.be.eql([0, 0]);
            done();
        });
        map.setCenter([0, 0]);
    });

    it('change spatialreference', function () {
        var overview = new maptalks.control.Overview();
        overview.addTo(map);
        map.setSpatialReference({
            projection : 'baidu'
        });
        expect(overview._overview.options.spatialReference.projection).to.be.eql('baidu');
    });

    it('zoom', function (done) {
        var overview = new maptalks.control.Overview();
        overview.addTo(map);
        var zoom = overview._overview.getZoom();
        overview._overview.on('zoomend', function () {
            expect(overview._overview.getZoom()).not.to.be.eql(zoom);
            done();
        });
        map.zoomIn();
    });

    it('maximize and minimize overview', function () {
        var overview = new maptalks.control.Overview({
            maximize : false
        });
        overview.addTo(map);
        expect(overview._overview).not.to.be.ok();
        happen.click(overview.button);
        expect(overview._overview).to.be.ok();
        happen.click(overview.button);
        expect(overview._overview).not.to.be.ok();
    });

    it('maximize overview', function () {
        var overview = new maptalks.control.Overview({
            maximize : false
        });
        overview.addTo(map);
        expect(overview._overview).not.to.be.ok();
        happen.click(overview.button);
        expect(overview._overview).to.be.ok();
        expect(overview._overview.getZoom()).to.be.eql(map.getZoom() - overview.options['level']);
        expect(overview._overview.getCenter().toArray()).to.be.eql(map.getCenter().toArray());
    });

    it('overview base groupLayer visible', function () {
        var group = new maptalks.GroupTileLayer('group', [
            new maptalks.TileLayer('tile1', {
                visible : false,
                urlTemplate : '#'
            }),
            new maptalks.TileLayer('tile2', {
                visible : false,
                urlTemplate : '#'
            })
        ], {
            renderer : 'canvas'
        });
        map.setBaseLayer(group);
        var overview = new maptalks.control.Overview();
        overview.addTo(map);
        expect(overview._overview.getBaseLayer().isVisible()).to.be.ok();
    });

    it('overview base zoom visible', function () {
        tile.options.maxZoom = 16;
        map.setBaseLayer(tile);
        var overview = new maptalks.control.Overview();
        overview.addTo(map);
        expect(overview._overview.getBaseLayer().isVisible()).to.be.ok();
    });
});
