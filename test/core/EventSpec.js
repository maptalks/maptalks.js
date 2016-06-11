describe("EventSpec", function() {

    it("on and off", function() {
        function listener() {

        }
        var marker = new maptalks.Marker([0, 0]);
        marker.on('click', listener, marker);
        marker.on('mousedown', listener, marker);
        expect(marker.listens('click', listener, marker)).to.be.eql(1);
        marker.off('click', listener, marker);
        expect(marker.listens('click')).to.be.eql(0);
    });

    it("duplicate on", function() {
        function listener() {

        }
        var marker = new maptalks.Marker([0, 0]);
        marker.on('click', listener, marker);
        marker.on('click', listener, marker);
        marker.on('mousedown', listener, marker);
        expect(marker.listens('click', listener, marker)).to.be.eql(1);
        marker.off('click', listener, marker);
        expect(marker.listens('click')).to.be.eql(0);
    });

    it('fire', function() {
        var counter = 0;
        function listener() {
            counter++;
        }
        function listener2() {
            counter++;
        }
        var marker = new maptalks.Marker([0, 0]);
        marker.on('click', listener, marker);
        marker.on('click', listener2, marker);
        marker.fire('click');
        marker.fire('click');

        expect(counter).to.be.eql(4);
    });

    it('param is isolated', function() {
        var counter = 0;
        function listener(param) {
            param.foo = 1;
            expect(param.foo2).not.to.be.ok();
            counter++;
        }
        function listener2(param) {
            param.foo2 = 1;
            expect(param.foo).not.to.be.ok();
            counter++;
        }
        var marker = new maptalks.Marker([0, 0]);
        marker.once('click', listener, marker);
        marker.on('click', listener2, marker);
        marker.fire('click');

    });

    it('turn off itself in listener', function() {
        var counter = 0;
        function listener(param) {
            counter++;
            param.target.off('click', listener2, param.target);
        }
        function listener2() {
            counter++;
        }
        var marker = new maptalks.Marker([0, 0]);
        marker.on('click', listener, marker);
        marker.on('click', listener2, marker);
        marker.fire('click');
        marker.fire('click');

        expect(counter).to.be.eql(3);
    });

    it('once', function() {
        var counter = 0;
        function listener() {
            counter++;
        }
        function listener2() {
            counter++;
        }
        var marker = new maptalks.Marker([0, 0]);
        marker.once('click', listener, marker);
        marker.on('click', listener2, marker);
        marker.fire('click');
        marker.fire('click');

        expect(counter).to.be.eql(3);
    });

});
