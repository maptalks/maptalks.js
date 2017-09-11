
describe('#Size', function () {
    describe('has constructors', function () {
        it('can be created with width and height', function () {
            var s = new maptalks.Size(1, 2);
            expect(s.width).to.be.eql(1);
            expect(s.height).to.be.eql(2);
        });

        it('can be created with an array', function () {
            var s = new maptalks.Size([1, 2]);
            expect(s.width).to.be.eql(1);
            expect(s.height).to.be.eql(2);
        });

        it('can be created with an object', function () {
            var s = new maptalks.Size({ width : 1, height : 2 });
            expect(s.width).to.be.eql(1);
            expect(s.height).to.be.eql(2);
        });
    });


    describe('has operations', function () {
        it('can copy', function () {
            var c = new maptalks.Size(2, 3);
            var t = c.copy();
            expect(c.width).to.be.eql(2);
            expect(c.height).to.be.eql(3);
            expect(t.width).to.be.eql(2);
            expect(t.height).to.be.eql(3);
        });

        it('can add', function () {
            var c = new maptalks.Size(2, 3);
            var t = c.add(new maptalks.Size(1, 2));
            expect(c.width).to.be.eql(2);
            expect(c.height).to.be.eql(3);
            expect(t.width).to.be.eql(3);
            expect(t.height).to.be.eql(5);

            t = c.add(1, 2);
            expect(t.width).to.be.eql(3);
            expect(t.height).to.be.eql(5);
        });

        it('can decide whether is equal', function () {
            var c1 = new maptalks.Size(2, 3);
            var c2 = new maptalks.Size(2, 3);
            expect(c1.equals(c2)).to.be.ok();
            expect(c1.equals(new maptalks.Size(2, 3.1))).not.to.be.ok();
        });

        it('can _multi which is destructive', function () {
            var c = new maptalks.Size(2, 3);
            var t = c._multi(3);
            expect(c.width).to.be.eql(6);
            expect(c.height).to.be.eql(9);
            expect(t.width).to.be.eql(6);
            expect(t.height).to.be.eql(9);
        });

        it('can multi', function () {
            var c = new maptalks.Size(2, 3);
            var t = c.multi(3);
            expect(c.width).to.be.eql(2);
            expect(c.height).to.be.eql(3);
            expect(t.width).to.be.eql(6);
            expect(t.height).to.be.eql(9);
        });

        it('can _round which is destructive', function () {
            var c = new maptalks.Size(2.1, 3.5);
            var t = c._round();
            expect(c.width).to.be.eql(2);
            expect(c.height).to.be.eql(4);
            expect(t.width).to.be.eql(2);
            expect(t.height).to.be.eql(4);
        });

        it('can toJSON', function () {
            var c = new maptalks.Size(2, 3);
            var t = c.toJSON();
            expect(t).to.be.eql({
                width : 2,
                height : 3
            });
        });
    });
});
