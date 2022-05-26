describe('Coordinate', function () {

    describe('has various constructors', function () {
        it('can be created by a coordinate array', function () {
            var c = new maptalks.Coordinate([0, 0]);
            expect(c.x).to.be.eql(0);
            expect(c.y).to.be.eql(0);
        });

        it('can be created by x,y', function () {
            var c = new maptalks.Coordinate(0, 0);
            expect(c.x).to.be.eql(0);
            expect(c.y).to.be.eql(0);
        });

        it('can be created by a object with x,y', function () {
            var c = new maptalks.Coordinate({ x: 0, y: 0 });
            expect(c.x).to.be.eql(0);
            expect(c.y).to.be.eql(0);
        });

        it('can be created by another coordinate', function () {
            var c = new maptalks.Coordinate(new maptalks.Coordinate(0, 0));
            expect(c.x).to.be.eql(0);
            expect(c.y).to.be.eql(0);
        });

        it('throws a error with NaN', function () {
            expect(function () {
                new maptalks.Coordinate(NaN, 0);
            }).to.throwException();

        });
    });

    describe('has operations', function () {
        it('can add', function () {
            var c = new maptalks.Coordinate(new maptalks.Coordinate(0, 0));
            var t = c.add(new maptalks.Coordinate(1, 1));
            expect(c.x).to.be.eql(0);
            expect(c.y).to.be.eql(0);
            expect(t.x).to.be.eql(1);
            expect(t.y).to.be.eql(1);
        });

        it('can _add which is destructive', function () {
            var c = new maptalks.Coordinate(new maptalks.Coordinate(0, 0));
            var t = c._add(new maptalks.Coordinate(1, 1));
            expect(c.x).to.be.eql(1);
            expect(c.y).to.be.eql(1);
            expect(t.x).to.be.eql(1);
            expect(t.y).to.be.eql(1);
        });

        it('can substract', function () {
            var c = new maptalks.Coordinate(new maptalks.Coordinate(0, 0));
            var t = c.substract(new maptalks.Coordinate(1, 1));
            expect(c.x).to.be.eql(0);
            expect(c.y).to.be.eql(0);
            expect(t.x).to.be.eql(-1);
            expect(t.y).to.be.eql(-1);
        });

        it('can _substract which is destructive', function () {
            var c = new maptalks.Coordinate(new maptalks.Coordinate(0, 0));
            var t = c._substract(new maptalks.Coordinate(1, 1));
            expect(c.x).to.be.eql(-1);
            expect(c.y).to.be.eql(-1);
            expect(t.x).to.be.eql(-1);
            expect(t.y).to.be.eql(-1);
        });

        it('can multi', function () {
            var c = new maptalks.Coordinate(new maptalks.Coordinate(2, 3));
            var t = c.multi(3);
            expect(c.x).to.be.eql(2);
            expect(c.y).to.be.eql(3);
            expect(t.x).to.be.eql(6);
            expect(t.y).to.be.eql(9);
        });

        it('can decide whether is equal', function () {
            var c1 = new maptalks.Coordinate(new maptalks.Coordinate(2, 3));
            var c2 = new maptalks.Coordinate(new maptalks.Coordinate(2, 3));
            expect(c1.equals(c2)).to.be.ok();
            expect(c1.equals([])).not.to.be.ok();
            expect(c1.equals(new maptalks.Coordinate(2, 3.1))).not.to.be.ok();
        });

        it('can toArray', function () {
            var c1 = new maptalks.Coordinate(new maptalks.Coordinate(2, 3));
            expect(c1.toArray()).to.be.eql([2, 3]);
        });

        it('can toJSON', function () {
            var c = new maptalks.Coordinate(-2, -3);
            var t = c.toJSON();
            expect(t).to.be.eql({
                x: -2,
                y: -3
            });
        });
    });




});

