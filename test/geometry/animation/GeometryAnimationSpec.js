
describe('#GeometryAnimation', function () {
    describe('geometry can animate', function() {
        it('all kinds of geometry', function() {
            var geometries = genAllTypeGeometries();
            for (var i = 0; i < geometries.length; i++) {
                geometries[i].animate({
                    translate:[0.01,0.01]
                });
            };
        });
    });


});
