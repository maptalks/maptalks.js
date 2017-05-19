describe('#Tooltips', function () {
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
        var tooltip = new maptalks.ui.Tooltips();
        tooltip.setTo(geo, 'this is a geometry');
        var m = document.getElementById('tipDiv');
        expect(m).to.be(null);
    });

    it('it can show when mouseover a geometry', function () {
        var geo = new maptalks.Marker(center).addTo(layer);
        var tooltip = new maptalks.ui.Tooltips();
        tooltip.setTo(geo, 'this is a geometry');
        geo.fire('mouseover', { coordinate:geo.getCenter() });
        expect(tooltip.isVisible()).to.be.eql(true);
    });

    it('it will hide when mouseout a geometry', function () {
        var geo = new maptalks.Marker(center).addTo(layer);
        var tooltip = new maptalks.ui.Tooltips();
        tooltip.setTo(geo, 'this is a geometry');
        setTimeout(function () {
            geo.fire('mouseout');
            expect(tooltip.isVisible()).to.be.eql(false);
        }, 1000);
    });

    describe('all kinds of geometries can set a tooltips', function () {
        var geometries = GEN_GEOMETRIES_OF_ALL_TYPES();
        it('set to all geometries and it will has a tooltips', function () {
            for (var i = 0; i < geometries.length; i++) {
                var tooltips = new maptalks.ui.Tooltips();
                tooltips.setTo(geometries[i], geometries[i].getType());
                layer.addGeometry(geometries[i]);
                expect(geometries[i]._tooltips).to.be.ok();
            }
        });

        it('diffrent geometry\'s tooltips has diffrent content', function () {
            for (var i = 0; i < geometries.length; i++) {
                var geo = geometries[i];
                expect(geo._tooltips.getContent()).to.be.eql(geo.getType());
            }
        });
    });

    describe('when cancelTips', function () {
        var geo = new maptalks.Marker(center);
        it('it will not show when mouseover and set a new tooltips again', function () {
            geo = geo.addTo(layer);
            var tooltips = new maptalks.ui.Tooltips();
            tooltips.setTo(geo, 'this is a geometry');
            geo.fire('mouseover', { coordinate:geo.getCenter() });
            expect(tooltips.isVisible()).to.be.eql(true);
            setTimeout(function () {
                geo._tooltips.cancelTips();
                geo.fire('mouseover', { coordinate:geo.getCenter() });
                expect(tooltips.isVisible()).to.be.eql(false);
                expect(geo._tooltips).not.to.be.ok();
                var newtooltips = new maptalks.ui.Tooltips();
                newtooltips.setTo(geo, 'set a new tooltips');
                geo.fire('mouseover', { coordinate:geo.getCenter() });
                expect(geo._tooltips.isVisible()).to.be.eql(true);
            }, 1000);
        });
    });
});
