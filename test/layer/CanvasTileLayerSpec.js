describe('CanvasTileLayer', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '3px';
        container.style.height = '3px';
        document.body.appendChild(container);
        var option = {
            zoom: 17,
            center: center
        };
        map = new maptalks.Map(container, option);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    describe('add to map', function () {
        it('add as canvas renderer', function (done) {
            var tile = new maptalks.CanvasTileLayer('tile', {
                fadeAnimation : false,
                urlTemplate : TILE_IMAGE,
                renderer: 'canvas'
            });
            tile.drawTile = function (canvas, tileContext, onComplete) {
                var ctx = canvas.getContext('2d');
                ctx.fillStyle = 'Red';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                onComplete(null);
            };
            tile.once('layerload', function () {
                expect(tile).to.be.painted(0, 0, [255, 0, 0]);
                done();
            });
            map.addLayer(tile);
        });

        it('add as gl renderer', function (done) {
            if (!maptalks.Browser.webgl) {
                done();
                return;
            }
            var tile = new maptalks.CanvasTileLayer('tile', {
                fadeAnimation : false,
                urlTemplate : TILE_IMAGE,
                renderer : 'gl'
            });
            tile.drawTile = function (canvas, tileContext, onComplete) {
                var ctx = canvas.getContext('2d');
                ctx.fillStyle = 'Red';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                onComplete(null);
            };
            tile.once('layerload', function () {
                expect(tile).to.be.painted(0, 0, [255, 0, 0]);
                done();
            });
            map.addLayer(tile);
        });
    });

});
