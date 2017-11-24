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
            urlTemplate : '/resources/tile.png'
        });
        var tile2 = new maptalks.TileLayer('tile2', {
            urlTemplate : '/resources/tile.png'
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

        var labels = document.querySelectorAll('.maptalks-layer-switcher label', this);
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
            urlTemplate : '/resources/tile.png'
        });
        var tile2 = new maptalks.TileLayer('tile2', {
            urlTemplate : '/resources/tile.png'
        });
        map.addLayer([tile1, tile2]);
        happen.mouseover(control.button, {
            'clientX' : 100,
            'clientY' : 100
        });
        var labels = document.querySelectorAll('.layer label', this);
        for (var i = 0, len = labels.length; i < len; i++) {
             expect(labels[i].innerText).not.to.eql('tile1');
        }
    });

    it('base layers switch', function () {
        var control = new maptalks.control.LayerSwitcher();
        map.addControl(control);
        var group = new maptalks.GroupTileLayer('group', [
            new maptalks.TileLayer('tile1', {
                urlTemplate : '/resources/tile.png'
            }),
            new maptalks.TileLayer('tile2', {
                urlTemplate : '/resources/tile.png',
                visible : false
            })
        ]);
        map.setBaseLayer(group);
        happen.mouseover(control.button, {
            'clientX' : 100,
            'clientY' : 100
        });
        var radios = document.querySelectorAll('.layer input',this);
        expect(radios[0].checked).to.be.ok();
        expect(radios[1].checked).not.to.be.ok();
        expect(group.layers[0].isVisible()).to.be.ok();
        expect(group.layers[1].isVisible()).not.to.be.ok();
        radios[1].addEventListener("click", function() {
            expect(radios[0].checked).not.to.be.ok();
            expect(radios[1].checked).to.be.ok();
            expect(group.layers[0].isVisible()).not.to.be.ok();
            expect(group.layers[1].isVisible()).to.be.ok();
        });
    });

    it('overlay layers switch', function () {
        var control = new maptalks.control.LayerSwitcher();
        map.addControl(control);
        var tile1 = new maptalks.TileLayer('tile1', {
            urlTemplate : '/resources/tile.png'
        });
        map.addLayer(tile1);
        happen.mouseover(control.button, {
            'clientX' : 100,
            'clientY' : 100
        });
        var checkbox = document.querySelector('.layer input',this);
        expect(checkbox.checked).to.be.ok();
        expect(tile1.isVisible()).to.be.ok();
        checkbox.addEventListener("click", function() {
            expect(checkbox.checked).not.to.be.ok();
            expect(tile1.isVisible()).not.to.be.ok();
        });
    });

    it('show and hide', function () {
        var control = new maptalks.control.LayerSwitcher();
        map.addControl(control);
        var tile1 = new maptalks.TileLayer('tile1', {
            urlTemplate : '/resources/tile.png'
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
            'clientY' : 100
        });
        expect(control.container.className).to.be.eql(control.options.containerClass);
    });

    it('remove from map', function () {
        var control = new maptalks.control.LayerSwitcher();
        map.addControl(control);
        var tile1 = new maptalks.TileLayer('tile1', {
            urlTemplate : '/resources/tile.png'
        });
        map.addLayer(tile1);
        happen.mouseover(control.button, {
            'clientX' : 100,
            'clientY' : 100
        });
        control.remove();
    });
});
