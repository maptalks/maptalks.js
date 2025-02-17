describe('Control.Scale', function () {

    var container;
    var map;
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
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('widgets contain correct value after initialized', function () {
        var control = new maptalks.control.Scale({
            metric: true,
            imperial: true,
            containerClass: null
        });
        map.addControl(control);

        expect(control._mScale.innerHTML).to.not.be.empty();
        expect(control._iScale.innerHTML).to.not.be.empty();
        expect(control._mScale.innerHTML).to.contain('100');
    });

    it('Is the className of dom myContainerClass?', function () {
        var control1 = new maptalks.control.Scale({
            metric: true,
            imperial: true,
            containerClass: 'mycontainerClass'
        });
        map.addControl(control1);
        expect(control1.getDOM().className === 'mycontainerClass').to.be.ok();
    });

});
