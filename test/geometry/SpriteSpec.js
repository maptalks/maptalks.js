import Browser from 'core/Browser';
import {
    Marker,
    Geometry
} from 'geometry';
import {
    Canvas
} from 'renderer';

describe('#Sprite', function () {

    it('image sprite', function (done) {
        var url = 'http://localhost:12345/resources/pattern.png';
        var marker = new Marker([0, 0], {
            symbol: {
                'markerFile': url,
                'markerWidth': 80,
                'markerHeight': 60,
                'markerDx': 10,
                'markerDy': 5
            }
        });
        var symbol = marker.getSymbol();
        var image = new Image();
        image.onload = function () {
            var resources = new Canvas.Resources();
            resources.addResource([url], image);
            var sprite = marker._getSprite(resources);
            var canvas = sprite.canvas;
            expect(canvas).to.be.ok();
            expect(sprite.offset.x).to.be.eql(0 + 10);
            expect(sprite.offset.y).to.be.eql(-60 / 2 + 5);
            expect(canvas.getContext('2d').getImageData(40, 30, 1, 1).data[3]).to.be.above(0);
            expect(canvas.width).to.be.eql(symbol.markerWidth);
            expect(canvas.height).to.be.eql(symbol.markerHeight);
            done();
        };
        image.src = url;
    });

    it('image sprite without markerWidth and markerHeight', function (done) {
        var url = 'http://localhost:12345/resources/pattern.png';
        var marker = new Marker([0, 0], {
            symbol: {
                'markerFile': url,
                'markerDx': 10,
                'markerDy': 5
            }
        });
        var image = new Image();
        image.onload = function () {
            var resources = new Canvas.Resources();
            resources.addResource([url], image);
            var sprite = marker._getSprite(resources);
            var canvas = sprite.canvas;
            expect(canvas).to.be.ok();
            expect(sprite.offset.x).to.be.eql(0 + 10);
            expect(sprite.offset.y).to.be.eql(-image.height / 2 + 5);
            expect(canvas.getContext('2d').getImageData(10, 10, 1, 1).data[3]).to.be.above(0);
            expect(canvas.width).to.be.eql(image.width);
            expect(canvas.height).to.be.eql(image.height);
            done();
        };
        image.src = url;
    });

    it('composite symbol sprite', function (done) {
        var url = 'http://localhost:12345/resources/pattern.png';
        var marker = new Marker([0, 0], {
            symbol: [{
                'markerFile': url,
                'markerWidth': 20,
                'markerHeight': 20,
                'markerDx': 50,
                'markerDy': 5
            }, {
                'markerType': 'ellipse',
                'markerWidth': 80,
                'markerHeight': 70
            }]
        });
        var image = new Image();
        image.onload = function () {
            var resources = new Canvas.Resources();
            resources.addResource([url], image);
            var sprite = marker._getSprite(resources);
            var canvas = sprite.canvas;
            expect(canvas).to.be.ok();
            expect(sprite.offset.x).to.be.eql(9.75);
            expect(sprite.offset.y).to.be.eql(0);
            expect(canvas.getContext('2d').getImageData(40, 30, 1, 1).data[3]).to.be.above(0);
            expect(canvas.width).to.be.eql(80 / 2 + 50 + 20 / 2);
            expect(canvas.height).to.be.eql(71);
            done();
        };
        image.src = url;
    });

    it('vector marker sprite: ellipse', function () {
        var marker = new Marker([0, 0], {
            symbol: {
                'markerType': 'ellipse',
                'markerWidth': 80,
                'markerHeight': 70,
                'markerDx': 10,
                'markerDy': 5
            }
        });
        var symbol = marker.getSymbol();
        var sprite = marker._getSprite();
        var canvas = sprite.canvas;
        expect(canvas).to.be.ok();
        expect(canvas.getContext('2d').getImageData(40, 30, 1, 1).data[3]).to.be.above(0);
        expect(sprite.offset.x).to.be.eql(10);
        expect(sprite.offset.y).to.be.eql(5);
        expect(canvas.width).to.be.eql(symbol.markerWidth + 1); // +1 cos of lineWidth
        expect(canvas.height).to.be.eql(symbol.markerHeight + 1); // +1 cos of lineWidth
    });

    it('vector marker sprite: bar', function () {
        var marker = new Marker([0, 0], {
            symbol: {
                'markerType': 'bar',
                'markerWidth': 80,
                'markerHeight': 70,
                'markerDx': 10,
                'markerDy': 5
            }
        });
        var symbol = marker.getSymbol();
        var sprite = marker._getSprite();
        var canvas = sprite.canvas;
        expect(canvas).to.be.ok();
        expect(canvas.getContext('2d').getImageData(40, 30, 1, 1).data[3]).to.be.above(0);
        expect(sprite.offset.x).to.be.eql(10);
        expect(sprite.offset.y).to.be.eql(-35 + 5);
        expect(canvas.width).to.be.eql(symbol.markerWidth + 1); // +1 cos of lineWidth
        expect(canvas.height).to.be.eql(symbol.markerHeight + 1); // +1 cos of lineWidth
    });

    it('vector path marker sprite', function (done) {
        var marker = new Marker([0, 0], {
            symbol: {
                'markerType': 'path',
                'markerPath': [{
                    'path': 'M8 23l0 0 0 0 0 0 0 0 0 0c-4,-5 -8,-10 -8,-14 0,-5 4,-9 8,-9l0 0 0 0c4,0 8,4 8,9 0,4 -4,9 -8,14z M5,9 a3,3 0,1,0,0,-0.9Z',
                    'fill': '#DE3333'
                }],
                'markerPathWidth': 16,
                'markerPathHeight': 23,
                'markerWidth': 80,
                'markerHeight': 70,
                'markerDx': 10,
                'markerDy': 5
            }
        });
        var symbol = marker.getSymbol();

        if (Browser.phantomjs) {
            // unlike chrome, in phantomjs, the image with svg base64 can't be loaded immediately.
            var url = Geometry.getMarkerPathBase64(symbol);
            var img = new Image();
            img.onload = function () {
                var sprite = marker._getSprite();
                var canvas = sprite.canvas;
                expect(sprite.offset.x).to.be.eql(0 + 10);
                expect(sprite.offset.y).to.be.eql(-70 / 2 + 5);
                expect(canvas.getContext('2d').getImageData(40, 15, 1, 1).data[3]).to.be.above(0);
                expect(canvas.width).to.be.eql(symbol.markerWidth);
                expect(canvas.height).to.be.eql(symbol.markerHeight);
                done();
            };
            img.src = url;
        } else {
            var sprite = marker._getSprite();
            var canvas = sprite.canvas;
            expect(sprite.offset.x).to.be.eql(0 + 10);
            expect(sprite.offset.y).to.be.eql(-70 / 2 + 5);
            expect(canvas).to.be.ok();
            expect(canvas.getContext('2d').getImageData(40, 15, 1, 1).data[3]).to.be.above(0);
            expect(canvas.width).to.be.eql(symbol.markerWidth);
            expect(canvas.height).to.be.eql(symbol.markerHeight);
            done();
        }
    });

    it('text marker sprite', function () {
        var marker = new Marker([0, 0], {
            symbol: {
                'textName': '■■■■■■■■■',
                'textSize': 20,
                'textDx': 10,
                'textDy': 20
            }
        });
        var sprite = marker._getSprite().canvas;
        expect(sprite).to.be.ok();
        expect(sprite.getContext('2d').getImageData(10, 10, 1, 1).data[3]).to.be.above(0);
    });
});
