describe("Control.Panel", function() {

    var container;
    var map;
    var tile;
    var center = new Z.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        var setups = commonSetupMap(center);
        container = setups.container;
        map = setups.map;
    });

    afterEach(function () {
        document.body.removeChild(container);
    });

    it("add a panel", function() {
        var panel = new maptalks.control.Panel({
            position : {//放置panel的位置
                top: '150',
                left: '150'
            },
            draggable: true,//能否拖动
            custom: false, //content值能否为html
            content: '面板内容'
        });
        map.addControl(panel);

        expect(panel.getContainer().innerHTML).not.to.be.empty();
    });

     function dragPanel(panel) {
        var domPosition = Z.DomUtil.getPagePosition(panel.getContainer());
        var point = new Z.Point(0,0).add(domPosition);
        var requestAnimFn = Z.Util.requestAnimFrame;
        //replace original requestAnimFrame to immediate execution.
        Z.Util.requestAnimFrame=function(fn) {
            fn();
        };
        happen.mousedown(panel.getContainer(),{
                'clientX':point.x,
                'clientY':point.y
                });
        for (var i = 0; i < 10; i++) {
            happen.mousemove(document,{
                'clientX':point.x+i,
                'clientY':point.y+i
                });
        };
        happen.mouseup(document);
        Z.Util.requestAnimFrame = requestAnimFn;
    }

    // it("panel can be dragged", function() {
    //     var position = {//放置panel的位置
    //             top: '150',
    //             left: '150'
    //         };
    //     var panel = new maptalks.control.Panel({
    //         position : position,
    //         draggable: true,//能否拖动
    //         custom: false, //content值能否为html
    //         content: '面板内容'
    //     });
    //     map.addControl(panel);

    //     dragPanel(panel);

    //     expect(panel.getPosition()).not.to.be.eql(position);
    // });

});
