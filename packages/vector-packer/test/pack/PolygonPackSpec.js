describe('Polygon Pack specs', function () {

    let features;
    beforeEach(() => {
        features = [{ type : 'Feature', geometry : { type : 'Polygon', coordinates : [[[0, 0], [500, 0], [500, 100], [0, 100], [0, 0]]] }, properties : {}}];
    });

    it('triangles', function (done) {
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': {
                    polygonFill : '#f00'
                }
            }
        ]);
        const packs = new packer.PolygonPack(features, styles, { minZoom : 1, maxZoom : 22, requestor : REQUESTOR });
        packs.load().then(() => {
            const result = packs.pack(1);
            const pack = result.packs[0];
            expect(pack.lineElements).to.be.eql([4, 0, 0, 1, 1, 2, 2, 3, 3, 4]);
            expect(pack.lineSegments).to.be.eql([{ offset : 0, count : 10 }]);
            expect(pack.elements).to.be.eql([3, 0, 1, 1, 2, 3]);
            expect(pack.segments).to.be.eql([{ offset : 0, count : 6 }]);

            expect(pack.data.a_pos).to.be.eql([0, 0, 0, 500, 0, 0, 500, 100, 0, 0, 100, 0, 0, 0, 0]);

            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });
});
