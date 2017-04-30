describe('Control.Panel', function () {

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

    it('add a panel', function () {
        var panel = new maptalks.control.Panel({
            position : {//放置panel的位置
                top: '150',
                left: '150'
            },
            draggable: true, //能否拖动
            custom: false, //content值能否为html
            content: '面板内容'
        });
        map.addControl(panel);
        expect(panel.getContainer().innerHTML).to.be.eql(
            '<div class="maptalks-panel"><a class="maptalks-close" href="javascript:;"></a><div class="maptalks-panel-content">面板内容</div></div>');
    });

    it('update a panel', function () {
        var panel = new maptalks.control.Panel({
            position : {//放置panel的位置
                top: '150',
                left: '150'
            },
            draggable: true, //能否拖动
            custom: false, //content值能否为html
            content: '面板内容'
        });
        map.addControl(panel);

        var content = 'changed';
        panel.setContent(content);
        expect(panel.getContent()).to.be.eql(content);
        expect(panel.getContainer().innerHTML).to.be.eql(
            '<div class="maptalks-panel"><a class="maptalks-close" href="javascript:;"></a><div class="maptalks-panel-content">changed</div></div>');
    });

    function dragPanel(panel) {
        var dom = panel.getContainer().childNodes[0],
            domPosition = GET_PAGE_POSITION(dom),
            point = new maptalks.Point(0, 0).add(domPosition);
        happen.mousedown(dom, {
            'clientX':point.x,
            'clientY':point.y
        });
        for (var i = 0; i < 10; i++) {
            happen.mousemove(document, {
                'clientX':point.x + i,
                'clientY':point.y + i
            });
        }
        happen.mouseup(document);
    }

    it('panel can be dragged', function () {
        var position = {//放置panel的位置
            top: '150',
            left: '150'
        };
        var panel = new maptalks.control.Panel({
            position : position,
            draggable: true, //能否拖动
            custom: false, //content值能否为html
            content: '面板内容'
        });
        map.addControl(panel);

        dragPanel(panel);

        expect(panel.getPosition()).not.to.be.eql(position);
    });

});
