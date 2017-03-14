describe('Control.Toolbar', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center);
        container = setups.container;
        map = setups.map;
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('add a toolbar', function () {
        /**
        * 创建多个toolbar控件
        */
        var toolbar = new maptalks.control.Toolbar({
            position : { //工具条放置位置
                top: '2',
                left: '2'
            },
            vertical : false, //垂直放置toolbar，默认：false，代表toolbar水平放置
            //工具项
            items: [{
                item: '<span style="color:#fff;font-size:12px;">1</span>',
                click : function () { alert('1'); },
                children : [{//子菜单
                    item: '左011111111111111111111111111111',
                    click : function () { alert('click 左01'); }
                }, {
                    item: '左02',
                    click : function () { alert('click 左02'); }
                }]
            }, {
                item: '2',
                click : function () { alert('2'); }
            }, {
                item: '<span style="color:#fff;font-size:12px;">3</span>',
                click : function () { alert('3'); }
            }, {
                item : '<span style="color:#fff;font-size:12px;">4</span>',
                click : function () { alert('4'); }
            }]
        });
        map.addControl(toolbar);

        expect(toolbar.getContainer().innerHTML).not.to.be.empty();
    });

});
