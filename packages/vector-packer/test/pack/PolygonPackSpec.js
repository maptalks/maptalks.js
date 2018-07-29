describe('Polygon Pack specs', function () {

    let features;
    beforeEach(() => {
        features = [{ type : 'Feature', geometry : { type : 'Polygon', coordinates : [[[0, 0], [500, 0], [500, 100], [0, 0]]] }, properties : {}}];
    });

    it('anchors', function (done) {
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': {
                    markerFile : 'resources/plane-min.png',
                    markerWidth : 30,
                    markerHeight : 30
                }
            }
        ]);
        const pack = new packer.PointPack(features, styles, { minZoom : 1, maxZoom : 22, requestor : REQUESTOR });
        pack.load().then(() => {
            const result = pack.performLayout(1);
            const anchors = result.packs[0].a_anchor;
            expect(anchors.length).to.be(12);
            expect(anchors[0]).to.be(450);
            expect(anchors[1]).to.be(50);
            expect(anchors[9]).to.be(450);
            expect(anchors[10]).to.be(50);
            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });
});
