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

});
