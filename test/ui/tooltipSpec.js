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

    describe('all kinds of geometries can set a tooltip', function () {
        var geometries = GEN_GEOMETRIES_OF_ALL_TYPES();
        it('set to all geometries and it will has a tooltip', function () {
            for (var i = 0; i < geometries.length; i++) {
                var tooltip = new maptalks.ui.ToolTip(geometries[i].getType());
                tooltip.addTo(geometries[i]);
                layer.addGeometry(geometries[i]);
                expect(geometries[i]._tooltip).to.be.ok();
            }
        });

        it('diffrent geometry\'s tooltip has diffrent content', function () {
            for (var i = 0; i < geometries.length; i++) {
                var geo = geometries[i];
                expect(geo._tooltip.getContent()).to.be.eql(geo.getType());
            }
        });
    });

    describe('when remove tip', function () {
        var geo = new maptalks.Marker(center);
        it('it will not show when mouseover and set a new tooltip again', function () {
            geo = geo.addTo(layer);
            var tooltip = new maptalks.ui.ToolTip('this is a geometry');
            tooltip.addTo(geo);
            geo.fire('mouseover', { coordinate:geo.getCenter() });
            expect(tooltip.isVisible()).to.be.eql(true);
            geo._tooltip.remove();
            expect(geo._tooltip).not.to.be.ok();
            var newtooltip = new maptalks.ui.ToolTip('set a new tooltip');
            newtooltip.addTo(geo);
            geo.fire('mouseover', { coordinate: geo.getCenter() });
            expect(geo._tooltip.isVisible()).to.be.eql(true);
        });
    });
});
