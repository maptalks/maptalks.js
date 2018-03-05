describe('UI.ContextMenu', function () {
    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var context = {

    };

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center, null, {
            width : 800,
            height : 600
        });
        container = setups.container;
        map = setups.map;
        context.map = map;
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    var geometries = GEN_GEOMETRIES_OF_ALL_TYPES();
    // change to vector marker to enable layer's drawImmdiate
    geometries[0].setSymbol({
        markerType : 'ellipse',
        markerWidth : 20,
        markerHeight : 20
    });
    for (var i = 0; i < geometries.length; i++) {
        runTests.call(this, geometries[i], context);
    }

    it('hide when geometry is hided', function () {
        map.removeLayer('vector');
        var layer = new maptalks.VectorLayer('vector');
        var target = new maptalks.Marker(map.getCenter());
        layer.addGeometry(target).addTo(map);
        var items = [
            { item: 'item1', click: function () {} },
            '-',
            { item: 'item2', click: function () {} }
        ];

        target.setMenu({
            items: items,
            animation : null,
            width: 250
        });
        target.openMenu();
        expect(target._menu.isVisible()).to.be.ok();
        target.hide();
        expect(target._menu.isVisible()).not.to.be.ok();
        expect(target._menu.getDOM().style.display).to.be.eql('none');
    });

    it('move when geometry is moved', function () {
        map.removeLayer('vector');
        var layer = new maptalks.VectorLayer('vector');
        var target = new maptalks.Marker(map.getCenter());
        layer.addGeometry(target).addTo(map);
        var items = [
            { item: 'item1', click: function () {} },
            '-',
            { item: 'item2', click: function () {} }
        ];

        target.setMenu({
            items: items,
            animation : null,
            width: 250
        });
        target.openMenu();
        var w = target._menu;
        var pos1 = w.getPosition();

        target.setCoordinates(map.getCenter().add(0.1, 0.1));

        var pos2 = w.getPosition();
        expect(w.isVisible()).to.be.ok();
        expect(pos2.toArray()).not.to.be.eql(pos1.toArray());
    });

    it('hide when layer is hided', function () {
        map.removeLayer('vector');
        var layer = new maptalks.VectorLayer('vector');
        var target = new maptalks.Marker(map.getCenter());
        layer.addGeometry(target).addTo(map);
        var items = [
            { item: 'item1', click: function () {} },
            '-',
            { item: 'item2', click: function () {} }
        ];

        target.setMenu({
            items: items,
            animation : null,
            width: 250
        });
        target.openMenu();
        expect(target._menu.isVisible()).to.be.ok();
        layer.hide();
        expect(target._menu.isVisible()).not.to.be.ok();
        expect(target._menu.getDOM().style.display).to.be.eql('none');
    });

    it('specify menu height', function () {
        map.removeLayer('vector');
        var layer = new maptalks.VectorLayer('vector');
        var target = new maptalks.Marker(map.getCenter());
        layer.addGeometry(target).addTo(map);
        var items = [
            { item: 'item1', click: function () {} },
            { item: 'item2', click: function () {} },
            '-',
            { item: 'item3', click: function () {} },
            { item: 'item4', click: function () {} },
            { item: 'item5', click: function () {} },
            { item: 'item6', click: function () {} },
            '-',
            { item: 'item7', click: function () {} },
            '-',
            { item: 'item8', click: function () {} },
            { item: 'item9', click: function () {} },
            { item: 'item10', click: function () {} }
        ];

        target.setMenu({
            items: items,
            maxHeight: 300,
            width: 250
        });
        target.openMenu();
        var menuDom = target._menu.getDOM().firstChild;
        expect(menuDom.style['max-height']).to.be.equal('300px');
    });

    // a bugfix on 2017-07-21
    // frontlayer panel's position is not updated when menu opened
    it('update front panel\'s position after menu opens.', function (done) {
        map.removeLayer('vector');

        var layer = new maptalks.VectorLayer('vector');
        var target = new maptalks.Marker(map.getCenter());
        layer.addGeometry(target).addTo(map);
        var items = [
            { item: 'item1', click: function () {} },
            '-',
            { item: 'item2', click: function () {} }
        ];



        map.on('frameend', function () {
            target.setMenu({
                items: items,
                animation : null,
                width: 250
            });
            target.openMenu();
            var pos = map.getViewPoint().round();
            expect(map._panels.front.style.transform).to.be.eql('translate3d(' + pos.x + 'px, ' + pos.y + 'px, 0px)');
            done();
        });
        map.setCenter(map.getCenter().add(0.01, 0.02));
    });

    it('update when map center updated', function (done) {
        map.removeLayer('vector');

        var layer = new maptalks.VectorLayer('vector');
        var target = new maptalks.Marker(map.getCenter());
        layer.addGeometry(target).addTo(map);
        var items = [
            { item: 'item1', click: function () {} },
            '-',
            { item: 'item2', click: function () {} }
        ];
        target.setMenu({
            items: items,
            animation : null,
            width: 250
        });

        target.openMenu();
        map.on('frameend', function () {

            target.openMenu();
            var pos = map.getViewPoint().round();
            expect(map._panels.front.style.transform).to.be.eql('translate3d(' + pos.x + 'px, ' + pos.y + 'px, 0px)');
            done();
        });
        map.setCenter(map.getCenter().add(0.01, 0.02));
    });
});

function runTests(target, _context) {
    var type;
    if (target instanceof maptalks.Geometry) {
        type = target.getType();
    } else {
        type = 'Map';
    }

    function prepareGeometry() {
        if (!(target instanceof maptalks.Geometry)) {
            return;
        }
        var map = _context.map;
        if (target.getLayer()) { target.remove(); }
        map.removeLayer('vector');
        var layer = new maptalks.VectorLayer('vector', { 'drawImmediate' : true });
        layer.addTo(map).addGeometry(target);
    }

    var items = [
        { item: 'item1', click: function () {} },
        '-',
        { item: 'item2', click: function () {} }
    ];

    function assertItems() {
        var itemEles = document.getElementsByTagName('li');
        expect(itemEles.length).to.be.eql(3);
        expect(itemEles[0].innerHTML).to.be.eql('item1');
        expect(itemEles[2].innerHTML).to.be.eql('item2');
    }

    function rightclick() {
        _context.map.setCenter(target.getFirstCoordinate());
        var eventContainer = _context.map._panels.canvasContainer;
        var domPosition = GET_PAGE_POSITION(eventContainer);
        var point = _context.map.coordinateToContainerPoint(target.getFirstCoordinate()).add(domPosition);

        happen.once(eventContainer, {
            'type' : 'contextmenu',
            'clientX':point.x,
            'clientY':point.y
        });
    }

    context('Type of ' + type, function () {
        it('setMenu and open', function () {
            prepareGeometry();
            target.setMenu({
                items: items,
                animation : null,
                width: 250
            });
            target.openMenu();
            assertItems();
            target.closeMenu();
            expect(target._menu.getDOM().style.display).to.be.eql('none');
        });

        it('setMenu and open with animation', function (done) {
            prepareGeometry();
            var map = target.getMap();
            target.setMenu({
                items: items,
                animation : 'scale',
                animationDuration : 20,
                animationOnHide   : true,
                width: 250
            });
            var p = target.getMap().coordinateToViewPoint(target.getCenter())._round();

            target.openMenu();
            // menu's offset is moved when it is outside map
            if (!map.getExtent().contains(target.getCenter())) {
                p._sub(target._menu.getSize().toPoint());
            }

            expect(target._menu.getDOM().style.display).to.be.eql('');
            expect(target._menu.getDOM().style[maptalks.DomUtil.TRANSFORM]).to.be.eql('translate3d(' + p.x + 'px, ' + p.y + 'px, 0px) scale(1)');
            setTimeout(function () {
                assertItems();
                expect(target._menu.getDOM().style[maptalks.DomUtil.TRANSFORM]).to.be.eql('translate3d(' + p.x + 'px, ' + p.y + 'px, 0px) scale(1)');
                target.closeMenu();
                expect(target._menu.getDOM().style.display).to.be.eql('');
                setTimeout(function () {
                    expect(target._menu.getDOM().style.display).to.be.eql('none');
                    done();
                }, 21);
            }, 21);
        });

        it('get menu', function () {
            prepareGeometry();
            target.setMenu({
                items: items,
                animation : null,
                width: 250
            });
            expect(target.getMenuItems()).to.be.eql(items);
        });

        it('menu item of function type', function () {
            prepareGeometry();
            target.setMenu({
                items: [
                    {
                        item: function (param) {
                            expect(param.index).to.be(0);
                            return 'item1';
                        },
                        click: function () {}
                    },
                    '-',
                    {
                        item: function (param) {
                            expect(param.index).to.be(2);
                            return 'item2';
                        },
                        click: function () {}
                    },
                ],
                animation : null,
                width: 250
            });
            target.openMenu();
            assertItems();
        });

        it('remove menu', function () {
            prepareGeometry();
            target.setMenu({
                items: items,
                animation : null,
                width: 250
            });
            target.removeMenu();
            expect(target.getMenuItems()).to.be.empty();
        });

        it('custom menu', function () {
            prepareGeometry();
            target.setMenu({
                animation : null,
                custom : true,
                items: '<ul><li>item1</li><li>--</li><li>item2</li></ul>',
                width: 250
            });
            target.openMenu();
            assertItems();
            target.closeMenu();
            expect(target._menu.getDOM().style.display).to.be.eql('none');
        });

        it('custom menu 2', function () {
            var ul = document.createElement('ul');
            var li1 = document.createElement('li');
            li1.innerHTML = 'item1';
            var li2 = document.createElement('li');
            li2.innerHTML = '--';
            var li3 = document.createElement('li');
            li3.innerHTML = 'item2';
            ul.appendChild(li1);
            ul.appendChild(li2);
            ul.appendChild(li3);
            prepareGeometry();
            target.setMenu({
                animation : null,
                custom : true,
                items: ul,
                width: 250
            });
            target.openMenu();
            assertItems();
            target.closeMenu();
            expect(target._menu.getDOM().style.display).to.be.eql('none');
        });

        it('setMenuItems', function () {
            prepareGeometry();
            target.setMenuItems(items);
            target.openMenu();
            assertItems();
            target.closeMenu();
            expect(target._menu.getDOM().style.display).to.be.eql('none');
        });

        it('openMenu with a coordinate', function () {
            prepareGeometry();
            target.setMenuItems(items);
            target.openMenu(target.getCenter());
            assertItems();
            target.closeMenu();
            expect(target._menu.getDOM().style.display).to.be.eql('none');
        });

        it('openMenu by click', function () {
            if (target instanceof maptalks.Sector) {
                return;
            }
            var map = _context.map;
            map.setCenter(target.getFirstCoordinate());
            prepareGeometry();
            target.setMenu({
                items: items,
                animation : null,
                width: 250
            });
            rightclick();
            assertItems();
            target.closeMenu();
            expect(target._menu.getDOM().style.display).to.be.eql('none');
        });

        it('openMenu by click when target is being edited', function (done) {
            // if (target instanceof maptalks.Sector) {
            //     return;
            // }
            // prepareGeometry();
            // target.setMenuItems(items);
            // target.startEdit();
            // setTimeout(function() {
            //     rightclick();
            //     assertItems();
            //     target.closeMenu();
            //     expect(target._menu.getDOM().style.display).to.be.eql('none');
            //     done();
            // }, 20);
            done();
        });

        it('callback will be called when item is clicked', function () {
            var spy1 = sinon.spy();
            var spy2 = sinon.spy();
            var map = _context.map;
            map.setCenter(target.getFirstCoordinate());
            prepareGeometry();
            target.setMenuItems([
                { item: 'item1', click: spy1 },
                '-',
                { item: 'item2', click: spy2 }
            ]);
            target.openMenu();
            var itemEles = document.getElementsByTagName('li');
            itemEles[0].click();
            expect(spy1.called).to.be.ok();
            target.openMenu();
            itemEles = document.getElementsByTagName('li');
            itemEles[2].click();
            expect(spy2.called).to.be.ok();

        });

        it('return false to keep the menu open', function () {
            prepareGeometry();
            target.setMenuItems([
                {
                    item: 'item1',
                    click: function () {
                        return false;
                    }
                },
                '-'
            ]);
            target.openMenu();
            var itemEles = document.getElementsByTagName('li');
            itemEles[0].click();

            expect(target._menu.getDOM().style.display).not.to.be.eql('none');

        });

    });
}
