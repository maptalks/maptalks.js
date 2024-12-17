describe('SpatialReference.WMTS', function () {

    it('load from url', function (done) {
        maptalks.SpatialReference.loadWMTS('/resources/wmts.xml', function (err, conf) {
            expect(err).to.be(null);
            expect(conf.length).to.be(4);
            done();
        }, {
            jsonp : false
        });
    });

});
