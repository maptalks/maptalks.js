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
        const pack = new packer.PolygonPack(features, styles, { minZoom : 1, maxZoom : 22, requestor : REQUESTOR });
        pack.load().then(() => {
            const result = pack.pack(1);
            const data = result.packs[0].data;

            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });
});
