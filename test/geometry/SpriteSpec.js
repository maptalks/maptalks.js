describe('#Sprite', function() {

    it('image sprite', function(done) {
        var marker = new maptalks.Marker([0, 0], {
            symbol : {
                'markerFile' : '../resources/red01.png',
                'markerWidth' : 80,
                'markerHeight' : 60,
                'markerDx' : 10,
                'markerDy' : 5
            }
        });
        var symbol = marker.getSymbol();
        var image = new Image();
        image.onload = function () {
            var resources = new maptalks.renderer.Canvas.Resources();
            resources.addResource(['http://resources/red01.png'], image);
            var sprite = marker._getPainter().getSprite(resources).canvas;
            expect(sprite).to.be.ok();
            expect(sprite.getContext('2d').getImageData(40, 30, 1, 1).data[3]).to.be.above(0);
            expect(sprite.width).to.be.eql(symbol.markerWidth);
            expect(sprite.height).to.be.eql(symbol.markerHeight);
            done();
        }
        image.src = '../resources/red01.png';
    });

    it('vector marker sprite', function() {
        var marker = new maptalks.Marker([0, 0], {
            symbol : {
                'markerType' : 'ellipse',
                'markerWidth' : 80,
                'markerHeight' : 70,
                'markerDx' : 10,
                'markerDy' : 5
            }
        });
        var symbol = marker.getSymbol();
        var sprite = marker._getPainter().getSprite().canvas;
        expect(sprite).to.be.ok();
        expect(sprite.getContext('2d').getImageData(40, 30, 1, 1).data[3]).to.be.above(0);
        expect(sprite.width).to.be.eql(symbol.markerWidth + 1); // +1 cos of lineWidth
        expect(sprite.height).to.be.eql(symbol.markerHeight + 1); // +1 cos of lineWidth
    });

    it('text marker sprite', function() {
        var marker = new maptalks.Marker([0, 0], {
            symbol : {
                'textName' : '■■■■■■■■■',
                'textSize' : 20,
                'textDx' : 10,
                'textDy' : 20
            }
        });
        var symbol = marker.getSymbol();
        var sprite = marker._getPainter().getSprite().canvas;
        expect(sprite).to.be.ok();
        expect(sprite.getContext('2d').getImageData(10, 10, 1, 1).data[3]).to.be.above(0);
        console.log(sprite.width, sprite.height)
    });

    it('vector path marker sprite', function(done) {
        var marker = new maptalks.Marker([0, 0], {
            symbol : {
                'markerType' : 'path',
                'markerPath' : [
                    {
                        'path' : 'M8 23l0 0 0 0 0 0 0 0 0 0c-4,-5 -8,-10 -8,-14 0,-5 4,-9 8,-9l0 0 0 0c4,0 8,4 8,9 0,4 -4,9 -8,14z M5,9 a3,3 0,1,0,0,-0.9Z',
                        'fill' : '#DE3333'
                    }
                ],
                'markerPathWidth' : 16,
                'markerPathHeight' : 23,
                'markerWidth' : 80,
                'markerHeight' : 70,
                'markerDx' : 10,
                'markerDy' : 5
            }
        });
        var symbol = marker.getSymbol();
        var sprite = marker._getPainter().getSprite().canvas;
        expect(sprite).to.be.ok();
        expect(sprite.getContext('2d').getImageData(40, 10, 1, 1).data[3]).to.be.above(0);
        expect(sprite.width).to.be.eql(symbol.markerWidth);
        expect(sprite.height).to.be.eql(symbol.markerHeight);
        done();

    });
});
