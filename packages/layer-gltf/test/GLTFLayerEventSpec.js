describe('gltf layer\'s event', function () {
    let map;
    beforeEach(function() {
        map = createMap();
    });

    afterEach(function() {
        removeMap(map);
    });
    it('gltfmarker responding to mouse click events', function (done) {
        const gltflayer = new maptalks.GLTFLayer('gltf7').addTo(map);
        const marker = new maptalks.GLTFMarker(center, { symbol: { url: url2 }});
        gltflayer.addGeometry(marker);
        marker.on('click', e => {
            const meshId = e.meshId;
            const target = e.target;
            expect(meshId).to.be.eql(0);
            expect(target instanceof maptalks.GLTFMarker).to.be.ok();
            done();
        });
        marker.on('load', () => {
            setTimeout(function () {
                map.fire('dom:click', {
                    coordinate: clickPoint,
                    containerPoint: clickContainerPoint
                });
            }, 100);
        });
    });

    it('can click more than one gltfmarker', function (done) {
        const gltflayer = new maptalks.GLTFLayer('gltf8').addTo(map);
        const markers = [];
        //TODO 每个marker都能响应click事件
        let clickTimes = 0;
        for (let i = 0; i < 5; i++) {
            const marker = new maptalks.GLTFMarker(center.add(0.0005 * i - 0.001, 0), { symbol: { url: url2 }, id: i});
            gltflayer.addGeometry(marker);
            marker.on('click', e => {
                clickTimes++;
                const target = e.target;
                expect(target instanceof maptalks.GLTFMarker).to.be.ok();
                if (clickTimes === 5) {
                    done();
                }
            });
            markers.push(marker);
        }
        gltflayer.on('modelload', () => {
            setTimeout(function () {
                for (let i = 0; i < 5; i++) {
                    map.fire('dom:click', {
                        containerPoint: clickContainerPoint.add(i * 55 - 110, 0)
                    });
                }
            }, 100);
        });
    });

    it('gltfmarker\'s dynamic mouse events', function (done) {
        const gltflayer = new maptalks.GLTFLayer('gltf10').addTo(map);
        const marker = new maptalks.GLTFMarker(center, { symbol: { url: url2 }}, {
            animation:false
        }).addTo(gltflayer);
        marker.on('a b c click', e => {
            const meshId = e.meshId;
            const target = e.target;
            expect(meshId).to.be.eql(0);
            expect(target instanceof maptalks.GLTFMarker).to.be.ok();
            done();
        });
        marker.on('load', () => {
            setTimeout(function () {
                map.fire('dom:click', {
                    coordinate: clickPoint,
                    containerPoint: clickContainerPoint
                });
            }, 100);
        });
    });

    it('gltfmarker\'s add event', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const marker = new maptalks.GLTFMarker(center, { symbol: { url: url1 }});
        marker.on('add', e => {
            expect(e.type).to.be.ok();
            expect(e.target).to.be.ok();
            expect(e.layer).to.be.ok();
            done();
        });
        marker.addTo(gltflayer);
    });

    it('addEvents and removeEvents', function (done) {
        const gltflayer = new maptalks.GLTFLayer('gltf12').addTo(map);
        expect(gltflayer.getMapEvents()).to.be.eql('');
        const marker = new maptalks.GLTFMarker(center, { symbol: { url: url1 }}, {
            animation:false
        }).addTo(gltflayer);
        const handler = function (e) {
            return e;
        };
        marker.on('a b c mouseenter', handler);
        expect(gltflayer.getMapEvents() === 'a b c mouseenter').not.to.be.ok();
        expect(gltflayer.getMapEvents() === 'mousemove').to.be.ok();
        setTimeout(() => {
            marker.off('mouseenter', handler);
            marker.remove();
            expect(gltflayer.getMapEvents() === '').to.be.ok();
            expect(map._eventMap.mousemove).not.to.be.ok();
            done();
        }, 100);
    });

    it('need refresh picking', function (done) {
        const gltflayer = new maptalks.GLTFLayer('gltf12').addTo(map);
        const marker1 = new maptalks.GLTFMarker(center, { symbol: { url: url2 }}, {
            animation:false
        }).addTo(gltflayer);
        marker1.on('click', e => {
            const meshId = e.meshId;
            const target = e.target;
            expect(meshId).to.be.eql(0);
            expect(target instanceof maptalks.GLTFMarker).to.be.ok();
            map.fire('dom:click', {
                containerPoint: clickContainerPoint.add(110, 0)
            });
        });
        const marker2 = marker1.copy().addTo(gltflayer);
        marker2.setCoordinates(center.add(0.001, 0));
        marker2.on('click', e => {
            const meshId = e.meshId;
            const target = e.target;
            expect(meshId).to.be.eql(1);
            expect(target instanceof maptalks.GLTFMarker).to.be.ok();
            done();
        });
        marker1.on('load', () => {
            setTimeout(() => {
                map.fire('dom:click', {
                    containerPoint: clickContainerPoint
                });
            }, 100);
        });
    });
});
