describe('#ToolTip', function () {
    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var layer;

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '800px';
        container.style.height = '600px';
        document.body.appendChild(container);
        var option = {
            zoomAnimation: false,
            zoom: 15,
            center: center
        };
        map = new maptalks.Map(container, option);
        layer = new maptalks.VectorLayer('vector').addTo(map);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('can set to a geometry but it doesn\'t show', function () {
        var geo = new maptalks.Marker(center).addTo(layer);
        var tooltip = new maptalks.ui.ToolTip('this is a geometry');
        tooltip.addTo(geo);
        var isvisible = tooltip.isVisible();
        expect(isvisible).not.to.be.ok();
    });

    it('it can show when mouseover a geometry', function () {
        var geo = new maptalks.Marker(center).addTo(layer);
        var tooltip = new maptalks.ui.ToolTip('this is a geometry');
        tooltip.addTo(geo);
        geo.fire('mouseover', { coordinate:geo.getCenter() });
        expect(tooltip.isVisible()).to.be.eql(true);
    });

    it('it will hide when mouseout a geometry', function (done) {
        var geo = new maptalks.Marker(center).addTo(layer);
        var tooltip = new maptalks.ui.ToolTip('this is a geometry');
        tooltip.addTo(geo);
        geo.fire('mouseover', { coordinate: geo.getCenter() });
        expect(tooltip.isVisible()).to.be.eql(true);
        geo.fire('mouseout');
        setTimeout(function () {
            var isvisible = tooltip.isVisible();
            expect(isvisible).to.be.eql(false);
            done();
        }, 500);
    });
});
