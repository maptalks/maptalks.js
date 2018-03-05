describe('UI.ToolTip', function () {
    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var layer;

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '10px';
        container.style.height = '10px';
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
        expect(tooltip.isVisible()).not.to.be.ok();
    });

    it('it can show when mouseover a geometry', function () {
        var geo = new maptalks.Marker(center).addTo(layer);
        var tooltip = new maptalks.ui.ToolTip('this is a geometry');
        tooltip.addTo(geo);
        geo.fire('mouseover', { coordinate:geo.getCenter() });
        expect(tooltip.isVisible()).to.be.ok();
    });

    it('it will hide when mouseout a geometry', function (done) {
        var geo = new maptalks.Marker(center).addTo(layer);
        var tooltip = new maptalks.ui.ToolTip('this is a geometry');
        tooltip.addTo(geo);
        geo.fire('mouseover', { coordinate: geo.getCenter() });
        expect(tooltip.isVisible()).to.be.ok();
        geo.fire('mouseout');
        setTimeout(function () {
            expect(tooltip.isVisible()).not.to.be.ok();
            done();
        }, 500);
    });

    it('it will not show when mouseover and set a new tooltip again', function () {
        var geo = new maptalks.Marker(center);
        geo = geo.addTo(layer);
        var tooltip = new maptalks.ui.ToolTip('this is a geometry');
        tooltip.addTo(geo);
        geo.fire('mouseover', { coordinate:geo.getCenter() });
        expect(tooltip.isVisible()).to.be.ok();
        tooltip.remove();
        var newtooltip = new maptalks.ui.ToolTip('set a new tooltip');
        newtooltip.addTo(geo);
        geo.fire('mouseover', { coordinate: geo.getCenter() });
        expect(newtooltip.isVisible()).to.be.ok();
    });

});
