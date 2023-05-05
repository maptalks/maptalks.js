describe('bug', () => {
    let map;
    beforeEach(function() {
        map = createMap();
    });

    afterEach(function() {
        removeMap(map);
    });

    it('clear markers and then add a new one(fuzhenn/maptalks-studio#1390)', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const marker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url8
            }
        }).addTo(gltflayer);
        let times = 0;
        function pickColor(expectedValue) {
            setTimeout(function() {
                times++;
                const pixel = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch(expectedValue, pixel)).to.be.eql(true);
                if (times === 2) {
                    done();
                }
            }, 100);
        }
        function addNewMarker() {
            const newOne = new maptalks.GLTFMarker(center, {
                symbol: {
                    url: url8
                }
            }).addTo(gltflayer);
            newOne.on('load', () => {
                //TODO 从map上取像素值，判断不为空
                pickColor([50, 33, 35, 255]);
            })
        }
        marker.on('load', () => {
            const copyOne = marker.copy();
            copyOne.addTo(gltflayer);
            setTimeout(function () {
                gltflayer.clear();
                //TODO 从map上取像素值，判断为空
                pickColor([0, 0, 0, 0]);
                addNewMarker();
            }, 100);
        });
    });

    it('non-power-of-two width and height textures(fuzhenn/maptalks-studio#2075)', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const marker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url9,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            setTimeout(function() {
                const pixel = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([54, 54, 54, 255], pixel)).to.be.eql(true);
                done();
            }, 100);
        });
        //TODO 增加像素对比
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
    });

    it('incorrect animation name', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        new maptalks.GLTFMarker(center, {
            symbol: {
                url: 'models/CesiumMan/CesiumMan.gltf',
                animationName: 'animation'
            }
        }).addTo(gltflayer);
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
        gltflayer.on('modelload', () => {
            setTimeout(function() {
                //TODO 增加像素判断
                const pixel = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([146, 146, 146, 255], pixel)).to.be.eql(true);
                done();
            }, 100);
        });
    });

    it('load draco model correctly', done => {
        const gltflayer = new maptalks.GLTFLayer('gltflayer');
        new maptalks.GLTFMarker(center, {
            symbol : {
                url: 'models/car/car.gltf'
            }
        }).addTo(gltflayer);
        gltflayer.on('modelload', () => {
            ///TODO 增加像素判断
            setTimeout(function() {
                const pixel = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([7, 7, 7, 255], pixel)).to.be.eql(true);
                done();
            }, 100);
        });
        new maptalks.GroupGLLayer('gl', [gltflayer], {sceneConfig}).addTo(map);
    });

    it('add many markers with draco model at the same time', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        for (let i = 0; i < 4; i++) {
            new maptalks.GLTFMarker(center, {
                symbol: {
                    url: 'models/dracoModel/adaa1044-3eb3-4589-8988-b4581b806bdc-processed.glb'
                }
            }).addTo(gltflayer);
        }
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
        gltflayer.on('modelload', () => {
            //TODO 增加像素判断
            setTimeout(function() {
                const pixel = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([255, 255, 255, 25], pixel)).to.be.eql(true);
                done();
            }, 100);
        });
    });

    it('support url with parameter', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gltfMarker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: 'models/CesiumMan/CesiumMan.gltf?token=123'
            }
        }).addTo(gltflayer);
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
        gltfMarker.on('load', () => {
            //TODO 增加像素判断
            setTimeout(function() {
                const pixel = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([146, 146, 146, 255], pixel)).to.be.eql(true);
                done();
            }, 100);
        });
    });

    it('enable outline and cancel outline', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gltfMarker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url1
            }
        }).addTo(gltflayer);
        gltfMarker.outline();
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
        gltfMarker.on('load', () => {
            //TODO 增加像素判断
            setTimeout(function() {
                const pixel = pickPixel(map, map.width / 2 + 41, map.height / 2, 1, 1);
                expect(pixelMatch([249, 249, 7, 239], pixel)).to.be.eql(true);
                gltfMarker.cancelOutline();
                setTimeout(function() {
                    const pixel = pickPixel(map, map.width / 2 + 41, map.height / 2, 1, 1);
                    expect(pixelMatch([150, 150, 150, 95], pixel)).to.be.eql(true);
                    done();
                }, 100);
            }, 100);
        });
    });

    it('test nodeMatrix of gltfmarker with animation(fuzhenn/maptalks-studio#1141)', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const marker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url5
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            marker.setAnimationTimeframe(1000);
            const meshes = marker.getMeshes();
            const testNodeMatrix = meshes[1].nodeMatrix;
            expect(testNodeMatrix).to.be.eql([100, 0, 0, 0, 0, -0.0000134358856263006, -100.00001343588565, 0, 0, 100.00001343588565, -0.0000134358856263006, 0, 0, 0, 0, 1]);
            done();
        });
    });

    it('modelerror event(fuzhenn/maptalks-studio#1159)', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        gltflayer.on('modelerror', (e) => {
            expect(e.url).to.be.eql(url6);
            done();
        });
        new maptalks.GLTFMarker(center, {
            symbol: {
                url: url6
            }
        }).addTo(gltflayer);
    });

    it('resource loading error(maptalks-studio/issues/1388)', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        gltflayer.on('modelerror', (e) => {
            expect(e.url).to.be.eql('models/gltf/empty.gltf');
            expect(e.info.message).to.be.eql('incorrect http request with status code(404): Not Found');
            gltflayer.remove();
            done();
        });
        new maptalks.GLTFMarker(center, {
            id: 'marker1',
            symbol: {
                url: url2
            }
        }).addTo(gltflayer);
        new maptalks.GLTFMarker(center, {
            id: 'marker2',
            symbol: {
                url: 'models/gltf/empty.gltf'
            }
        }).addTo(gltflayer);
    });

    it('layer updateSymbol when style has $root', (done) => {
        const layer = new maptalks.GLTFLayer('layer').addTo(map);
        const gltfMarker = new maptalks.GLTFMarker(center, {
            properties: {
                num: 1.5
            }
        }).addTo(layer);
        const style = {
            attr: 'value',
            $root: 'basePath',
            style: [{
                'filter': ['<', 'num', 1],
                'symbol': {
                    'url':url2,
                    'scale': [1, 1, 1],
                    'uniforms': {
                        'lightAmbient': [1, 1, 1],
                        'opacity': 1
                    }
                },
            },
            {
                'filter': ['>', 'num', 1],
                'symbol': {
                    'url':url3,
                    'scale': [1, 1, 1],
                    'uniforms': {
                        'lightPosition': [1, 1, 1],
                        'lightAmbient': [1, 1, 1],
                        'lightDiffuse': [0.5, 0.5, 0.5],
                        'lightSpecular': [0.1, 0.7, 0.3],
                        'ambientStrength': 0.5,
                        'specularStrength': 0.8,
                        'materialShininess': 32,
                        'opacity': 1
                    }
                }
            }]
        };
        layer.setStyle(style);
        let url = gltfMarker.getUrl();
        const scale = gltfMarker.getScale();
        expect(url).to.be.eql(url3);
        expect(scale).to.be.eql([1, 1, 1]);
        setTimeout(() => {
            layer.updateSymbol(1, {
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2,
                url: url1
            });
            url = gltfMarker.getUrl();
            expect(url).to.be.eql(url1);
            done();
        }, 100);
    });

    it('change shader from time to time(maptalks-studio/issues/1808)', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const position = map.getCenter();
        //phong光照作为对比
        const marker = new maptalks.GLTFMarker(position, {
            symbol : {
                url : url2,
                shader: 'pbr',
                animation: true,
                loop: true
            }
        }).addTo(gltflayer);
        new maptalks.GLTFMarker(position, {
            symbol : {
                url : url3
            }
        }).addTo(gltflayer);
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
        setTimeout(function () {
            marker.setShader('wireframe');
        }, 100);
        setTimeout(function () {
            marker.setShader('pbr');
        }, 200);
        setTimeout(function () {
            marker.setShader('phong');
        }, 300);
        setTimeout(function () {
            marker.setShader('wireframe');
            done();
            gllayer.remove();
        }, 400);
    });

    it('set bloom, update mesh\'s bloom', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const marker1 = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url1
            }
        }).addTo(gltflayer);
        gltflayer.on('modelload', () => {
            marker1.setBloom(true);
            const renderMeshes = gltflayer.getRenderer().getRenderMeshesTest();
            for (let i = 0; i < renderMeshes.length; i++) {
                expect(renderMeshes[i].getUniform('bloom')).to.be.ok();
            }
            done();
        });
    });

    it('set infoWindow for gltfmarker(issues/234)', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const gltfMarker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url1
            }
        }).addTo(gltflayer);
        gltflayer.on('modelload', () => {
            gltfMarker.setInfoWindow({
                'title': 'GLTFMarker\'s InfoWindow',
                'content': 'Click on marker to open.',
                'autoOpenOn': 'click',
                'autoCloseOn': 'click',
                'autoPan': false
            });
            gltfMarker.openInfoWindow();
            setTimeout(function() {
                const infoWindowStyle = gltfMarker.getInfoWindow().__uiDOM.style;
                expect(infoWindowStyle.display).not.to.be.eql('none');
                expect(infoWindowStyle.cssText).to.be.eql('width: auto; bottom: 0px; position: absolute; left: 0px; transform: translate3d(114.5px, 138px, 0px) scale(1); transform-origin: 81.5px bottom;');
                done();
            }, 100);
        });
    });

    it('set lightConfig without hdr resource', () => {
        const tmpLightConfig = {
            ambient: {
                color: [0.2, 0.2, 0.2],
                exposure: 1.5
            },
            directional: {
                color: [0.1, 0.1, 0.1],
                specular: [0.8, 0.8, 0.8],
                direction: [-1, -1, -1],
            }
        };
        map.setLights(tmpLightConfig);
        const gltflayer = new maptalks.GLTFLayer('lightConfig').addTo(map);
        new maptalks.GLTFMarker(center, {
            symbol: {
                url: url1
            }
        }).addTo(gltflayer);
    });

    it('change hdr resource when gltfmarker hide', (done) => {
        const lightConfig = map.getLights();
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const marker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url1,
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            marker.hide();
            delete lightConfig.ambient.resources;
            map.setLights(lightConfig);
            setTimeout(function () {
                marker.show();
                lightConfig.ambient.resources = {};
                lightConfig.ambient.resources.url = 'resources/env.hdr';
                map.setLights(lightConfig);
                done();
            }, 100);
        });
    });

    it('when updatting Symbol for gltfmarker, toJSON should save symbol infomation', () => {
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const marker = new maptalks.GLTFMarker(center).addTo(gltflayer);
        const json1 = gltflayer.toJSON();
        expect(json1.geometries[0].options.symbol).not.to.be.ok();
        marker.updateSymbol({ url: url1 });
        marker.updateSymbol({ translationX: 1 });
        marker.updateSymbol({ translationY: 0 });
        marker.updateSymbol({ translationZ: 0 });
        const json2 = gltflayer.toJSON();
        expect(json2.geometries[0].options.symbol).to.be.ok();
        expect(json2.geometries[0].options.symbol['url']).to.be.eql(url1);
        expect(json2.geometries[0].options.symbol['translationX']).to.be.eql(1);
        expect(json2.geometries[0].options.symbol['translationY']).to.be.eql(0);
        expect(json2.geometries[0].options.symbol['translationZ']).to.be.eql(0);
    });

    it('toJSON should save id', () => {
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const marker = new maptalks.GLTFMarker(center).addTo(gltflayer);
        marker.setId('marker');
        const json = marker.toJSON();
        expect(json.options.id).to.be.eql('marker');
    });

    it('setSymbol with url', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const marker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url1
            }
        }).addTo(gltflayer);
        marker.on('createscene-debug', () => {
            const url = marker.getUrl();
            expect(url).to.be.eql(url2);
            done();
        });
        marker.setSymbol({
            url: url2
        });
    });

    it('transparent', () => {
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const marker1 = new maptalks.GLTFMarker(center).addTo(gltflayer);
        const marker2 = new maptalks.GLTFMarker(center, {
            symbol: {
                shader: 'phong'
            }
        }).addTo(gltflayer);
        marker1.setUniform('polygonFill', [1, 0, 0, 0.6]);
        marker2.setUniform('opacity', 0.6);
        const renderer = gltflayer.getRenderer();
        expect(renderer.isMarkerTransparent(marker1)).not.to.be.ok();
        expect(renderer.isMarkerTransparent(marker2)).to.be.ok();
        marker1.setUniform('polygonOpacity', 0.6);
        expect(renderer.isMarkerTransparent(marker1)).to.be.ok();
    });

    it('set anchorZ for gltfmarker', () => {
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const marker = new maptalks.GLTFMarker(center).addTo(gltflayer);
        const anchorZ = marker.getAnchorZ();
        expect(anchorZ).to.be.eql('bottom');
        marker.setAnchorZ('top');
        expect(marker.getAnchorZ()).to.be.eql('top');
    });

    it('identify', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        new maptalks.GLTFMarker(center).addTo(gltflayer);
        const handle = function (e) {
            const identifyTarget1 = gltflayer.identify(e.coordinate);
            expect(identifyTarget1.length).to.be.eql(1);
            const identifyTarget2 = gltflayer.identifyAtPoint(e.containerPoint);
            expect(identifyTarget2.length).to.be.eql(1);
            gltflayer.remove();
            map.off('dom:click', handle);
            done();
        };
        map.on('dom:click', handle);
        setTimeout(function () {
            map.fire('dom:click', {
                coordinate: clickPoint,
                containerPoint: clickContainerPoint
            });
        }, 100);
    });

    it('wireframe shader, change url', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const marker = new maptalks.GLTFMarker(center, {
            symbol: {
                shader: 'wireframe'
            }
        }).addTo(gltflayer);
        setTimeout(function () {
            marker.setUrl(url2);
            done();
        }, 100);
    });

    it('wireframe dashAnimate, noiseEnable', () => {
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        new maptalks.GLTFMarker(center, {
            symbol: {
                shader: 'wireframe',
                dashAnimate: true,
                noiseEnable: true
            }
        }).addTo(gltflayer);
    });

    it('getGLTFAsset', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const marker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url2,
                shader: 'wireframe',
                dashAnimate: true,
                noiseEnable: true
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            const assetInfo = marker.getGLTFAsset();
            expect(assetInfo).to.be.ok();
            expect(assetInfo.generator).to.be.ok();
            marker.remove();
            //marker移除后，不再保存json数据
            const assetInfo1 = marker.getGLTFAsset();
            expect(assetInfo1).not.to.be.ok();
            done();
        });
    });

    it('layerload event', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        gltflayer.on('layerload', () => {
            done();
            gltflayer.remove();
        });
    });

    it('correct localTransform', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const marker = new maptalks.GLTFMarker(center).addTo(gltflayer);
        marker.on('load', () => {
            const meshes = marker.getMeshes();
            expect(meshes[0].localTransform).to.be.eql([0.5329853977951412, 0, 0, 0, 0, 3.263594307010492e-17, 0.5329853977951412, 0, 0, -0.5329853977951412, 3.263594307010492e-17, 0, 0, -5.551115123125783e-17, -0.0054897497029198754, 1]);
            done();
        });
    });

    it('add gltf model made of none triangle geometry', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        new maptalks.GLTFMarker(center, {
            symbol: {
                url: url7,
            }
        }).addTo(gltflayer);
        gltflayer.on('rendercomplete-debug', () => {
            done();
            gltflayer.remove();
        });
    });

    it('gltfmanager', (done) => {
        const gltflayer1 = new maptalks.GLTFLayer('gltf1');
        const gltflayer2 = new maptalks.GLTFLayer('gltf2');
        new maptalks.GroupGLLayer('gl1', [gltflayer1, gltflayer2], { sceneConfig }).addTo(map);
        const marker1 = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url1,
            }
        }).addTo(gltflayer1);
        const marker2 = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url1,
            }
        }).addTo(gltflayer1);
        const testAnother = function () {
            marker2.on('load', () => {
                const renderer = gltflayer2.getRenderer();
                const gltfmanager = renderer.regl.gltfManager;
                const resource1 = gltfmanager.getGLTF(url1);
                const resource2 = gltfmanager.getGLTF(url2);
                expect(resource1).not.to.be.ok();
                expect(resource2).to.be.ok();
                expect(resource2.refCount).to.be.eql(2);//url2资源被利用2次
                done();
            });
            marker2.setUrl(url2);
        };
        marker1.once('load', () => {
            marker1.setUrl(url2);
            marker1.on('load', () => {
                const renderer = gltflayer1.getRenderer();
                const gltfmanager = renderer.regl.gltfManager;
                const resource1 = gltfmanager.getGLTF(url1);
                const resource2 = gltfmanager.getGLTF(url2);
                expect(resource1).to.be.ok();
                expect(resource2).to.be.ok();
                expect(resource1.refCount).to.be.eql(1);
                expect(resource2.refCount).to.be.eql(1);
                testAnother();
            });
        });
    });

    it('uniform dirty', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const marker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url3,
                uniforms: {
                    polygonFill: [1, 1, 1, 1],
                    polygonOpacity: 1
                }
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            marker.setUniform('polygonFill', [0.5, 0.5, 0.5, 0.5]);
            const polygonFill = marker.getUniform('polygonFill');
            expect(polygonFill).to.be.eql([0.5, 0.5, 0.5, 0.5]);
            marker.updateSymbol({ uniforms: {
                'polygonOpacity': 0.5
            }});
            const polygonOpacity = marker.getUniform('polygonOpacity');
            expect(polygonOpacity).to.be.eql(0.5);
            done();
        });
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
    });

    it('drawing shadow(fuzhenn/maptalks-studio#1694)', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        new maptalks.GLTFMarker(center, {
            symbol: {
                url: url3,
                shadow: true
            }
        }).addTo(gltflayer);
        gltflayer.once('rendercomplete-debug', () => {
            const renderer = gltflayer.getRenderer();
            const pbrshader = renderer.getShaderList()['pbr'].shader;
            const defines = pbrshader.shaderDefines;
            expect(defines['HAS_SHADOWING']).to.be.ok();
            done();
        });
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
    });

    it('gltfmarker should not update animation matrix when is not in frustum', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const marker = new maptalks.GLTFMarker(center.add(5, 5), {
            symbol: {
                url: url1,
                animation: true,
                loop: true
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            const renderer = gltflayer.getRenderer();
            expect(renderer.isInFrustum(marker)).not.to.be.ok();
            done();
        });
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
    });

    it('changing copy marker\'s symbol will not effect another one(fuzhenn/maptalks-studio#1315)', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const marker1 = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url1,
                uniforms: {
                    polygonOpacity: 1
                }
            }
        }).addTo(gltflayer);
        const marker2 = marker1.copy().addTo(gltflayer);
        setTimeout(function () {
            marker1.setUniform('polygonOpacity', 0.8);
            expect(marker1.getUniforms().polygonOpacity).to.be.eql(0.8);
            expect(marker2.getUniforms().polygonOpacity).to.be.eql(1);
            done();
        }, 100);
    });

    it('remove copy geometry(fuzhenn/maptalks-studio#1359)', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const marker1 = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url2
            }
        }).addTo(gltflayer);
        marker1.copy().addTo(gltflayer);
        gltflayer.on('modelload', () => {
            const renderer = gltflayer.getRenderer();
            const gltfmanager = renderer.regl.gltfManager;
            marker1.remove();
            const resourceObj = gltfmanager.getGLTF(url2);
            expect(resourceObj.refCount).to.be.eql(1);
            done();
        });
    });

    it('baseColorIntensity(fuzhenn/maptalks-studio#1928)', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const marker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url8,
                uniforms: {
                    baseColorIntensity: 0.9
                }
            }
        }).addTo(gltflayer);
        marker.setUniform('baseColorIntensity', 0.8);
        marker.on('load', () => {
            gltflayer.once('rendercomplete-debug', () => {
                const meshes = marker.getMeshes();
                for (let i = 0; i < meshes.length; i++) {
                    const material = meshes[i].getMaterial();
                    const baseColorIntensity = material.get('baseColorIntensity');
                    expect(baseColorIntensity).to.be.eql(0.8);
                }
                gltflayer.remove();
                done();
            });
        });
    });

    it('set rotation for model which is off centered(fuzhenn/maptalks-studio#2298)', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const marker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url1,
                animation: true
            }
        }).addTo(gltflayer);
        marker.on('createscene-debug', () => {
            marker.setRotation(0, 0, 90);
            const meshes = marker.getMeshes();
            const localTransform = meshes[0].localTransform;
            expect(localTransform).to.be.eql([1.2330844404348762e-16, 0.5553318626458865, 0, 0, -4.854865331821925e-8, 1.0779966545686304e-23, -0.5553318626458865, 0, -0.5553318626458865, 1.2330844404348762e-16, 4.854865331821925e-8, 0, -1.975038657620054e-8, 0, 0.5553319111945398, 1]);
            done();
        });
    });

    it('save scale(fuzhenn/maptalks-studio#1296)', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const marker = new maptalks.GLTFMarker(center, {
            symbol: {
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        marker.on('createscene-debug', () => {
            const meshes = marker.getMeshes();
            const localTransform = meshes[0].localTransform;
            expect(localTransform).to.be.eql([1.0659707955902824, 0, 0, 0, 0, 6.527188614020984e-17, 1.0659707955902824, 0, 0, -1.0659707955902824, 6.527188614020984e-17, 0, 0, -1.1102230246251565e-16, -0.010979499405839751, 1]);
            done();
        });
    });

    it('identify more than one layers in groupgllayer', done => {
        const gltflayer1 = new maptalks.GLTFLayer('gltf1');
        new maptalks.GLTFMarker(center, {
            id: 'marker1'
        }).addTo(gltflayer1);
        const gltflayer2 = new maptalks.GLTFLayer('gltf2');
        new maptalks.GLTFMarker(center.add(0.01, 0), {
            id: 'marker2'
        }).addTo(gltflayer2);
        const groupgllayer = new maptalks.GroupGLLayer('gl1', [gltflayer1, gltflayer2], { sceneConfig }).addTo(map);
        const handle = function (e) {
            const result = groupgllayer.identify(e.coordinate)[0];
            const marker = result && result.data;
            if (marker) {
                expect(marker.getId()).to.be.eql('marker1');
                done();
                map.off('dom:click', handle);
            }
        };
        map.on('dom:click', handle);
        setTimeout(function () {
            map.fire('dom:click', {
                coordinate: clickPoint,
                containerPoint: clickContainerPoint
            });
        }, 100);
    });

    it('layer without gltfmarker call identify method', () => {
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const identifyData = gltflayer.identify(center);
        expect(identifyData).to.be.ok();
        expect(identifyData.length).to.be.equal(0);
    });

    it('copy gltfmarker, its meshes\'s scale should be equal(fuzhenn/maptalks-studio#2749)', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const marker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url3
            }
        }).addTo(gltflayer);
        const copyOne = marker.copy();
        copyOne.addTo(gltflayer);
        gltflayer.on('modelload', () => {
            const mesh = marker.getMeshes()[0];
            const copyMesh = marker.getMeshes()[0];
            const scale1 = maptalksgl.mat4.getScaling([], mesh.localTransform);
            const scale2 = maptalksgl.mat4.getScaling([], copyMesh.localTransform);
            expect(scale1).to.be.eql(scale2);
            done();
        });
    });

    it('load model incorrectly(fuzhenn/maptalks-ide/issues/2770、fuzhenn/maptalks-ide/issues/2789)', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        new maptalks.GLTFMarker(center, {
            symbol: {
                url: 'models/beer/beer.gltf'
            }
        }).addTo(gltflayer);
        new maptalks.GLTFMarker(center, {
            symbol: {
                url: 'models/building2/building2.gltf'
            }
        }).addTo(gltflayer);
        new maptalks.GroupGLLayer('gl1', [gltflayer], { sceneConfig }).addTo(map);
        gltflayer.on('modelload', () => {
            done();
        });
    });

    it('clear gltfmarkers in gltflayer and then add the same gltfmarker to gltflayer frequently', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gltfMarker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: 'models/CesiumMan/CesiumMan.gltf'
            }
        }).addTo(gltflayer);
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
        gltfMarker.once('load', () => {
            let times = 0;
            const interval = setInterval(function () {
                if (times > 5) { //test 5 times
                    clearInterval(interval);
                    done();
                    return;
                }
                gltflayer.clear();
                gltfMarker.addTo(gltflayer);
                times++;
            }, 1000);
        });
    });

    it('gltfmarker rotate around its geometry center', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gltfMarker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: 'models/teapot/teapot-in-center.gltf'
            }
        }).addTo(gltflayer);
        gltflayer.on('modelload', () => {
            const mesh = gltfMarker.getMeshes()[0];
            expect(mesh.localTransform).to.be.eql([0.03679145791451537, 0, 0, 0, 0, 2.2528270585487903e-18, 0.03679145791451537, 0, 0, -0.03679145791451537, 2.2528270585487903e-18, 0, -0.052032719067487465, 0, 0.38263114827613254, 1]);
            setTimeout(function() {
                gltfMarker.setRotation(45, 0, 0);
                const mesh = gltfMarker.getMeshes()[0];
                expect(mesh.localTransform).to.be.eql([0.03679145791451537, 0, 0, 0, 0, -0.026015489381093295, 0.02601548938109329, 0, 0, -0.02601548938109329, -0.026015489381093295, 0, -0.052032719067487465, 0.00014702586180909138, 0.6143173942396776, 1]);
                done();
            }, 200);
        });
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
    });

    it('unfixed scale for gltfmarker(fuzhenn/maptalks-ide/issues/2922)', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gltfMarker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url1,
                scaleX: 2,
                scaleY: 1,
                scaleZ: 1
            }
        }).addTo(gltflayer);
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
        gltfMarker.once('load', () => {
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                console.log(pixel1);
                expect(pixelMatch([149, 149, 149, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2 - 90, map.height / 2, 1, 1);//没有被点中，证明不会出现比例不正确的情况
                const pixel3 = pickPixel(map, map.width / 2 + 90, map.height / 2, 1, 1);
                expect(pixelMatch([0, 0, 0, 0], pixel2)).to.be.eql(true);
                expect(pixelMatch([0, 0, 0, 0], pixel3)).to.be.eql(true);
                done();
            });
        });
    });

    it('setCoordinates should update shadow immediately(fuzhenn/maptalks-ide/issues/3081)', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gltfMarker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url1,
                shadow: true
            }
        }).addTo(gltflayer);
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
        gltfMarker.once('load', () => {
            setTimeout(function() {
                const x = 100, y = 250;
                const pixel1 = pickPixel(map, x, y, 1, 1);
                expect(pixelMatch([255, 0, 0, 186], pixel1)).not.to.be.eql(true);
                const coordinate = new maptalks.Coordinate([center.x, center.y, 30]);
                gltfMarker.setCoordinates(coordinate);
                setTimeout(function() {
                    const pixel2 = pickPixel(map, x, y, 1, 1);
                    expect(pixelMatch([255, 0, 0, 186], pixel2)).to.be.eql(true);
                    done();
                }, 100);
            }, 100);
        });
    });

    it('update sceneConfig(fuzhenn/maptalks-ide/issues/3096)', done => {
        const newSceneConfig = JSON.parse(JSON.stringify(sceneConfig));
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gltfMarker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url1,
                shadow: true
            }
        }).addTo(gltflayer);
        const groupgllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
        gltfMarker.once('load', () => {
            newSceneConfig.shadow.enable = false;
            groupgllayer.setSceneConfig(newSceneConfig);
            setTimeout(function() {
                const pixel = pickPixel(map, 140, 215, 1, 1);//阴影关闭
                expect(pixelMatch([0, 0, 0, 0], pixel)).to.be.eql(true);
                done();
            }, 100);
        });
    });

    it('canvasisdirty', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const marker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url2,
                shadow: true
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            gltflayer.once('canvasisdirty', () => {
                map.once('renderend', () => {
                    const canvas = map.getRenderer().canvas;
                    const ctx = canvas.getContext("2d");
                    const width = map.width, height = map.height;
                    const pixels = ctx.getImageData(0, 0, width, height).data;
                    const index = width * (height / 2) * 4 + width / 2 * 4;
                    expect(pixels.slice(index, index + 4)).to.be.eql([146, 146, 146, 255]);
                    expect(pixels.slice(index + 4, index + 8)).to.be.eql([146, 146, 146, 255]);
                    expect(pixels.slice(index + 8, index + 12)).to.be.eql([71, 104, 129, 255]);
                    done();
                });
            });
        });
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
    });
});