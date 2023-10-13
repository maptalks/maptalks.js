describe('gltf layer\'s event', function () {
    let map, eventContainer;
    beforeEach(function() {
        map = createMap();
        eventContainer = map._panels.canvasContainer;
    });

    afterEach(function() {
        removeMap(map);
    });
    it('gltfmarker responding to mouse click events', function (done) {
        const gltflayer = new maptalks.GLTFLayer('gltf7').addTo(map);
        const marker = new maptalks.GLTFGeometry(center, { symbol: { url: url2,
            scaleX: 80,
            scaleY: 80,
            scaleZ: 80
        }});
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
                happen.click(eventContainer, {
                    'clientX':clickContainerPoint.x,
                    'clientY':clickContainerPoint.y
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
            const marker = new maptalks.GLTFGeometry(center.add(0.0005 * i - 0.001, 0), { symbol: { url: url2,
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80
            }, id: i});
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
                    happen.click(eventContainer, {
                        'clientX':clickContainerPoint.x + i * 55 - 110,
                        'clientY':clickContainerPoint.y
                    });
                }
            }, 100);
        });
    });

    it('gltfmarker\'s dynamic mouse events', function (done) {
        const gltflayer = new maptalks.GLTFLayer('gltf10').addTo(map);
        const marker = new maptalks.GLTFGeometry(center, { symbol: { url: url2,
            scaleX: 80,
            scaleY: 80,
            scaleZ: 80
        }}, {
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
                happen.click(eventContainer, {
                    'clientX':clickContainerPoint.x,
                    'clientY':clickContainerPoint.y
                });
            }, 100);
        });
    });

    it('gltfmarker\'s add event', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const marker = new maptalks.GLTFGeometry(center, { symbol: { url: url1,
            scaleX: 10,
            scaleY: 10,
            scaleZ: 10
        }});
        marker.on('add', e => {
            expect(e.type).to.be.ok();
            expect(e.target).to.be.ok();
            expect(e.layer).to.be.ok();
            done();
        });
        marker.addTo(gltflayer);
    });

    it('need refresh picking', function (done) {
        const gltflayer = new maptalks.GLTFLayer('gltf12').addTo(map);
        const marker1 = new maptalks.GLTFGeometry(center, { symbol: { url: url2,
            scaleX: 80,
            scaleY: 80,
            scaleZ: 80
        }}, {
            animation:false
        }).addTo(gltflayer);
        marker1.on('click', e => {
            const meshId = e.meshId;
            const target = e.target;
            expect(meshId).to.be.eql(0);
            expect(target instanceof maptalks.GLTFMarker).to.be.ok();
            happen.click(eventContainer, {
                'clientX':clickContainerPoint.x + 110,
                'clientY':clickContainerPoint.y
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
                happen.click(eventContainer, {
                    'clientX':clickContainerPoint.x,
                    'clientY':clickContainerPoint.y
                });
            }, 100);
        });
    });
});
