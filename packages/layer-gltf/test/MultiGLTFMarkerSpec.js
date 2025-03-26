describe('MultiGLTFMarker', () => {
    let map, eventContainer;
    beforeEach(function() {
        map = createMap();
        eventContainer = map._panels.canvasContainer;
    });

    afterEach(function() {
        removeMap(map);
    });

    function initInstanceData0() {
        const data = [];
        const coordinate = center.add(0, 0);
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                data.push({
                    coordinates: coordinate.add(i * 0.0005 - 0.0025, j * 0.0005 - 0.0025),
                    translation: [0, 0, 0],
                    scale: [0.5, 0.5, 0.5],
                    color: [1.0, 1.0, 1.0, 0.6]
                });
            }
        }
        return data;
    }

    function initInstanceData1() {
        const data = [];
        const coordinate0 = center.add(-0.02, -0.02);
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
                data.push({
                    coordinates: coordinate0.add(i * 0.01, j * 0.01),
                    translation: [0, 0, 0],
                    scale: [1, 1, 1],
                    color: [0.2, 0.4, 0.91, 0.9]
                });
            }
        }
        return data;
    }

    function initInstanceData2(height) {
        const data = [];
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                const coord = new maptalks.Coordinate(i * 0.0005 - 0.0025, j * 0.0005 - 0.0025, height);
                data.push({
                    coordinates: coord,
                    translation: [0, 0, 0],
                    scale: [0.5, 0.5, 0.5],
                    color: [1.0, 1.0, 1.0, 0.6]
                });
            }
        }
        return data;
    }

    function initInstanceData3() {
        const data = [];
        const coordinate = center.add(0, 0);
        for (let i = -1; i < 1; i++) {
            for (let j = -1; j < 1; j++) {
                data.push({
                    coordinates: coordinate.add(i * 0.001, j * 0.001)
                });
            }
        }
        return data;
    }

    function initInstanceDataWithBloom() {
        const data = [];
        const coordinate0 = center.add(0, 0);
        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                data.push({
                    coordinates: coordinate0.add(i * 0.001, j * 0.001),
                    bloom: i === 0 && j === 0
                });
            }
        }
        return data;
    }

    function initInstanceDataInArray(height) {
        const data = [];
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                const coord = new maptalks.Coordinate(i * 0.0005 - 0.0025, j * 0.0005 - 0.0025, height);
                data.push({
                    coordinates: coord.toArray(),
                    translation: [0, 0, 0],
                    scale: [0.5, 0.5, 0.5],
                    color: [1.0, 1.0, 1.0, 0.6]
                });
            }
        }
        return data;
    }

    it('addData', (done) => {//TODO 增加像素判断
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const importData = initInstanceData0();
        const multigltfmarker = new maptalks.MultiGLTFMarker(importData, {
            symbol: {
                url: url2,
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80
            }
        }).addTo(gltflayer);
        multigltfmarker.addData({
            coordinates: center.add(-0.005, -0.005)
        });
        multigltfmarker.on('load', () => {
            const count = multigltfmarker.getCount();
            expect(count).to.be.equal(101);
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([143, 143, 143, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2, map.height / 2 - 50, 1, 1);
                expect(pixelMatch([129, 129, 129, 255], pixel2)).to.be.eql(true);
                const pixel3 = pickPixel(map, map.width / 2 + 50, map.height / 2 - 50, 1, 1);
                expect(pixelMatch([129, 129, 129, 255], pixel3)).to.be.eql(true);
                const pixel4 = pickPixel(map, map.width / 2 + 50, map.height / 2, 1, 1);
                expect(pixelMatch([143, 143, 143, 255], pixel4)).to.be.eql(true);
                done();
            }, 100);
        });
    });

    it('removeData', (done) => {//TODO 增加像素判断
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const importData = initInstanceData0();
        const multigltfmarker = new maptalks.MultiGLTFMarker(importData, {
            symbol: {
                url: url2,
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80
            }
        }).addTo(gltflayer);
        multigltfmarker.removeData(55);
        const count = multigltfmarker.getCount();
        expect(count).to.be.equal(99);
        multigltfmarker.on('load', () => {
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([0, 0, 0, 0], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2, map.height / 2 - 50, 1, 1);
                expect(pixelMatch([129, 129, 129, 255], pixel2)).to.be.eql(true);
                const pixel3 = pickPixel(map, map.width / 2 + 50, map.height / 2 - 50, 1, 1);
                expect(pixelMatch([129, 129, 129, 255], pixel3, 50)).to.be.eql(true);
                const pixel4 = pickPixel(map, map.width / 2 + 50, map.height / 2, 1, 1);
                expect(pixelMatch([143, 143, 143, 255], pixel4, 50)).to.be.eql(true);
                done();
            }, 100);
        });
    });

    it('updateData', (done) => {//TODO 增加像素判断
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const importData = initInstanceData0();
        const multigltfmarker = new maptalks.MultiGLTFMarker(importData, {
            symbol: {
                url: url2,
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80
            }
        }).addTo(gltflayer);
        multigltfmarker.updateData(4, 'coordinates', new maptalks.Coordinate([-0.001, -0.001]));
        const dataItem = multigltfmarker.getData(4);
        expect(dataItem.coordinates).to.be.eql(new maptalks.Coordinate([-0.001, -0.001]));
        multigltfmarker.on('load', () => {
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2 - 50, map.height / 2 + 50, 1, 1);
                expect(pixelMatch([77, 102, 83, 255], pixel1)).to.be.eql(true);
                done();
            }, 100);
        });
    });

    it('add to two layers', () => {
        const gltflayer1 = new maptalks.GLTFLayer('gltf1').addTo(map);
        const gltflayer2 = new maptalks.GLTFLayer('gltf2').addTo(map);
        const importData = initInstanceData0();
        const multigltfmarker1 = new maptalks.MultiGLTFMarker(importData, {
            symbol: {
                url: url2,
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80
            }
        }).addTo(gltflayer1);
        const multigltfmarker2 = new maptalks.MultiGLTFMarker(importData, {
            symbol: {
                url: url2,
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80
            }
        }).addTo(gltflayer2);
        expect(multigltfmarker1.getIndexByPickingId(0)).to.be.eql(0);
        expect(multigltfmarker2.getIndexByPickingId(0)).to.be.eql(0);
    });

    it('update symbol', () => {
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const importData = initInstanceData0();
        const multigltfmarker = new maptalks.MultiGLTFMarker(importData, {
            symbol: {
                url: url2,
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80
            }
        }).addTo(gltflayer);
        multigltfmarker.setUrl(url1);
        multigltfmarker.setTranslation(10, 0, 0);
        multigltfmarker.setScale(2, 2, 2);
        multigltfmarker.setRotation(90, 60, 0);
        multigltfmarker.setUniform('specularStrength', 0.1);
        const url = multigltfmarker.getUrl();
        const translation = multigltfmarker.getTranslation();
        const scale = multigltfmarker.getScale();
        const rotation = multigltfmarker.getRotation();
        const specularStrength = multigltfmarker.getUniform('specularStrength');
        expect(url).to.be.eql(url1);
        expect(translation).to.be.eql([10, 0, 0]);
        expect(scale).to.be.eql([2, 2, 2]);
        expect(rotation).to.be.eql([90, 60, 0]);
        expect(specularStrength).to.be.eql(0.1);
    });

    it('set coordinates', (done) => {//TODO 增加像素判断
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const importData = initInstanceData0();
        const multigltfmarker = new maptalks.MultiGLTFMarker(importData, {
            symbol: {
                url: url2,
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80
            }
        }).addTo(gltflayer);
        const coordinates = [];
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                coordinates.push(center.add(-i * 0.0005, -j * 0.0005));
            }
        }
        multigltfmarker.setCoordinates(coordinates);
        multigltfmarker.on('load', () => {
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([143, 143, 143, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2, map.height / 2 + 50, 1, 1);
                expect(pixelMatch([151, 151, 151, 255], pixel2)).to.be.eql(true);
                const pixel3 = pickPixel(map, map.width / 2 - 50, map.height / 2 + 50, 1, 1);
                expect(pixelMatch([77, 102, 84, 255], pixel3)).to.be.eql(true);
                const pixel4 = pickPixel(map, map.width / 2 - 50, map.height / 2, 1, 1);
                expect(pixelMatch([91, 105, 74, 255], pixel4)).to.be.eql(true);
                done();
            }, 100);
        });
    });

    it('change shader', () => {
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const importData = initInstanceData1();
        const multigltfmarker = new maptalks.MultiGLTFMarker(importData, {
            symbol: {
                url: url2,
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80
            }
        }).addTo(gltflayer);
        multigltfmarker.setShader('wireframe');
        const shader = multigltfmarker.getShader();
        expect(shader).to.be.eql('wireframe');
    });

    it('fromJSON and toJSON', () => { //TODO 打印JSON判断是否正确
        const importData = initInstanceData1();
        const symbol  = {
            url: url1,
            translation: [0, 0, 0],
            rotation: [0, 0, 90],
            scale: [1, 1, 1]
        };
        const properties = [{
            ID: '1',
            NAME: 'name',
            TYPE: 'type'
        }];
        const json = {
            data: importData,
            options: {
                symbol,
                properties
            }
        };
        const multigltfmarker = maptalks.MultiGLTFMarker.fromJSON(json);
        const resultJosn = multigltfmarker.toJSON();
        expect(JSON.stringify(resultJosn)).to.be.eql(`{"data":[{"coordinates":{"x":-0.02,"y":-0.02},"translation":[0,0,0],"scale":[1,1,1],"color":[0.2,0.4,0.91,0.9]},{"coordinates":{"x":-0.02,"y":-0.01},"translation":[0,0,0],"scale":[1,1,1],"color":[0.2,0.4,0.91,0.9]},{"coordinates":{"x":-0.01,"y":-0.02},"translation":[0,0,0],"scale":[1,1,1],"color":[0.2,0.4,0.91,0.9]},{"coordinates":{"x":-0.01,"y":-0.01},"translation":[0,0,0],"scale":[1,1,1],"color":[0.2,0.4,0.91,0.9]}],"options":{"symbol":{"url":"models/cube-animation/cube.gltf","translation":[0,0,0],"rotation":[0,0,90],"scale":[1,1,1]},"properties":{"0":{"ID":"1","NAME":"name","TYPE":"type"}}},"type":"MultiGLTFMarker"}`);
    });

    it('simple model', (done) => {//TODO 增加像素判断
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const importData = initInstanceData0();
        const multigltfmarker = new maptalks.MultiGLTFMarker(importData, {
            symbol: {
                scaleX: 1 / 3,
                scaleY: 1 / 3,
                scaleZ: 1 / 3
            }
        });
        gltflayer.addGeometry(multigltfmarker);
        multigltfmarker.on('load', () => {
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([87, 87, 87, 153], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2, map.height / 2 + 100, 1, 1);
                expect(pixelMatch([91, 91, 91, 153], pixel2)).to.be.eql(true);
                const pixel3 = pickPixel(map, map.width / 2 + 100, map.height / 2 + 100, 1, 1);
                expect(pixelMatch([87, 87, 87, 153], pixel3)).to.be.eql(true);
                const pixel4 = pickPixel(map, map.width / 2 - 100, map.height / 2, 1, 1);
                expect(pixelMatch([91, 91, 91, 153], pixel4)).to.be.eql(true);
                done();
            }, 100);
        });
    });

    it('set infowindow for multigltfmarker', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const importData = initInstanceData0();
        const multigltfmarker = new maptalks.MultiGLTFMarker(importData, {
            symbol: {
                url: url2,
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80
            }
        }).addTo(gltflayer);
        multigltfmarker.setInfoWindow({
            'title'     : 'MultiGLTFMarker\'s InfoWindow',
            'content'   : 'Click on marker to open.'
        });
        setTimeout(function () {
            multigltfmarker.openInfoWindow();
            done();
        }, 100);
    });

    it('render multigltfmarker correctly', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const importData = initInstanceData0();
        const multigltfmarker = new maptalks.MultiGLTFMarker(importData, {
            symbol: {
                scaleX: 40,
                scaleY: 40,
                scaleZ: 40,
                url: url3//Duck.glb
            }
        }).addTo(gltflayer);
        multigltfmarker.once('load', () => {
            setTimeout(function() {
                const pixel = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([129, 108, 0, 255], pixel)).to.be.eql(true);
                done();
            }, 100);
        });
    });

    it('add data with outline and render correctly', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        new maptalks.GroupGLLayer('group', [gltflayer],  { sceneConfig }).addTo(map);
        const importData = initInstanceData0();
        const multigltfmarker = new maptalks.MultiGLTFMarker(importData, {
            symbol: {
                url: url2,
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80
            }
        }).addTo(gltflayer);
        multigltfmarker.outline(55);
        multigltfmarker.once('load', () => {
            setTimeout(function() {
                const pixel = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([165, 165, 114, 255], pixel)).to.be.eql(true);
                done();
            }, 100);
        });
    });

    // TODO 增加MultiGLTFMarker的鼠标事件测试
    it('click event', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        new maptalks.GroupGLLayer('group', [gltflayer],  { sceneConfig }).addTo(map);
        const importData = initInstanceData0();
        const multigltfmarker = new maptalks.MultiGLTFMarker(importData, {
            symbol: {
                url: url2,
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80
            }
        }).addTo(gltflayer);
        multigltfmarker.on('click', e => {
            const meshId = e.meshId;
            expect(meshId).to.be.eql(0);
            e.target.outline(e.index);
            done();
        });
        multigltfmarker.on('load', () => {
            setTimeout(function () {
                happen.click(eventContainer, {
                    'clientX': clickContainerPoint.x + 60,
                    'clientY': clickContainerPoint.y
                });
            }, 100);
        });
    });

    it('multigltfmarker responding mouse event when adding data item after added to gltflayer(issues/448)', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        new maptalks.GroupGLLayer('group', [gltflayer],  { sceneConfig }).addTo(map);
        const importData = initInstanceData0();
        const multigltfmarker = new maptalks.MultiGLTFMarker([], {
            symbol: {
                url: url2,
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80
            }
        }).addTo(gltflayer);
        multigltfmarker.on('click', e => {
            const meshId = e.meshId;
            expect(meshId).to.be.eql(0);
            expect(e.pickingId).to.be.eql(65);
            e.target.outline(e.index);
            done();
        });
        multigltfmarker.on('load', () => {
            setTimeout(function () {
                happen.click(eventContainer, {
                    'clientX': clickContainerPoint.x + 60,
                    'clientY': clickContainerPoint.y
                });
            }, 100);
        });
        for (let i = 0; i < importData.length; i++) {
            multigltfmarker.addData(importData[i]);
        }
    });

    // TODO 每个单独的数据项能够设置独立的trs,增加像素判断
    it('set trs for data item', (done) => {
        const config = JSON.parse(JSON.stringify(sceneConfig));
        config.shadow.enable = true;
        const gltflayer = new maptalks.GLTFLayer('gltf');
        new maptalks.GroupGLLayer('group', [gltflayer],  { sceneConfig }).addTo(map);
        const importData = initInstanceData0();
        const multigltfmarker = new maptalks.MultiGLTFMarker(importData, {
            symbol: {
                url: url2,
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80
            }
        }).addTo(gltflayer);
        const count = multigltfmarker.getCount();
        for (let i = 0; i < count; i++) {
            multigltfmarker.updateData(i, 'translation', [i * 0.0001, 0, 0]);
            multigltfmarker.updateData(i, 'rotation', [45 * i, 0, 0]);
            multigltfmarker.updateData(i, 'scale', [i * 0.05, i * 0.05, i * 0.05]);
        }
        multigltfmarker.once('load', () => {
            multigltfmarker.outline(0);
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([58, 97, 126, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2, map.height / 2 + 100, 1, 1);
                expect(pixelMatch([129, 129, 129, 255], pixel2)).to.be.eql(true);
                const pixel3 = pickPixel(map, map.width / 2 + 100, map.height / 2 + 100, 1, 1);
                expect(pixelMatch([149, 149, 149, 255], pixel3)).to.be.eql(true);
                const pixel4 = pickPixel(map, map.width / 2 - 100, map.height / 2, 1, 1);
                expect(pixelMatch([151, 151, 151, 255], pixel4)).to.be.eql(true);
                done();
            }, 100);
        });
    });

    it('responding mouseout event when multigltfmarker overlay together', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        new maptalks.GroupGLLayer('group', [gltflayer],  { sceneConfig }).addTo(map);
        const importData = initInstanceData0();
        const multigltfmarker = new maptalks.MultiGLTFMarker(importData, {
            symbol: {
                url: url2,
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80
            }
        }).addTo(gltflayer);
        map.setPitch(45);
        multigltfmarker.on('mouseenter', () => {
        });
        multigltfmarker.on('mouseout', () => {
            done();
        });
        multigltfmarker.once('load', () => {
            setTimeout(function() {
                const point = new maptalks.Point([250, 150]);
                for (let i = 0; i < 20; i++) {
                    happen.mousemove(eventContainer, {
                        'clientX':point.x,
                        'clientY':point.y - i
                    });
                }
            }, 100);
        });
    });

    it('multigltfmarker open infoWindow', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        new maptalks.GroupGLLayer('group', [gltflayer],  { sceneConfig }).addTo(map);
        const importData = initInstanceData0();
        const multigltfmarker = new maptalks.MultiGLTFMarker(importData, {
            symbol: {
                url: url2,
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80
            }
        }).addTo(gltflayer);
        multigltfmarker.setInfoWindow({
            'title': 'MultiGLTFMarker\'s InfoWindow',
            'content': 'click on marker to open.',
            'autoPan': false,
            'animation': false
        });
        multigltfmarker.once('load', () => {
            multigltfmarker.openInfoWindow();
            setTimeout(function() {
                const infoWindowStyle = multigltfmarker.getInfoWindow().__uiDOM.style;
                expect(infoWindowStyle.display).not.to.be.eql('none');
                done();
            }, 100);
        });
    });

    it('add multigltfmarker with altitude', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        new maptalks.GroupGLLayer('group', [gltflayer],  { sceneConfig }).addTo(map);
        const importData = initInstanceData2(100);
        const multigltfmarker = new maptalks.MultiGLTFMarker(importData, {
            symbol: {
                url: url2,
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80
            }
        }).addTo(gltflayer);
        map.setPitch(75);
        multigltfmarker.once('load', () => {
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(hasColor(pixel1)).to.be.eql(false);//增加高度后，没有颜色
                const pixel2 = pickPixel(map, map.width / 2, 10, 1, 1);
                expect(hasColor(pixel2)).to.be.eql(true);
                done();
            }, 100);
        });
    });

    it('add multigltfmarker with shadow, and then update instance data', done => {
        const config = JSON.parse(JSON.stringify(sceneConfig));
        config.shadow.enable = true;
        const gltflayer = new maptalks.GLTFLayer('gltf');
        new maptalks.GroupGLLayer('group', [gltflayer],  { sceneConfig: config }).addTo(map);
        const importData = initInstanceData3();
        const multigltfmarker = new maptalks.MultiGLTFMarker(importData, {
            symbol: {
                url: url2,
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80,
                shadow: true
            }
        }).addTo(gltflayer);

        function updateCoordinates() {
            const newCoord = new maptalks.Coordinate(0.0002, 0);
            multigltfmarker.updateData(3, 'coordinates', newCoord);
            const pixel = pickPixel(map, map.width / 2, 5, 1, 1);
            expect(pixelMatch([255, 0, 0, 0], pixel)).to.be.eql(true);// shadow color
            done();
        }

        function testShadow() {
            const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
            expect(hasColor(pixel1)).to.be.eql(true);
            const pixel2 = pickPixel(map, map.width / 2, 10, 1, 1);
            expect(hasColor(pixel2)).to.be.eql(true);
            updateCoordinates();
        }
        multigltfmarker.once('load', () => {
            map.setPitch(30);
            setTimeout(function() {
                testShadow();
            }, 100);
        });
    });

    it('bloom data item in MultiGLTFMarkerarker(issue#451)', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        new maptalks.GroupGLLayer('group', [gltflayer],  { sceneConfig }).addTo(map);
        const importData = initInstanceDataWithBloom();
        const multigltfmarker = new maptalks.MultiGLTFMarker(importData, {
            symbol: {
                url: url3,
                scaleX: 20,
                scaleY: 20,
                scaleZ: 20,
            }
        }).addTo(gltflayer);
        function closeBloom() {
            multigltfmarker.updateData(4, 'bloom', false);
            setTimeout(function() {
                const pixel = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([129, 108, 0, 255], pixel)).to.be.eql(true);
                done();
            }, 100);
        }
        multigltfmarker.once('load', () => {
            setTimeout(function() {
                const pixel = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([255, 255, 46, 255], pixel)).to.be.eql(true);
                closeBloom();
            }, 100);
        });
    });

    it('support coordinates in array format(issue#481)', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        new maptalks.GroupGLLayer('group', [gltflayer],  { sceneConfig }).addTo(map);
        const importData = initInstanceDataInArray(100);
        const multigltfmarker = new maptalks.MultiGLTFMarker(importData, {
            symbol: {
                url: url2,
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80
            }
        }).addTo(gltflayer);
        map.setPitch(45);
        multigltfmarker.once('load', () => {
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(hasColor(pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2, 10, 1, 1);
                expect(hasColor(pixel2)).to.be.eql(true);
                done();
            }, 100);
        });
    });

    it('add data to multigltfmarker in specify order', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        new maptalks.GroupGLLayer('group', [gltflayer],  { sceneConfig }).addTo(map);
        let clickedTimes = 0;
        const multigltfmarker1 = new maptalks.MultiGLTFMarker([{
            coordinates: [-0.001, 0, 0]
        }], {
            symbol: {
                url: url2,
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80
            }
        }).addTo(gltflayer);
        function checkClickTimes() {
            clickedTimes += 1;
            if (clickedTimes === 3) { //3个模型全部能被点中
                done();
            }
        }
        const vlayer = new maptalks.VectorLayer('v').addTo(map);
        map.on('click', e => {
            new maptalks.Marker(e.coordinate).addTo(vlayer);
        });
        multigltfmarker1.on('click', () => {
            checkClickTimes();
        });
        multigltfmarker1.on('load', () => {
            setTimeout(function() {
                const multigltfmarker2 = new maptalks.MultiGLTFMarker([{
                    coordinates: [0, 0, 0]
                }], {
                    symbol: {
                        url: url2,
                        scaleX: 80,
                        scaleY: 80,
                        scaleZ: 80
                    }
                }).addTo(gltflayer);
                multigltfmarker2.on('click', () => {
                    checkClickTimes();
                });
            }, 100);

            setTimeout(function() {
                multigltfmarker1.addData({ coordinates: [0.001, 0, 0]});
            }, 200);
            setTimeout(function() {
                for (let i = 0; i < 3; i++) {
                    happen.click(eventContainer, {
                        'clientX': 100 + i * 10,
                        'clientY': 150
                    });
                }
            }, 300);
        });
    });

    it('multigltfmarker support highlight', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        new maptalks.GroupGLLayer('group', [gltflayer],  { sceneConfig }).addTo(map);
        const importData = initInstanceDataInArray(100);
        const multigltfmarker = new maptalks.MultiGLTFMarker(importData, {
            symbol: {
                url: url2,
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80
            }
        }).addTo(gltflayer);
        map.setPitch(45);
        multigltfmarker.once('load', () => {
            multigltfmarker.highlight(52, {
                color: [1, 0, 0],
                opacity: 0.8
            });
            setTimeout(function() {
                const pixel = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([135, 4, 4, 255], pixel)).to.be.eql(true);
                done();
            }, 100);
        });
    });

    it('multigltfmarker draggable', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        new maptalks.GroupGLLayer('group', [gltflayer],  { sceneConfig }).addTo(map);
        const importData = initInstanceDataInArray(100);
        const multigltfmarker = new maptalks.MultiGLTFMarker(importData, {
            draggable: true,
            symbol: {
                url: url2,
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80
            }
        }).addTo(gltflayer);
        map.setPitch(45);
        multigltfmarker.once('load', () => {
            setTimeout(function() {
                const center = multigltfmarker.getCenter();
                const dragCenter = center.add(0.001, 0.001);
                multigltfmarker.setCoordinates(dragCenter);
                checkColor();
            }, 100);
        });
        function checkColor() {
            setTimeout(function() {
                const pixel = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([148, 148, 148, 255], pixel)).to.be.eql(true);
                done();
            }, 100);
        }
    });
});
