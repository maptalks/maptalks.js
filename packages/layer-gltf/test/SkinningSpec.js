describe('skinning', () => {
    let map;
    beforeEach(function() {
        map = createMap();
    });

    afterEach(function() {
        removeMap(map);
    });

    it('add gltf marker with skinning', (done) => {
        const layer = new maptalks.GLTFLayer('layer').addTo(map);
        const marker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url11,
                animation: true,
                loop: false
            }
        }).addTo(layer);
        //TODO loop是false，动画结束，绘制的是否正确，做像素判断
        marker.on('load', () => {
            setTimeout(function() {
                const pixel = pickPixel(map, 206, 188, 1, 1);
                expect(hasColor(pixel)).to.be.ok();
            }, 1000);
            setTimeout(function() {
                const pixel = pickPixel(map, 206, 188, 1, 1);
                expect(hasColor(pixel)).not.to.be.ok();
                done();
            }, 3000);
        });
    });

    //TODO 增加像素判断
    it('skinning animation should not affect each other', (done) => {
        const layer = new maptalks.GLTFLayer('layer').addTo(map);
        const marker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url11,
                animation: false
            }
        }).addTo(layer);
        marker.on('load', () => {
            const copy = marker.copy().addTo(layer);
            copy.setCoordinates(center.add(0.0005, 0));
            copy.setAnimation(true);
            copy.setAnimationLoop(true);
            setTimeout(function() {
                const pixel1 = pickPixel(map, 206, 188, 1, 1);
                const pixel2 = pickPixel(map, 206 + 20, 188, 1, 1);
                expect(hasColor(pixel1)).to.be.ok();
                expect(hasColor(pixel2)).not.to.be.ok();
                done();
            }, 1000);
        });
    })

    //TODO loop是true，在某个时间判断像素绘制的是否正确
    //TODO loop设置为false, 在某个时间，判断绘制像素是否不变
    //TODO 再次打开loop, 在某个时间，判断绘制像素是否正确
    it('set animation loop', (done) => {
        const layer = new maptalks.GLTFLayer('layer').addTo(map);
        const marker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url11,
                animation: true,
                loop: false
            }
        }).addTo(layer);
        marker.on('load', () => {
            setTimeout(function() {
                const pixel = pickPixel(map, 209, 195, 1, 1);
                expect(hasColor(pixel)).to.be.ok();
                marker.setAnimationLoop(true);
            }, 1000);
            setTimeout(function() {
                const pixel = pickPixel(map, 209, 195, 1, 1);
                expect(hasColor(pixel)).to.be.ok();
                marker.setAnimationLoop(false);
            }, 2000);
            setTimeout(function() {
                const pixel = pickPixel(map, 209, 195, 1, 1);
                expect(hasColor(pixel)).not.to.be.ok();
                done()
            }, 4500);
        });
    });
});
