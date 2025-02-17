describe('Control Common Tests', function () {

    var container;
    var map;
    var control;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '10px';
        container.style.height = '10px';
        document.body.appendChild(container);
        var option = {
            zoom: 17,
            center: center
        };
        map = new maptalks.Map(container, option);
        control = new maptalks.control.Scale({
            metric: true,
            imperial: true
        });
        map.addControl(control);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    function buildOn() {
        return maptalks.DomUtil.createEl('div');
    }

    it('addTo', function () {
        var control = new maptalks.control.Control({
            id: 'id1',
            position: { top: 10, left: 10 }
        });
        control.buildOn = buildOn;

        expect(function () {
            control.addTo(map);
        }).to.not.throwException();
    });

    it('setPosition', function () {
        var control = new maptalks.control.Control({
            id: 'id1',
            position: { top: 10, left: 10 }
        });
        control.buildOn = buildOn;
        control.addTo(map);
        var pos = {
            top: 20,
            left: 30
        };

        control.setPosition(pos);
        expect(control.getPosition()).to.be.eql(pos);
    });

    it('has common methods', function () {
        expect(control.getContainerPoint() instanceof maptalks.Point).to.be.ok();
        control.hide();
        expect(control.getContainer().style.display === 'none').to.be.ok();
        control.show();
        expect(control.getContainer().style.display === '').to.be.ok();
        var position = control.getPosition();
        expect(position).not.to.be.empty();
        control.setPosition('top-right');
        expect(control.getPosition()).not.to.be.eql(position);
        control.remove();
        expect(control.getContainer()).not.to.be.ok();
    });

    it('can be removed by map', function () {
        map.removeControl(control);
        expect(control.getContainer()).not.to.be.ok();
    });

});
