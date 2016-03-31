describe('ContextMenu Tests', function() {
    var container;
    var map;
    var tile;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var layer;
    var context = {

    };

    beforeEach(function() {
       var setups = commonSetupMap(center);
       container = setups.container;
       map = setups.map;
       context.map = map;
    });

    afterEach(function() {
        map.removeLayer(layer);
        removeContainer(container)
    });

    var geometries = genAllTypeGeometries();

    for (var i = 0; i < geometries.length; i++) {
        runTests.call(this, geometries[i], context);
    }

});

function runTests(target, _context) {
        var type;
        if (target instanceof maptalks.Geometry) {
            type = target.getType();
        } else {
            type = 'Map';
        }

        function before() {
            if (!(target instanceof maptalks.Geometry)) {
                return;
            }
            var map = _context.map;
            if (target.getLayer()) {target.remove();}
            map.removeLayer('vector');
            var layer = new maptalks.VectorLayer('vector');
            layer.addGeometry(target).addTo(map);
        }

        var items = [
                {item: 'item1', click: function(){}},
                '-',
                {item: 'item2', click: function(){}}
            ];

        function assertItems() {
            var itemEles = document.getElementsByTagName('li');
            expect(itemEles.length).to.be.eql(3);
            expect(itemEles[0].innerHTML).to.be.eql('item1');
            expect(itemEles[2].innerHTML).to.be.eql('item2');
        }

        context('Type of ' + type, function() {
            it('setMenuAndOpen', function() {
                before();
                target.setMenu({
                        items: items,
                        width: 250
                    });
                target.openMenu();
                assertItems();
                target.closeMenu();
                expect(target._menu._getDOM().style.display).to.be.eql('none');
            });

            it('setMenuItems', function() {
                before();
                target.setMenuItems(items);
                target.openMenu();
                assertItems();
                target.closeMenu();
                expect(target._menu._getDOM().style.display).to.be.eql('none');
            });

            it('openMenu with a coordinate', function() {
                before();
                target.setMenuItems(items);
                target.openMenu(target.getCenter());
                assertItems();
                target.closeMenu();
                expect(target._menu._getDOM().style.display).to.be.eql('none');
            });

            it('callback will be called when item is clicked', function() {
                var spy1 = sinon.spy();
                var spy2 = sinon.spy();
                before();
                target.setMenuItems([
                    {item: 'item1', click: spy1},
                    '-',
                    {item: 'item2', click: spy2}
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

            it('return false to keep the menu open', function() {
                before();
                target.setMenuItems([
                    {
                        item: 'item1',
                        click: function() {
                            return false;
                        }
                    },
                    '-'
                ]);
                target.openMenu();
                var itemEles = document.getElementsByTagName('li');
                itemEles[0].click();

                expect(target._menu._getDOM().style.display).not.to.be.eql('none');

            });

        });
    }
