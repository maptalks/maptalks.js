describe('MultiGLTFMarker', () => {
    let map;
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

    it('addData', (done) => {//TODO 增加像素判断
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const importData = initInstanceData0();
        const multigltfmarker = new maptalks.MultiGLTFMarker(importData, {
            symbol: {
                url: url2
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
                expect(pixelMatch([240, 240, 240, 153], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2, map.height / 2 - 50, 1, 1);
                expect(pixelMatch([225, 225, 225, 153], pixel2)).to.be.eql(true);
                const pixel3 = pickPixel(map, map.width / 2 + 50, map.height / 2 - 50, 1, 1);
                expect(pixelMatch([223, 223, 223, 153], pixel3)).to.be.eql(true);
                const pixel4 = pickPixel(map, map.width / 2 + 50, map.height / 2, 1, 1);
                expect(pixelMatch([240, 240, 240, 153], pixel4)).to.be.eql(true);
                done();
            }, 100);
        });
    });

    it('removeData', (done) => {//TODO 增加像素判断
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const importData = initInstanceData0();
        const multigltfmarker = new maptalks.MultiGLTFMarker(importData, {
            symbol: {
                url: url2
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
                expect(pixelMatch([225, 225, 225, 153], pixel2)).to.be.eql(true);
                const pixel3 = pickPixel(map, map.width / 2 + 50, map.height / 2 - 50, 1, 1);
                expect(pixelMatch([223, 223, 223, 153], pixel3)).to.be.eql(true);
                const pixel4 = pickPixel(map, map.width / 2 + 50, map.height / 2, 1, 1);
                expect(pixelMatch([240, 240, 240, 153], pixel4)).to.be.eql(true);
                done();
            }, 100);
        });
    });

    it('updateData', (done) => {//TODO 增加像素判断
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const importData = initInstanceData0();
        const multigltfmarker = new maptalks.MultiGLTFMarker(importData, {
            symbol: {
                url: url2
            }
        }).addTo(gltflayer);
        multigltfmarker.updateData(4, 'coordinates', new maptalks.Coordinate([-0.001, -0.001]));
        const dataItem = multigltfmarker.getData(4);
        expect(dataItem.coordinates).to.be.eql(new maptalks.Coordinate([-0.001, -0.001]));
        multigltfmarker.on('load', () => {
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2 - 50, map.height / 2 + 50, 1, 1);
                expect(pixelMatch([115, 170, 192, 153], pixel1)).to.be.eql(true);
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
                url: url2
            }
        }).addTo(gltflayer1);
        const multigltfmarker2 = new maptalks.MultiGLTFMarker(importData, {
            symbol: {
                url: url2
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
                url: url2
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
                url: url2
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
                expect(pixelMatch([240, 240, 240, 153], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2, map.height / 2 + 50, 1, 1);
                expect(pixelMatch([250, 250, 250, 153], pixel2)).to.be.eql(true);
                const pixel3 = pickPixel(map, map.width / 2 - 50, map.height / 2 + 50, 1, 1);
                expect(pixelMatch([115, 170, 192, 153], pixel3)).to.be.eql(true);
                const pixel4 = pickPixel(map, map.width / 2 - 50, map.height / 2, 1, 1);
                expect(pixelMatch([98, 145, 117, 153], pixel4)).to.be.eql(true);
                done();
            }, 100);
        });
    });

    it('change shader', () => {
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const importData = initInstanceData1();
        const multigltfmarker = new maptalks.MultiGLTFMarker(importData, {
            symbol: {
                url: url2
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
        expect(JSON.stringify(resultJosn)).to.be.eql(`{"data":[{"coordinates":{"x":-0.02,"y":-0.02},"translation":[0,0,0],"scale":[1,1,1],"color":[0.2,0.4,0.91,0.9]},{"coordinates":{"x":-0.02,"y":-0.01},"translation":[0,0,0],"scale":[1,1,1],"color":[0.2,0.4,0.91,0.9]},{"coordinates":{"x":-0.01,"y":-0.02},"translation":[0,0,0],"scale":[1,1,1],"color":[0.2,0.4,0.91,0.9]},{"coordinates":{"x":-0.01,"y":-0.01},"translation":[0,0,0],"scale":[1,1,1],"color":[0.2,0.4,0.91,0.9]}],"options":{"symbol":{"url":"models/cube-animation/cube.gltf","translation":[0,0,0],"rotation":[0,0,90],"scale":[1,1,1]},"properties":{"0":{"ID":"1","NAME":"name","TYPE":"type"}}}}`);
    });

    it('simple model', (done) => {//TODO 增加像素判断
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const importData = initInstanceData0();
        const multigltfmarker = new maptalks.MultiGLTFMarker(importData);
        gltflayer.addGeometry(multigltfmarker);
        multigltfmarker.on('load', () => {
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([240, 240, 240, 153], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2, map.height / 2 + 100, 1, 1);
                expect(pixelMatch([255, 255, 255, 153], pixel2)).to.be.eql(true);
                const pixel3 = pickPixel(map, map.width / 2 + 100, map.height / 2 + 100, 1, 1);
                expect(pixelMatch([243, 243, 243, 153], pixel3)).to.be.eql(true);
                const pixel4 = pickPixel(map, map.width / 2 - 100, map.height / 2, 1, 1);
                expect(pixelMatch([255, 255, 255, 153], pixel4)).to.be.eql(true);
                done();
            }, 100);
        });
    });

    it('set infowindow for multigltfmarker', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const importData = initInstanceData0();
        const multigltfmarker = new maptalks.MultiGLTFMarker(importData, {
            symbol: {
                url: url2
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
                url: url3//Duck.glb
            }
        }).addTo(gltflayer);
        multigltfmarker.once('load', () => {
            setTimeout(function() {
                const pixel = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([222, 188, 53, 153], pixel)).to.be.eql(true);
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
                url: url2
            }
        }).addTo(gltflayer);
        multigltfmarker.once('load', () => {
            multigltfmarker.outline(55);
            setTimeout(function() {
                const pixel = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([245, 245, 170, 173], pixel)).to.be.eql(true);
                done();
            }, 100);
        });
    });

    // //TODO 增加MultiGLTFMarker的鼠标事件测试
    it('click event', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        new maptalks.GroupGLLayer('group', [gltflayer],  { sceneConfig }).addTo(map);
        const importData = initInstanceData0();
        const multigltfmarker = new maptalks.MultiGLTFMarker(importData, {
            symbol: {
                url: url2
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
                map.fire('dom:click', {
                    containerPoint: clickContainerPoint.add(50, 0)
                });
            }, 100);
        });
    });

    // TODO 每个单独的数据项能够设置独立的trs,增加像素判断
    it('set trs for data item', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        new maptalks.GroupGLLayer('group', [gltflayer],  { sceneConfig }).addTo(map);
        const importData = initInstanceData0();
        const multigltfmarker = new maptalks.MultiGLTFMarker(importData, {
            symbol: {
                url: url2
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
                expect(pixelMatch([223, 233, 240, 153], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2, map.height / 2 + 100, 1, 1);
                expect(pixelMatch([255, 255, 255, 153], pixel2)).to.be.eql(true);
                const pixel3 = pickPixel(map, map.width / 2 + 100, map.height / 2 + 100, 1, 1);
                expect(pixelMatch([255, 255, 255, 153], pixel3)).to.be.eql(true);
                const pixel4 = pickPixel(map, map.width / 2 - 100, map.height / 2, 1, 1);
                expect(pixelMatch([0, 0, 0, 0], pixel4)).to.be.eql(true);
                done();
            }, 100);
        });
    });

    it('responding mouseleave event when multigltfmarker overlay together', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        new maptalks.GroupGLLayer('group', [gltflayer],  { sceneConfig }).addTo(map);
        const importData = initInstanceData0();
        const multigltfmarker = new maptalks.MultiGLTFMarker(importData, {
            symbol: {
                url: url2
            }
        }).addTo(gltflayer);
        map.setPitch(45);
        multigltfmarker.on('mouseleave', () => {
            done();
        });
        multigltfmarker.once('load', () => {
            setTimeout(function() {
                const point = new maptalks.Point([200, 155]);
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
                url: url2
            }
        }).addTo(gltflayer);
        multigltfmarker.setInfoWindow({
            'title': 'MultiGLTFMarker\'s InfoWindow',
            'content': 'click on marker to open.'
        });
        multigltfmarker.once('load', () => {
            multigltfmarker.openInfoWindow(45);
            setTimeout(function() {
                const infoWindowStyle = multigltfmarker.getInfoWindow().__uiDOM.style;
                expect(infoWindowStyle.display).not.to.be.eql('none');
                expect(infoWindowStyle.cssText).to.be.eql('width: auto; bottom: 0px; position: absolute; left: 0px; transform: translate3d(35.7091px, 131.342px, 0px) scale(1); transform-origin: 113.688px bottom;');
                done();
            }, 100);
        });
    });
});
