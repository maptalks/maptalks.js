describe('ExtentSpec', function() {

    var container;
    var map;
    var tile;
    var center = new Z.Coordinate(118.846825, 32.046534);
    var layer;

    beforeEach(function() {
        var setups = commonSetupMap(center);
       container = setups.container;
       map = setups.map;
    });

    afterEach(function() {
        map.removeLayer(layer);
        removeContainer(container)
    });

    describe('extent constructor', function() {
        //verify extent instance
        function verify(extent) {
            expect(extent['xmin']).to.be(1);
            expect(extent['ymin']).to.be(2);
            expect(extent['xmax']).to.be(3);
            expect(extent['ymax']).to.be(4);
        }

        it('has 2 constructors', function() {
            //constructor 1
            var extent = new Z.Extent(1,2,3,4);
            verify(extent);

            var extent = new Z.Extent(3,4,1,2);
            verify(extent);

            //constructor 2
            extent = new Z.Extent(new Z.Coordinate(1,2), new Z.Coordinate(3,4));
            verify(extent);

            extent = new Z.Extent(new Z.Coordinate(3,4), new Z.Coordinate(1,2));
            verify(extent);
        });
    });


    describe("extent instance methods",function() {
        it('is valid',function() {
            var extent = new Z.Extent(1,2,3,4);
            expect(extent.isValid()).to.be.ok();

            var extent2 = new Z.Extent(NaN, 2, 3, 4);
            expect(extent2.isValid()).to.not.be.ok();


        });

        it('is invalid',function() {
            var extent3 = new Z.Extent();
            expect(extent3.isValid()).to.not.be.ok();

            var extent3 = new Z.Extent(null, 2, 3, 4);
            expect(extent3.isValid()).to.not.be.ok();

            var extent4 = new Z.Extent(undefined, 2, 3, 4);
            expect(extent4.isValid()).to.not.be.ok();
        });

        it('equals',function() {
            var ext1 = new Z.Extent(1,2,3,4);
            expect(ext1.equals(new Z.Extent(1,2,3,4))).to.be.ok();
            expect(ext1.equals(new Z.Extent(2,2,4,4))).to.not.be.ok();

            //2 empty extents are equal
            var ext1 = new Z.Extent();
            expect(ext1.equals(new Z.Extent())).to.be.ok();
        });

        it('toJSON',function() {
            var ext1 = new Z.Extent(1,2,3,4);
            var json = ext1.toJSON();
            expect(json).to.eql({
                'xmin':1,
                'ymin':2,
                'xmax':3,
                'ymax':4
            });
        });

        it('intersects',function() {
            var ext1 = new Z.Extent(1,1,4,4);

            expect(ext1.intersects(new Z.Extent(2,2,3,3))).to.be.ok();
            expect(ext1.intersects(new Z.Extent(20,20,30,30))).to.not.be.ok();

        });

        it('contains',function() {
            var ext1 = new Z.Extent(1,1,4,4);

            expect(ext1.contains(new Z.Point(2,2))).to.be.ok();
            expect(ext1.contains(new Z.Point(20,20))).to.not.be.ok();
        });

    });


    describe("extent static methods", function() {

        it('combines',function() {
            var ext1 = new Z.Extent(1,1,2,2);
            var ext2 = new Z.Extent(2, 2, 4, 4);

            var combined = ext1.combine(ext2);

            expect(combined.equals(new Z.Extent(1,1,4,4))).to.be.ok();

            var combined2 = ext1.combine(new Z.Extent());
            expect(combined2.equals(ext1)).to.be.ok();
        });

        it('expand',function() {
            var ext = new Z.Extent(1,2,3,4);
            var expanded = ext.expand(10);
            expect(expanded.equals(new Z.Extent(-9,-8,13,14))).to.be.ok();

            expanded = ext.expand(0);
            expect(expanded.equals(ext)).to.be.ok();

            var empty = new Z.Extent();
            expanded = empty.expand(1);
            expect(expanded.equals(new Z.Extent(-1,-1,1,1))).to.be.ok();
        });
    });

});
