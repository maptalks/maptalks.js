describe('Control.LayerSwitcher', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '800px';
        container.style.height = '600px';
        document.body.appendChild(container);
        var option = {
            zoomAnimation: false,
            zoom: 5,
            center: center
        };
        map = new maptalks.Map(container, option);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('baseTitle and overlayTitle', function () {
        var tile1 = new maptalks.TileLayer('tile1', {
            urlTemplate : '#'
        });
        var tile2 = new maptalks.TileLayer('tile2', {
            urlTemplate : '#'
        });
        map.setBaseLayer(tile1);
        map.addLayer(tile2);
        var control = new maptalks.control.LayerSwitcher({
            baseTitle: 'baseTitle',
            overlayTitle : 'overlayTitle'
        });
        map.addControl(control);
        happen.mouseover(control.button, {
            'clientX' : 100,
            'clientY' : 100
        });

        var labels = document.querySelectorAll('label');
        expect(labels[0].innerText).to.be.eql('baseTitle');
        expect(labels[1].innerText).to.be.eql('tile1');
        expect(labels[2].innerText).to.be.eql('overlayTitle');
        expect(labels[3].innerText).to.be.eql('tile2');
    });

    it('excludeLayers', function () {
        var control = new maptalks.control.LayerSwitcher({
            excludeLayers: ['tile1']
        });
        map.addControl(control);
        var tile1 = new maptalks.TileLayer('tile1', {
            urlTemplate : '#'
        });
        var tile2 = new maptalks.TileLayer('tile2', {
            urlTemplate : '#'
        });
        map.addLayer([tile1, tile2]);
        happen.mouseover(control.button, {
            'clientX' : 100,
            'clientY' : 100
        });
        var labels = document.querySelectorAll('.layer label');
        for (var i = 0, len = labels.length; i < len; i++) {
             expect(labels[i].innerText).not.to.eql('tile1');
        }
    });

    it('base layers switch', function () {
        var control = new maptalks.control.LayerSwitcher();
        map.addControl(control);
        var fired = false;
        control.on('layerchange', function(e) {
            fired = e.target;
        });
        var group = new maptalks.GroupTileLayer('group', [
            new maptalks.TileLayer('tile1', {
                urlTemplate : '#'
            }),
            new maptalks.TileLayer('tile2', {
                urlTemplate : '#',
                visible : false
            })
        ]);
        map.setBaseLayer(group);
        happen.mouseover(control.button, {
            'clientX' : 100,
            'clientY' : 100
        });
        var radios = document.querySelectorAll('.layer input');
        expect(radios[0].checked).to.be.ok();
        expect(radios[1].checked).not.to.be.ok();
        expect(group.layers[0].isVisible()).to.be.ok();
        expect(group.layers[1].isVisible()).not.to.be.ok();
        happen.click(radios[1]);
        expect(radios[0].checked).not.to.be.ok();
        expect(radios[1].checked).to.be.ok();
        expect(group.layers[0].isVisible()).not.to.be.ok();
        expect(group.layers[1].isVisible()).to.be.ok();
        expect(fired).to.be.ok();
    });

    it('overlay layers switch', function () {
        var control = new maptalks.control.LayerSwitcher();
        map.addControl(control);
        var tile1 = new maptalks.TileLayer('tile1', {
            urlTemplate : '#'
        });
        map.addLayer(tile1);
        happen.mouseover(control.button, {
            'clientX' : 100,
            'clientY' : 100
        });
        var checkbox = document.querySelector('.layer input');
        expect(checkbox.checked).to.be.ok();
        expect(tile1.isVisible()).to.be.ok();
        happen.click(checkbox, {
            'clientX' : 100,
            'clientY' : 100
        });
        expect(checkbox.checked).not.to.be.ok();
        expect(tile1.isVisible()).not.to.be.ok();
    });

    it('show and hide', function () {
        var control = new maptalks.control.LayerSwitcher();
        map.addControl(control);
        var tile1 = new maptalks.TileLayer('tile1', {
            urlTemplate : '#'
        });
        map.addLayer(tile1);
        happen.mouseover(control.button, {
            'clientX' : 100,
            'clientY' : 100
        });
        expect(control.container.className).to.be.eql(control.options.containerClass + ' shown');
        happen.once(control.panel, {
            'type' : 'mouseleave',
            'clientX' : 100,
            'clientY' : 100,
            'toElement' : container,
            'relatedTarget' : container
        });
        expect(control.container.className).to.be.eql(control.options.containerClass);
    });

    it('remove from map', function () {
        var control = new maptalks.control.LayerSwitcher();
        map.addControl(control);
        var tile1 = new maptalks.TileLayer('tile1', {
            urlTemplate : '#'
        });
        map.addLayer(tile1);
        happen.mouseover(control.button, {
            'clientX' : 100,
            'clientY' : 100
        });
        control.remove();
    });

    it('disable if layer is transparent or out of zoom', function () {
        var control = new maptalks.control.LayerSwitcher();
        map.addControl(control);
        var tile1 = new maptalks.TileLayer('tile1', {
            opacity : 0,
            urlTemplate : '#'
        });
        var tile2 = new maptalks.TileLayer('tile2', {
            minZoom : 1,
            maxZoom : 1,
            urlTemplate : '#'
        });
        map.addLayer(tile1, tile2);
        happen.mouseover(control.button, {
            'clientX' : 100,
            'clientY' : 100
        });
        var checkbox = document.querySelectorAll('.layer input');
        expect(checkbox[0].getAttribute('disabled')).to.be.eql('disabled');
        expect(checkbox[1].getAttribute('disabled')).to.be.eql('disabled');
    });
});
