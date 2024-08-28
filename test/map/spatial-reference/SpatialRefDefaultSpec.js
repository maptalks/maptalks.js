describe('SpatialReference.Default', function () {

    it('get default SpatialReference', function (done) {
        const sps = maptalks.getDefaultSpatialReference();
        const epsgs = ['EPSG:3857', 'EPSG:4326', 'BAIDU', 'IDENTITY', 'PRESET-VT-3857', 'PRESET-VT-4326', 'EPSG:4490', 'PRESET-3857-512', 'PRESET-4326-512', 'PRESET-4490-512'];
        epsgs.forEach(key => {
            expect(sps).to.have.property(key);
            const value = sps[key];
            expect(value).to.have.property('fullExtent');
            expect(value).to.have.property('projection');
            expect(value).to.have.property('resolutions');

            expect(value.projection).to.be.a('string');
            expect(value.resolutions).to.be.a('array');
            expect(value.fullExtent).to.be.a('object');
 
        });
        done();

    });

});
