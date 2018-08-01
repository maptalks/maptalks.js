describe('Line Pack specs', function () {

    let features;
    beforeEach(() => {
        features = [{ type : 'Feature', geometry : { type : 'LineString', coordinates : [[0, 0], [500, 0], [550, 50]] }, properties : {}}];
    });

    it('pack data', function (done) {
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': {
                    lineWidth : 2,
                    lineOpacity : 0.6,
                    lineColor : '#f00'
                }
            }
        ]);
        const pack = new packer.LinePack(features, styles, { minZoom : 1, maxZoom : 22, requestor : REQUESTOR });
        pack.load().then(() => {
            const result = pack.pack(1);
            const data = result.packs[0].data;

            expect(data.a_pos.length).to.be.eql(18);
            expect(data.a_pos).to.be.a(Int16Array);
            expect(data.a_pos).to.be.eql(new Int16Array([0, 0, 0, 0, 0, 0, 500, 0, 0, 500, 0, 0, 550, 50, 0, 550, 50, 0]));

            expect(data.a_linesofar.length).to.be.eql(12);
            expect(data.a_linesofar).to.a(Uint8Array);
            expect(data.a_linesofar).to.be.eql(new Uint8Array([0, 0, 0, 0, 250, 0, 250, 0, 29, 1, 29, 1]));

            expect(data.a_normal.length).to.be.eql(12);
            expect(data.a_normal).to.a(Int8Array);
            expect(data.a_normal).to.be.eql(new Int8Array([0, -1, 0, 1, 0, -1, 0, 1, 0, -1, 0, 1]));

            expect(data.a_extrude.length).to.be.eql(12);
            expect(data.a_extrude).to.a(Uint8Array);
            expect(data.a_extrude).to.be.eql(new Uint8Array([128, 191, 128, 65, 102, 191, 154, 65, 83, 173, 173, 83]));

            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });

    it('round line join', function (done) {
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': {
                    lineWidth : 2,
                    lineOpacity : 0.6,
                    lineColor : '#f00',
                    lineJoin : 'round'
                }
            }
        ]);
        const pack = new packer.LinePack(features, styles, { minZoom : 1, maxZoom : 22, requestor : REQUESTOR });
        pack.load().then(() => {
            const result = pack.pack(1);
            const data = result.packs[0].data;

            expect(data.a_pos.length).to.be.eql(27);
            expect(data.a_pos).to.be.a(Int16Array);

            expect(data.a_linesofar.length).to.be.eql(18);
            expect(data.a_linesofar).to.a(Uint8Array);

            expect(data.a_normal.length).to.be.eql(18);
            expect(data.a_normal).to.a(Int8Array);

            expect(data.a_extrude.length).to.be.eql(18);
            expect(data.a_extrude).to.a(Uint8Array);
            expect(data.a_extrude).to.be.eql(new Uint8Array([128, 191, 128, 65, 102, 191, 128, 65, 152, 70, 102, 191, 173, 83, 83, 173, 173, 83]));

            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });

    it('bevel line join', function (done) {
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': {
                    lineWidth : 2,
                    lineOpacity : 0.6,
                    lineColor : '#f00',
                    lineJoin : 'bevel'
                }
            }
        ]);
        const pack = new packer.LinePack(features, styles, { minZoom : 1, maxZoom : 22, requestor : REQUESTOR });
        pack.load().then(() => {
            const result = pack.pack(1);
            const data = result.packs[0].data;

            expect(data.a_pos.length).to.be.eql(24);
            expect(data.a_pos).to.be.a(Int16Array);

            expect(data.a_linesofar.length).to.be.eql(16);
            expect(data.a_linesofar).to.a(Uint8Array);

            expect(data.a_normal.length).to.be.eql(16);
            expect(data.a_normal).to.a(Int8Array);

            expect(data.a_extrude.length).to.be.eql(16);
            expect(data.a_extrude).to.a(Uint8Array);
            expect(data.a_extrude).to.be.eql(new Uint8Array([128, 191, 128, 65, 102, 191, 128, 65, 102, 191, 173, 83, 83, 173, 173, 83]));

            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });

    it('round line cap', function (done) {
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': {
                    lineWidth : 2,
                    lineOpacity : 0.6,
                    lineColor : '#f00',
                    lineCap : 'round'
                }
            }
        ]);
        const pack = new packer.LinePack(features, styles, { minZoom : 1, maxZoom : 22, requestor : REQUESTOR });
        pack.load().then(() => {
            const result = pack.pack(1);
            const data = result.packs[0].data;

            expect(data.a_pos.length).to.be.eql(30);
            expect(data.a_pos).to.be.a(Int16Array);

            expect(data.a_linesofar.length).to.be.eql(20);
            expect(data.a_linesofar).to.a(Uint8Array);

            expect(data.a_normal.length).to.be.eql(20);
            expect(data.a_normal).to.a(Int8Array);

            expect(data.a_extrude.length).to.be.eql(20);
            expect(data.a_extrude).to.a(Uint8Array);

            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });

    it('square line cap', function (done) {
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': {
                    lineWidth : 2,
                    lineOpacity : 0.6,
                    lineColor : '#f00',
                    lineCap : 'square'
                }
            }
        ]);
        const pack = new packer.LinePack(features, styles, { minZoom : 1, maxZoom : 22, requestor : REQUESTOR });
        pack.load().then(() => {
            const result = pack.pack(1);
            const data = result.packs[0].data;

            expect(data.a_pos.length).to.be.eql(18);
            expect(data.a_pos).to.be.a(Int16Array);

            expect(data.a_linesofar.length).to.be.eql(12);
            expect(data.a_linesofar).to.a(Uint8Array);

            expect(data.a_normal.length).to.be.eql(12);
            expect(data.a_normal).to.a(Int8Array);

            expect(data.a_extrude.length).to.be.eql(12);
            expect(data.a_extrude).to.a(Uint8Array);

            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });

    //不同的lineJoin
    //不同的lineCap
});
