describe('Polygon Pack specs', function () {

    let features;
    beforeEach(() => {
        features = [{ type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[0, 0], [500, 0], [500, 100], [0, 100], [0, 0]]] }, properties: {} }];
    });

    it('triangles', function (done) {
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': {
                    polygonFill: '#f00'
                }
            }
        ]);
        const packs = new packer.PolygonPack(features, styles, { minZoom: 1, maxZoom: 22, requestor: REQUESTOR });
        packs.load(1).then(result => {
            // const result = packs.pack(1);
            const pack = result.data.packs[0];
            expect(pack.lineIndices).to.be.eql([4, 0, 0, 1, 1, 2, 2, 3, 3, 4]);
            // expect(pack.lineSegments).to.be.eql([{ offset : 0, count : 10 }]);
            expect(pack.indices).to.be.eql([3, 0, 1, 1, 2, 3]);
            // expect(pack.segments).to.be.eql([{ offset : 0, count : 6 }]);

            expect(pack.data.aPosition).to.be.eql([0, 0, 0, 500, 0, 0, 500, 100, 0, 0, 100, 0, 0, 0, 0]);

            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });
});
