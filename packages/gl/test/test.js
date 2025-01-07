const resultCanvas = document.createElement('canvas');

describe('gl tests', () => {
    let container, map;
    const maskCoordinate = [[91.09087832763669, 29.694663476850423],
        [91.08744510009763, 29.621270449579555],
        [91.18597873046872, 29.62216580885527],
        [91.18700869873044, 29.699733374620422]];
    beforeEach(() => {
        container = document.createElement('div');
        const width = 512, height = 512;
        container.style.width = width + 'px';
        container.style.height = height + 'px';
        document.body.appendChild(container);
    });

    afterEach(() => {
        map.remove();
        document.body.removeChild(container);
    });

    context('ground color tests', () => {
        it('support css color in ground', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const sceneConfig = {
                ground: {
                    enable: true,
                    renderPlugin: {
                        type: 'fill'
                    },
                    symbol: {
                        polygonFill: '#f00'
                    }
                }
            };
            const group = new maptalks.GroupGLLayer('group', [], {
                sceneConfig
            });
            let count = 0;
            group.once('layerload', () => {
                if (count === 0) {
                    const canvas = map.getRenderer().canvas;
                    const ctx = canvas.getContext('2d');
                    const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                    expect(pixel).to.be.eql({ data: { '0': 255, '1': 0, '2': 0, '3': 255 } });
                    done();
                }
                count++;
            });
            group.addTo(map);
        });
    });

    context('imagelayer tests', () => {
        it('support imageLayer in post process', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const sceneConfig = {
                postProcess: {
                    enable: true,
                    antialias: {
                        enable: true
                    }
                }
            };
            const imageLayer = new maptalks.ImageLayer('images', [{
                url: "./fixtures/tiles/tile-green-256.png",
                extent: [
                    91.14478, 29.658272,
                    91.15578, 29.668272
                ]
            }]);
            const group = new maptalks.GroupGLLayer('group', [imageLayer], {
                sceneConfig
            });
            setTimeout(() => {
                const canvas = map.getRenderer().canvas;
                const ctx = canvas.getContext('2d');
                const pixel = ctx.getImageData(canvas.width / 2 + 10, canvas.height / 2 - 10, 1, 1);
                expect(pixel).to.be.eql({ data: { '0': 0, '1': 255, '2': 0, '3': 255 } });
                done();
            }, 500)
            group.addTo(map);
        });

    });

    context('tilelayer tests', () => {
        it('support tilelayer in post process, maptalks/issues#148', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const sceneConfig = {
                postProcess: {
                    enable: true,
                    antialias: {
                        enable: true
                    }
                }
            };
            const tileLayer = new maptalks.TileLayer('base', {
                urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
            });
            const group = new maptalks.GroupGLLayer('group', [tileLayer], {
                sceneConfig
            });
            let count = 0;
            group.once('layerload', () => {
                if (count === 0) {
                    const canvas = map.getRenderer().canvas;
                    const ctx = canvas.getContext('2d');
                    const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                    expect(pixel).to.be.eql({ data: { '0': 128, '1': 132, '2': 133, '3': 255 } });
                    done();
                }
                count++;
            });
            group.addTo(map);
        });

        it('support tilelayer layerload event, maptalks/issues#445', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const sceneConfig = {
                postProcess: {
                    enable: true,
                    antialias: {
                        enable: true
                    }
                }
            };
            const tileLayer = new maptalks.TileLayer('base', {
                urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
            });
            const group = new maptalks.GroupGLLayer('group', [tileLayer], {
                sceneConfig
            });
            tileLayer.once('layerload', () => {
                const canvas = map.getRenderer().canvas;
                const ctx = canvas.getContext('2d');
                const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                expect(pixel).to.be.eql({ data: { '0': 128, '1': 132, '2': 133, '3': 255 } });
                done();
            });
            group.addTo(map);
        });

        it('support tilelayer in post process (taa off), maptalks/issues#148', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const sceneConfig = {
                postProcess: {
                    enable: true,
                    antialias: {
                        enable: true
                    }
                }
            };
            const tileLayer = new maptalks.TileLayer('base', {
                urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
            });
            const group = new maptalks.GroupGLLayer('group', [tileLayer], {
                sceneConfig
            });
            let count = 0;
            group.once('layerload', () => {
                if (count === 0) {
                    const canvas = map.getRenderer().canvas;
                    const ctx = canvas.getContext('2d');
                    const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                    expect(pixel).to.be.eql({ data: { '0': 128, '1': 132, '2': 133, '3': 255 } });
                    done();
                }
                count++;
            });
            group.addTo(map);
        });

        it('tilelayer order in GroupGLLayer, maptalks/issues#300', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const sceneConfig = {
                postProcess: {
                    enable: true,
                    antialias: {
                        enable: true
                    }
                }
            };
            const greenLayer = new maptalks.TileLayer('black', {
                urlTemplate: './fixtures/tiles/tile-green-256.png',
                zIndex: 1,
                fadeAnimation: false
            });
            const redLayer = new maptalks.TileLayer('red', {
                urlTemplate: './fixtures/tiles/tile-red-256.png',
                zIndex: 0,
                fadeAnimation: false
            });
            const group = new maptalks.GroupGLLayer('group', [greenLayer, redLayer], {
                sceneConfig
            });
            group.addTo(map);
            setTimeout(() => {
                const canvas = map.getRenderer().canvas;
                const ctx = canvas.getContext('2d');
                const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                expect(pixel).to.be.eql({ data: { '0': 0, '1': 255, '2': 0, '3': 255 } });
                done();
            }, 500);
        });

        it('add skinLayers, maptalks/issues#469', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const sceneConfig = {
                postProcess: {
                    enable: true,
                    antialias: {
                        enable: true
                    }
                }
            };
            const greenLayer = new maptalks.TileLayer('black', {
                urlTemplate: './fixtures/tiles/tile-green-256.png',
                opacity: 0.5,
                fadeAnimation: false
            });
            const redLayer = new maptalks.TileLayer('red', {
                urlTemplate: './fixtures/tiles/tile-red-256.png',
                opacity: 0.5,
                fadeAnimation: false
            });
            const group = new maptalks.GroupGLLayer('group', [], {
                sceneConfig
            });
            group.addTo(map);
            group.addLayer(greenLayer);
            group.addLayer(redLayer);
            setTimeout(() => {
                const canvas = map.getRenderer().canvas;
                const ctx = canvas.getContext('2d');
                const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                expect(pixel).to.be.eql({ data: { '0': 170, '1': 85, '2': 0, '3': 191 } });
                done();
            }, 500);
        });

        it('tilelayer hide in GroupGLLayer, maptalks/issues#758', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const sceneConfig = {
                postProcess: {
                    enable: true
                }
            };
            const tileLayer = new maptalks.TileLayer('base', {
                urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
            });
            const group = new maptalks.GroupGLLayer('group', [tileLayer], {
                sceneConfig
            });

            tileLayer.once('hide', () => {
                const canvas = map.getRenderer().canvas;
                const ctx = canvas.getContext('2d');
                const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                expect(pixel).to.be.eql({ data: { '0': 128, '1': 132, '2': 133, '3': 255 } });
                done();

            });
            group.once('layerload', () => {
                tileLayer.hide();
            });
            group.addTo(map);
        });
    });

    context('GroupGLLayer tests', () => {
        it('layer.remove, maptalks/issues#435', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const sceneConfig = {
                postProcess: {
                    enable: true,
                    antialias: {
                        enable: true
                    }
                }
            };
            const greenLayer = new maptalks.TileLayer('black', {
                urlTemplate: './fixtures/tiles/tile-green-256.png',
                zIndex: 1,
                fadeAnimation: false
            });
            const redLayer = new maptalks.TileLayer('red', {
                urlTemplate: './fixtures/tiles/tile-red-256.png',
                zIndex: 0,
                fadeAnimation: false
            });
            const group = new maptalks.GroupGLLayer('group', [greenLayer, redLayer], {
                sceneConfig
            });
            group.addTo(map);
            setTimeout(() => {
                greenLayer.remove();
                redLayer.remove();
            }, 200);
            setTimeout(() => {
                const layers = group.getLayers();
                expect(layers.length).to.be.eql(0);
                const canvas = map.getRenderer().canvas;
                const ctx = canvas.getContext('2d');
                const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                expect(pixel).to.be.eql({ data: { '0': 0, '1': 0, '2': 0, '3': 0 } });
                done();
            }, 500);
        });

        it('remove and add again, fix maptalks/issues#256', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const sceneConfig = {
                postProcess: {
                    enable: true,
                    antialias: {
                        enable: true
                    }
                }
            };
            const greenLayer = new maptalks.TileLayer('black', {
                urlTemplate: './fixtures/tiles/tile-green-256.png',
                zIndex: 1,
                fadeAnimation: false
            });
            const group = new maptalks.GroupGLLayer('group', [greenLayer], {
                sceneConfig
            });
            group.addTo(map);
            setTimeout(() => {
                map.removeLayer(group);
                setTimeout(() => {
                    group.once('layerload', () => {
                        done();
                    });
                    group.addTo(map);
                }, 200);
            }, 200);
        });

        it('GroupGLLayer.clearLayers(), maptalks/issues#416', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const sceneConfig = {
                postProcess: {
                    enable: true,
                    antialias: {
                        enable: true
                    }
                }
            };
            const greenLayer = new maptalks.TileLayer('black', {
                urlTemplate: './fixtures/tiles/tile-green-256.png',
                zIndex: 1,
                fadeAnimation: false
            });
            const redLayer = new maptalks.TileLayer('red', {
                urlTemplate: './fixtures/tiles/tile-red-256.png',
                zIndex: 0,
                fadeAnimation: false
            });
            const group = new maptalks.GroupGLLayer('group', [greenLayer, redLayer], {
                sceneConfig
            });
            group.addTo(map);
            setTimeout(() => {
                group.clearLayers();
            }, 200);
            setTimeout(() => {
                const layers = group.getLayers();
                expect(layers.length).to.be.eql(0);
                const canvas = map.getRenderer().canvas;
                const ctx = canvas.getContext('2d');
                const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                expect(pixel).to.be.eql({ data: { '0': 0, '1': 0, '2': 0, '3': 0 } });
                done();
            }, 500);
        });
    });

    context('terrain tests', () =>{
        it('GroupGLLayer.queryTerrain', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
                })
            ];
            const terrain = {
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0
            }
            const group = new maptalks.GroupGLLayer('group', skinLayers, { terrain });
            let hit = false;
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    group.on('layerload', () => {
                        if (!hit) {
                            const altitude = group.queryTerrain(map.getCenter());
                            if (!altitude[0]) {
                                return;
                            }
                            hit = true;
                            expect(altitude).to.be.eql([3653.89990234375, 1]);
                            done();
                        }

                    });

                });
            });
            group.addTo(map);
        });

        it('remove and add skinLayers', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    urlTemplate: './fixtures/tiles/tile-green-256.png',
                })
            ];
            const terrain = {
                fadeAnimation: false,
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0
            }
            const group = new maptalks.GroupGLLayer('group', skinLayers, {
                terrain
            });
            const canvas = map.getRenderer().canvas;
            const ctx = canvas.getContext('2d');
            let count = 0;
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    group.on('layerload', () => {
                        count++;
                        if (count === 1) {
                            const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                            expect(pixel).to.be.eql({ data: { '0': 0, '1': 255, '2': 0, '3': 255 } });
                            group.removeLayer('base');
                        } else if (count === 4) {
                            const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                            expect(pixel).to.be.eql({ data: { '0': 0, '1': 0, '2': 0, '3': 0 } });
                            group.addLayer(skinLayers[0]);
                        } else if (count === 5) {
                            const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                            expect(pixel).to.be.eql({ data: { '0': 0, '1': 255, '2': 0, '3': 255 } });
                            done();
                        }
                    });
                });
            });
            group.addTo(map);
        });


        it('remove and add childLayer again, maptalks/issues#555', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const terrain = {
                fadeAnimation: false,
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0
            };
            const sceneConfig = {
                postProcess: {
                    enable: true,
                    antialias: {
                        enable: true
                    }
                }
            };
            const greenLayer = new maptalks.TileLayer('green', {
                urlTemplate: './fixtures/tiles/tile-green-256.png',
                fadeAnimation: false
            });
            const redLayer = new maptalks.TileLayer('red', {
                urlTemplate: './fixtures/tiles/tile-red-256.png',
                zIndex: 1,
                fadeAnimation: false
            });
            const group = new maptalks.GroupGLLayer('group', [greenLayer, redLayer], {
                sceneConfig,
                terrain
            });
            group.addTo(map);
            setTimeout(() => {
                group.removeLayer(greenLayer);
                setTimeout(() => {
                    group.once('layerload', () => {
                        done();
                    });
                    group.addLayer(greenLayer);
                }, 1000);
            }, 1000);
        });

        it('terrain layer with 256 skin layer', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
                })
            ];
            const terrain = {
                fadeAnimation: false,
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0
            }
            const group = new maptalks.GroupGLLayer('group', skinLayers, {
                terrain
            });
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    group.on('layerload', () => {
                        const canvas = map.getRenderer().canvas;
                        const ctx = canvas.getContext('2d');
                        const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                        expect(pixel).to.be.eql({ data: { 0: 136, 1: 140, 2: 141, 3: 255 } });
                        done();
                    });
                });
            });
            group.addTo(map);
        });

        it('terrain layer with opacity', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
                })
            ];
            const terrain = {
                fadeAnimation: false,
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0,
                opacity: 0.5
            }
            const group = new maptalks.GroupGLLayer('group', skinLayers, {
                terrain
            });
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    group.once('layerload', () => {
                        const canvas = map.getRenderer().canvas;
                        const ctx = canvas.getContext('2d');
                        const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                        expect(pixel).to.be.eql({ data: { '0': 136, '1': 140, '2': 141, '3': 255 } });
                        done();
                    });
                });
            });
            group.addTo(map);
        });

        it('GroupGLLayer.setTerrain', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
                })
            ];
            const terrain = {
                fadeAnimation: false,
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0
            }
            const group = new maptalks.GroupGLLayer('group', skinLayers);
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    group.once('layerload', () => {
                        const canvas = group.getRenderer().canvas;
                        const pixel = readPixel(canvas, canvas.width / 2, canvas.height / 2);
                        expect(pixel).to.be.eql({ data: { '0': 136, '1': 140, '2': 141, '3': 255 }});
                        done();
                    });
                });
            });
            group.addTo(map);
            group.setTerrain(terrain);
        });

        it('GroupGLLayer with skinLayers', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
                })
            ];
            const group = new maptalks.GroupGLLayer('group', skinLayers);
            group.once('layerload', () => {
                done();
            });
            group.addTo(map);
        });

        it('GroupGLLayer set null terrain', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
                })
            ];
            const terrain = {
                fadeAnimation: false,
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0
            }
            const group = new maptalks.GroupGLLayer('group', skinLayers, { terrain });
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    group.once('layerload', () => {
                        const canvas = group.getRenderer().canvas;
                        const pixel = readPixel(canvas, canvas.width / 2, canvas.height / 2);
                        expect(pixel).to.be.eql({ data: { '0': 128, '1': 132, '2': 133, '3': 255 } });
                        done();
                    });
                    group.setTerrain(null);
                });
            });
            group.addTo(map);
        });

        it('terrain with dpr of 2', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12,
                devicePixelRatio: 2
            });
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
                })
            ];
            const terrain = {
                fadeAnimation: false,
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0
            }
            const group = new maptalks.GroupGLLayer('group', skinLayers, { terrain });
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    group.once('layerload', () => {
                        const canvas = map.getRenderer().canvas;
                        const ctx = canvas.getContext('2d');
                        const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                        expect(pixel).to.be.eql({ data: { '0': 136, '1': 140, '2': 141, '3': 255 } });
                        const altitude = group.queryTerrain(map.getCenter());
                        expect(altitude).to.be.eql([3653.89990234375, 1]);
                        done();
                    });
                });
            });
            group.addTo(map);
        });

        it('terrain with lit shader', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const terrain = {
                fadeAnimation: false,
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0,
                shader: 'lit',
                material: {
                    baseColorFactor: [1, 1, 1, 1],
                    roughnessFactor: 0.9,
                    metallicFactor: 0
                }
            }
            const group = new maptalks.GroupGLLayer('group', [], { terrain });
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    let hit = false;
                    group.on('layerload', () => {
                        if (!hit) {
                            const canvas = map.getRenderer().canvas;
                            const ctx = canvas.getContext('2d');
                            const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2 + 7, 1, 1);
                            if (pixel.data['0'] !== 128) {
                                return;
                            }
                            hit = true;
                            expect(pixel).to.be.eql({ data: { '0': 128, '1': 128, '2': 128, '3': 255 } });
                            done();
                        }

                    });
                });
            });
            group.addTo(map);
        });

        it('update terrain material by setTerrain', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const terrain = {
                fadeAnimation: false,
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0,
                shader: 'lit',
                material: {
                    baseColorFactor: [1, 1, 1, 1],
                    roughnessFactor: 0.9,
                    metallicFactor: 0
                }
            }
            const group = new maptalks.GroupGLLayer('group', [], { terrain });
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    let count = 0;
                    group.on('layerload', () => {
                        count++;
                        if (count === 1) {
                            terrain.material.baseColorFactor = [1, 0, 0, 1];
                            group.setTerrain(terrain);
                        } else if (count === 2) {
                            const canvas = map.getRenderer().canvas;
                            const ctx = canvas.getContext('2d');
                            const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2 + 7, 1, 1);
                            expect(pixel).to.be.eql({ data: { '0': 128, '1': 0, '2': 0, '3': 255 } });
                            done();
                        }
                    });
                });
            });
            group.addTo(map);
        });

        it('update terrain material by updateTerrainMaterial', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const terrain = {
                fadeAnimation: false,
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0,
                shader: 'lit'
            };
            const material = {
                baseColorFactor: [1, 0, 0, 1],
                roughnessFactor: 0.9,
                metallicFactor: 0
            };
            const group = new maptalks.GroupGLLayer('group', [], { terrain });
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    let count = 0;
                    group.on('layerload', () => {
                        count++;
                        if (count === 1) {
                            group.updateTerrainMaterial(material);
                        } else if (count === 2) {
                            const canvas = map.getRenderer().canvas;
                            const ctx = canvas.getContext('2d');
                            const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2 + 7, 1, 1);
                            expect(pixel).to.be.eql({ data: { '0': 128, '1': 0, '2': 0, '3': 255 } });
                            const exportMat = group.toJSON().options.terrain.material;
                            expect(material).to.be.eql(exportMat);
                            done();
                        }
                    });
                });
            });
            group.addTo(map);
        });

        it('terrain with invalid terrain tiles', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
                })
            ];
            const terrain = {
                fadeAnimation: false,
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/invalid.webp',
                tileStackDepth: 0,
                shader: 'lit',
                material: {
                    baseColorFactor: [1, 1, 1, 1],
                    roughnessFactor: 0.9,
                    metallicFactor: 0
                }
            }
            const group = new maptalks.GroupGLLayer('group', skinLayers, { terrain });
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    group.once('layerload', () => {
                        const canvas = map.getRenderer().canvas;
                        const ctx = canvas.getContext('2d');
                        const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2 + 7, 1, 1);
                        expect(pixel).to.be.eql({ data: { '0': 121, '1': 125, '2': 126, '3': 255 } });
                        done();
                    });
                });
            });
            group.addTo(map);
        });

        it('switch shader for terrain', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
                })
            ];
            const terrain = {
                fadeAnimation: false,
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0,
                shader: 'lit',
                material: {
                    baseColorFactor: [1, 1, 1, 1],
                    roughnessFactor: 0.9,
                    metallicFactor: 0
                }
            }
            const group = new maptalks.GroupGLLayer('group', skinLayers, { terrain });

            setTimeout(() => {
                const canvas = map.getRenderer().canvas;
                const ctx = canvas.getContext('2d');
                const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2 + 7, 1, 1);
                expect(pixel).to.be.eql({ data: { '0': 139, '1': 143, '2': 144, '3': 255 } });
                group.getTerrainLayer().options.shader = 'default';
                setTimeout(() => {
                    const canvas = map.getRenderer().canvas;
                    const ctx = canvas.getContext('2d');
                    const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                    expect(pixel).to.be.eql({ data: { '0': 136, '1': 140, '2': 141, '3': 255 } });
                    done();
                }, 1000);
            }, 2000);
            group.addTo(map);
        }).timeout(5000);

        it('terrain of cesium', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                spatialReference: {
                    projection: 'EPSG:4326'
                },
                zoom: 12
            });
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    tileSystem : [1, -1, -180, 90],
                    fadeAnimation: false,
                    urlTemplate: '/fixtures/tianditu-terrain/{z}/{x}/{y}.jpg',
                })
            ];
            const terrain = {
                fadeAnimation: false,
                maxAvailableZoom: 14,
                type: 'cesium',
                urlTemplate: '/fixtures/cesium-terrain/{z}/{x}/{y}.terrain',
                tileStackDepth: 0
            }
            const group = new maptalks.GroupGLLayer('group', skinLayers, { terrain });
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    group.once('layerload', () => {
                        const canvas = map.getRenderer().canvas;
                        const ctx = canvas.getContext('2d');
                        const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                        expect(pixel).to.be.eql({ data: { '0': 91, '1': 93, '2': 96, '3': 255 } });
                        done();
                    });
                });
            });
            group.addTo(map);
        });

        // function fetchTerrain(x, y, z) {
        //     const headers = {
        //         'Accept-Encoding': 'gzip, deflate, br'
        //     };
        //     const options = {
        //         method: 'GET',
        //         referrer: location.origin,
        //         headers
        //     };
        //     const url = `https://t4.tianditu.gov.cn/mapservice/swdx?T=elv_c&tk=8d01c39a7595da62e1a32a1e109584a3&x=${x}&y=${y}&l=${z}`;
        //     fetch(url, options)
        //     .then(resp => {
        //         return resp.blob();
        //     })
        //     .then(blob => {
        //         const elementA = document.createElement('a');
        //         document.body.appendChild(elementA);
        //         elementA.setAttribute('href', window.URL.createObjectURL(blob));
        //         elementA.setAttribute('download', y + '.terrain');
        //         elementA.click();
        //         document.body.removeChild(elementA);
        //     });
        // }

        it('terrain of tianditu', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                spatialReference: {
                    projection: 'EPSG:4326'
                },
                zoom: 11
            });
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    tileSystem : [1, -1, -180, 90],
                    fadeAnimation: false,
                    urlTemplate: '/fixtures/tianditu-terrain/{z}/{x}/{y}.jpg',
                })
            ];
            const terrain = {
                // debug: true,
                maxAvailableZoom: 12,
                fadeAnimation: false,
                type: 'tianditu',
                urlTemplate: '/fixtures/tianditu-terrain/{z}/{x}/{y}.terrain',
                tileStackDepth: 0
            }
            const group = new maptalks.GroupGLLayer('group', skinLayers, { terrain });
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    group.once('layerload', () => {
                        const canvas = map.getRenderer().canvas;
                        const ctx = canvas.getContext('2d');
                        const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2 + 1, 1, 1);
                        expect(pixel).to.be.eql({ data: { '0': 95, '1': 100, '2': 103, '3': 255 } });
                        done();
                    });
                });
            });
            group.addTo(map);
        });

        it('terrain of tianditu at zoom 14', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                spatialReference: {
                    projection: 'EPSG:4326'
                },
                zoom: 14
            });
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    tileSystem : [1, -1, -180, 90],
                    fadeAnimation: false,
                    urlTemplate: '/fixtures/tianditu-terrain/{z}/{x}/{y}.jpg'
                })
            ];
            const terrain = {
                // debug: true,
                maxAvailableZoom: 11,
                fadeAnimation: false,
                type: 'tianditu',
                urlTemplate: '/fixtures/tianditu-terrain/{z}/{x}/{y}.terrain',
                tileStackDepth: 0
            }
            const group = new maptalks.GroupGLLayer('group', skinLayers, { terrain });
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    group.once('layerload', () => {
                        const canvas = map.getRenderer().canvas;
                        const ctx = canvas.getContext('2d');
                        const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2 + 1, 1, 1);
                        expect(pixel).to.be.eql({ data: { '0': 85, '1': 85, '2': 79, '3': 255 }  });
                        done();
                    });
                });
            });
            group.addTo(map);
        });

        it('terrain with offset skin at zoom 12', done => {
            map = new maptalks.Map(container, {
                center: [94.50812103, 29.45595163],
                zoom: 14
            });
            const targetCoord = new maptalks.Coordinate(0, 0);
            const POINT0 = new maptalks.Coordinate(0, 0);
            const POINT1 = new maptalks.Coordinate(0, 0);
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    offset: function(z, center) {
                        center = center || map.getCenter();
                        const c = maptalks.CRSTransform.transform(center.toArray(), "GCJ02", "WGS84");
                        targetCoord.set(c[0], c[1]);
                        const offset = map
                            .coordToPoint(center, z, POINT0)
                            ._sub(map.coordToPoint(targetCoord, z, POINT1));
                        return offset._round().toArray();
                    },
                    urlTemplate: '/fixtures/tiles/UV_Grid_Sm.jpg',
                })
            ];
            const terrain = {
                fadeAnimation: false,
                type: 'mapbox',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.pngraw',
                tileStackDepth: 0
            }
            const group = new maptalks.GroupGLLayer('group', skinLayers, { terrain });
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    group.once('layerload', () => {
                        const canvas = map.getRenderer().canvas;
                        const ctx = canvas.getContext('2d');
                        const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                        expect(pixel).to.be.eql({ data: { '0': 194, '1': 98, '2': 117, '3': 255 } });
                        done();
                    });
                });
            });
            group.addTo(map);
        });

        it('4326 terrain with 512 tile with revered tileSystem.y, fix maptalks/issues#468', done => {
            map = new maptalks.Map(container, {
                center: [94.50812103, 29.45595163],
                spatialReference: { projection: 'EPSG:4326' },
                zoom: 14
            });
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    tileSize: 512,
                    tileSystem: [1, -1, -180, 90],
                    urlTemplate: '/fixtures/tiles/UV_Grid_Sm_512.jpg',
                })
            ];
            const terrain = {
                type: 'cesium',
                terrainWidth: 65,
                urlTemplate: '#',
                debug: true
            }
            const group = new maptalks.GroupGLLayer('group', skinLayers, { terrain });
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    group.once('layerload', () => {
                        const canvas = map.getRenderer().canvas;
                        const ctx = canvas.getContext('2d');
                        const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                        expect(pixel).to.be.eql({ data: { '0': 121, '1': 83, '2': 168, '3': 255 } });
                        done();
                    });
                });
            });
            group.addTo(map);
        });

        it('512 terrain with offset skin at zoom 12', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const targetCoord = new maptalks.Coordinate(0, 0);
            const POINT0 = new maptalks.Coordinate(0, 0);
            const POINT1 = new maptalks.Coordinate(0, 0);
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    offset: function(z, center) {
                        center = center || map.getCenter();
                        const c = maptalks.CRSTransform.transform(center.toArray(), "GCJ02", "WGS84");
                        targetCoord.set(c[0], c[1]);
                        const offset = map
                            .coordToPoint(center, z, POINT0)
                            ._sub(map.coordToPoint(targetCoord, z, POINT1));
                        return offset._round().toArray();
                    },
                    urlTemplate: '/fixtures/tiles/UV_Grid_Sm.jpg',
                })
            ];
            const terrain = {
                fadeAnimation: false,
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0
            };
            const group = new maptalks.GroupGLLayer('group', skinLayers, { terrain });
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    group.once('layerload', () => {
                        const canvas = map.getRenderer().canvas;
                        const ctx = canvas.getContext('2d');
                        const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                        expect(pixel).to.be.eql({ data: { '0': 190, '1': 77, '2': 125, '3': 255 } });
                        done();
                    });
                });
            });
            group.addTo(map);
        });

        it('GroupGLLayer.queryTerrainAtPoint', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12,
                pitch: 60
            });
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
                })
            ];
            const terrain = {
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0
            }
            const group = new maptalks.GroupGLLayer('group', skinLayers, { terrain });
            let hit = false;
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    group.on('layerload', () => {
                        if (!hit) {
                            const pickCoord = group.queryTerrainAtPoint(new maptalks.Point(91.14478,29.658272));
                            if (!pickCoord) {
                                return;
                            }
                            hit = true;
                            expect(pickCoord.toArray()).to.be.eql([ 91.07367661817864, 29.751498692202283, 4328.393288386729 ]);
                            done();
                        }
                    });

                });
            });
            group.addTo(map);
        });

        it('GroupGLLayer.queryTerrainAtPoint without terrain, maptalks/issues#606', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12,
                pitch: 60
            });
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    urlTemplate: '#'
                })
            ];
            const group = new maptalks.GroupGLLayer('group', skinLayers, { });
            group.addTo(map);
            setTimeout(() => {
                const pickCoord = group.queryTerrainAtPoint(new maptalks.Point(91.14478,29.658272));
                if (!pickCoord) {
                    done();
                }
            }, 200);
        });

        it('support weather for terrain', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
                })
            ];
            const terrain = {
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0
            }
            const sceneConfig = {
                environment: {
                    enable: true,
                    mode: 1,
                    level: 0
                },
                postProcess: {
                    enable: true
                },
                weather: {
                    enable: true,
                    rain: {
                        enable: true,
                        rainDepth: 3800,
                        density: 3000,
                        rainTexture: "./resources/rain.png"
                    },
                    fog: {
                        enable: true,
                        start: 0.1,
                        end: 200,
                        color: [0.9, 0.9, 0.9]
                    }
                }
            };
            const group = new maptalks.GroupGLLayer('group', skinLayers, { terrain, sceneConfig });
            function pixelMatch(expectedValue, pixelValue) {
                for (let i = 0; i < expectedValue.length; i++) {
                    if (Math.abs(pixelValue[i] - expectedValue[i]) > 10) {
                        return false;
                    }
                }
                return true;
            }
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    setTimeout(function() {
                        const canvas = map.getRenderer().canvas;
                        const ctx = canvas.getContext('2d');
                        const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                        expect(pixelMatch([93, 95, 96, 255], pixel.data)).to.be.eql(true);
                        done();
                    }, 100);

                });
            });
            group.addTo(map);
        });

        it('Measure3DTool support terrain', (done) => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12,
                pitch: 60
            });
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
                })
            ];
            const terrain = {
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0
            };
            const group = new maptalks.GroupGLLayer('group', skinLayers, { terrain });
            const center = map.getCenter();
            let measuretool = null;
            const containerPoint = new maptalks.Point(map.width / 2, map.height / 2);
            function measure() {
                measuretool.fire('drawstart', { coordinate: center, containerPoint });
                measuretool.fire('mousemove', { coordinate: center.add(0.001, 0), containerPoint: containerPoint.add(10, 0) });
                const result = measuretool.getMeasureResult();
                expect(result.toFixed(2)).to.be.above(700);
                measuretool.clear();
                done();
            }
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    setTimeout(function() {
                        measuretool = new maptalks.Height3DTool({
                            enable: true
                        }).addTo(map);
                        setTimeout(function () {
                            measure();
                        }, 100);
                    }, 100);
                });
            });
            group.addTo(map);
        });
    });

    context('skybox tests', () => {
        it('support only ambient, maptalks/issues#360', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12,
                lights: {
                    ambient: {
                        resource: {
                            url: './resources/env.hdr',
                            prefilterCubeSize: 32
                        }
                    }
                }
            });
            const sceneConfig = {
                environment: {
                    enable: true,
                    mode: 1,
                    level: 0
                },
                ground: {
                    enable: true,
                    renderPlugin: {
                        type: 'lit'
                    },
                    symbol: {
                        material: {
                            'baseColorFactor': [1, 1, 1, 1],
                            'roughnessFactor': 0.,
                            'metalnessFactor': 1,
                            'outputSRGB': 0,
                            'hsv': [0, 0, 0],
                            'contrast': 1.5
                        },
                        polygonFill: [1, 1, 1, 1],
                        polygonOpacity: 1
                    }
                },
                postProcess: {
                    enable: true,
                }
            };
            map.on('updatelights', () => {
                setTimeout(() => {
                    done();
                }, 200)
            });
            const group = new maptalks.GroupGLLayer('group', [], { sceneConfig });
            group.addTo(map);
        });

        it('support ambient with urlModifier', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12,
                lights: {
                    ambient: {
                        resource: {
                            url: './resources/env1.hdr',
                            prefilterCubeSize: 32
                        }
                    },
                    urlModifier: (url) => {
                        if (url === './resources/env1.hdr') {
                            return './resources/env.hdr';
                        }
                        return url
                    }
                }
            });
            const sceneConfig = {
                environment: {
                    enable: true,
                    mode: 1,
                    level: 0
                },
                ground: {
                    enable: true,
                    renderPlugin: {
                        type: 'lit'
                    },
                    symbol: {
                        material: {
                            'baseColorFactor': [1, 1, 1, 1],
                            'roughnessFactor': 0.,
                            'metalnessFactor': 1,
                            'outputSRGB': 0,
                            'hsv': [0, 0, 0],
                            'contrast': 1.5
                        },
                        polygonFill: [1, 1, 1, 1],
                        polygonOpacity: 1
                    }
                },
                postProcess: {
                    enable: true,
                }
            };
            map.on('updatelights', () => {
                setTimeout(() => {
                    const resources = map.getLightManager().getAmbientResource();
                    expect(resources.prefilterMap).to.be.ok();
                    expect(resources.sh).to.be.ok();
                    done();
                }, 200)
            });
            const group = new maptalks.GroupGLLayer('group', [], { sceneConfig });
            group.addTo(map);
        });

        it('support lit ground with urlModifier', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const sceneConfig = {
                environment: {
                    enable: true,
                    mode: 1,
                    level: 0
                },
                ground: {
                    enable: true,
                    renderPlugin: {
                        type: 'lit'
                    },
                    symbol: {
                        material: {
                            'baseColorFactor': [1, 1, 1, 1],
                            'baseColorTexture': '/resources/skybox_bridge/posx.jpg1'
                        },
                        polygonFill: [1, 1, 1, 1],
                        polygonOpacity: 1
                    },
                    urlModifier: (url) => {
                        if (url.indexOf('jpg1') > 0) {
                            return url.replaceAll('jpg1', 'jpg');
                        }
                        return url;
                    }
                },
                postProcess: {
                    enable: true,
                }
            };
            const group = new maptalks.GroupGLLayer('group', [], { sceneConfig });
            group.addTo(map);
            setTimeout(() => {
                const canvas = map.getRenderer().canvas;
                const ctx = canvas.getContext('2d');
                const data = ctx.getImageData(192, 128, 1, 1);
                const expected = new Uint8ClampedArray([69, 93, 112, 255]);
                expect(data.data).to.be.eql(expected);
                done();
            }, 800);
        });

        it('support fill ground with urlModifier', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const sceneConfig = {
                environment: {
                    enable: true,
                    mode: 1,
                    level: 0
                },
                ground: {
                    enable: true,
                    renderPlugin: {
                        type: 'fill'
                    },
                    symbol: {
                        polygonPatternFile: '/resources/skybox_bridge/posx.jpg1',
                        polygonFill: [1, 1, 1, 1],
                        polygonOpacity: 1
                    },
                    urlModifier: (url) => {
                        if (url.indexOf('jpg1') > 0) {
                            return url.replaceAll('jpg1', 'jpg');
                        }
                        return url;
                    }
                },
                postProcess: {
                    enable: true,
                }
            };
            const group = new maptalks.GroupGLLayer('group', [], { sceneConfig });
            group.addTo(map);
            setTimeout(() => {
                const canvas = map.getRenderer().canvas;
                const ctx = canvas.getContext('2d');
                const data = ctx.getImageData(192, 128, 1, 1);
                const expected = new Uint8ClampedArray([62, 84, 102, 255]);
                expect(data.data).to.be.eql(expected);
                done();
            }, 1000);
        });

        it('support skybox with 6 images', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const lights = {
                ambient: {
                    resource: {
                        // url: './resources/venice_sunset_2k.hdr',
                        url: {
                            front: '/resources/skybox_bridge/posx.jpg',
                            back: '/resources/skybox_bridge/negx.jpg',
                            right: '/resources/skybox_bridge/posy.jpg',
                            left: '/resources/skybox_bridge/negy.jpg',
                            top: '/resources/skybox_bridge/posz.jpg',
                            bottom: '/resources/skybox_bridge/negz.jpg'
                        },
                        prefilterCubeSize: 512,
                    },
                    exposure: 1.5,
                    orientation: 0
                },
                directional: {
                    color : [0.1, 0.1, 0.1],
                    direction : [1, 0, -1]
                }
            };
            map.setLights(lights);
            map.setPitch(80);
            const sceneConfig = {
                environment: {
                    enable: true,
                    mode: 1,
                    level: 0
                },
                ground: {
                    enable: true,
                    renderPlugin: {
                        type: 'lit'
                    },
                    symbol: {
                        material: {
                            'baseColorFactor': [1, 1, 1, 1],
                            'roughnessFactor': 0.,
                            'metalnessFactor': 1,
                            'outputSRGB': 0,
                            'hsv': [0, 0, 0],
                            'contrast': 1.5
                        },
                        polygonFill: [1, 1, 1, 1],
                        polygonOpacity: 1
                    }
                },
                postProcess: {
                    enable: true,
                }
            };
            map.on('updatelights', () => {
                setTimeout(() => {
                    const canvas = map.getRenderer().canvas;
                    const ctx = canvas.getContext('2d');
                    const data = ctx.getImageData(192, 128, 5, 5);
                    const expected = new Uint8ClampedArray([238,237,205,255,236,235,203,255,234,233,202,255,233,232,200,255,232,231,199,255,238,239,207,255,236,237,205,255,235,236,204,255,234,235,204,255,233,234,203,255,238,241,209,255,236,239,207,255,235,238,207,255,235,238,207,255,235,238,207,255,238,242,211,255,236,241,209,255,236,241,209,255,236,241,210,255,237,241,210,255,235,243,214,255,235,242,213,255,234,242,213,255,235,242,213,255,235,243,213,255]);
                    expect(data.data).to.be.eql(expected);
                    done();
                }, 200)
            });
            const group = new maptalks.GroupGLLayer('group', [], { sceneConfig });
            group.addTo(map);

        });

        it('support skybox with 6 images with urlModifier', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const lights = {
                ambient: {
                    resource: {
                        // url: './resources/venice_sunset_2k.hdr',
                        url: {
                            front: '/resources/skybox_bridge/posx.jpg1',
                            back: '/resources/skybox_bridge/negx.jpg1',
                            right: '/resources/skybox_bridge/posy.jpg1',
                            left: '/resources/skybox_bridge/negy.jpg1',
                            top: '/resources/skybox_bridge/posz.jpg1',
                            bottom: '/resources/skybox_bridge/negz.jpg1'
                        },
                        prefilterCubeSize: 512,
                    },
                    exposure: 1.5,
                    orientation: 0
                },
                directional: {
                    color : [0.1, 0.1, 0.1],
                    direction : [1, 0, -1]
                },
                urlModifier: (url) => {
                    if (url.indexOf('jpg1') > 0) {
                        return url.replaceAll('jpg1', 'jpg');
                    }
                    return url;
                }
            };
            map.setLights(lights);
            map.setPitch(80);
            const sceneConfig = {
                environment: {
                    enable: true,
                    mode: 1,
                    level: 0
                },
                ground: {
                    enable: true,
                    renderPlugin: {
                        type: 'lit'
                    },
                    symbol: {
                        material: {
                            'baseColorFactor': [1, 1, 1, 1],
                            'roughnessFactor': 0.,
                            'metalnessFactor': 1,
                            'outputSRGB': 0,
                            'hsv': [0, 0, 0],
                            'contrast': 1.5
                        },
                        polygonFill: [1, 1, 1, 1],
                        polygonOpacity: 1
                    }
                },
                postProcess: {
                    enable: true,
                }
            };
            map.on('updatelights', () => {
                setTimeout(() => {
                    const canvas = map.getRenderer().canvas;
                    const ctx = canvas.getContext('2d');
                    const data = ctx.getImageData(192, 128, 5, 5);
                    const expected = new Uint8ClampedArray([238,237,205,255,236,235,203,255,234,233,202,255,233,232,200,255,232,231,199,255,238,239,207,255,236,237,205,255,235,236,204,255,234,235,204,255,233,234,203,255,238,241,209,255,236,239,207,255,235,238,207,255,235,238,207,255,235,238,207,255,238,242,211,255,236,241,209,255,236,241,209,255,236,241,210,255,237,241,210,255,235,243,214,255,235,242,213,255,234,242,213,255,235,242,213,255,235,243,213,255]);
                    expect(data.data).to.be.eql(expected);
                    done();
                }, 200)
            });
            const group = new maptalks.GroupGLLayer('group', [], { sceneConfig });
            group.addTo(map);

        });

        it('support skybox with 6 images with negative and positive directions', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const lights = {
                ambient: {
                    resource: {
                        // url: './resources/venice_sunset_2k.hdr',
                        url: {
                            pz: '/resources/skybox_bridge/posx.jpg',
                            nz: '/resources/skybox_bridge/negx.jpg',
                            px: '/resources/skybox_bridge/posy.jpg',
                            nx: '/resources/skybox_bridge/negy.jpg',
                            py: '/resources/skybox_bridge/posz.jpg',
                            ny: '/resources/skybox_bridge/negz.jpg'
                        },
                        prefilterCubeSize: 512,
                    },
                    exposure: 1.5,
                    orientation: 0
                },
                directional: {
                    color : [0.1, 0.1, 0.1],
                    direction : [1, 0, -1]
                }
            };
            map.setLights(lights);
            map.setPitch(80);
            const sceneConfig = {
                environment: {
                    enable: true,
                    mode: 1,
                    level: 0
                },
                ground: {
                    enable: true,
                    renderPlugin: {
                        type: 'lit'
                    },
                    symbol: {
                        material: {
                            'baseColorFactor': [1, 1, 1, 1],
                            'roughnessFactor': 0.,
                            'metalnessFactor': 1,
                            'outputSRGB': 0,
                            'hsv': [0, 0, 0],
                            'contrast': 1.5
                        },
                        polygonFill: [1, 1, 1, 1],
                        polygonOpacity: 1
                    }
                },
                postProcess: {
                    enable: true,
                }
            };
            map.on('updatelights', () => {
                setTimeout(() => {
                    const canvas = map.getRenderer().canvas;
                    const ctx = canvas.getContext('2d');
                    const data = ctx.getImageData(192, 128, 5, 5);
                    const expected = new Uint8ClampedArray([238,237,205,255,236,235,203,255,234,233,202,255,233,232,200,255,232,231,199,255,238,239,207,255,236,237,205,255,235,236,204,255,234,235,204,255,233,234,203,255,238,241,209,255,236,239,207,255,235,238,207,255,235,238,207,255,235,238,207,255,238,242,211,255,236,241,209,255,236,241,209,255,236,241,210,255,237,241,210,255,235,243,214,255,235,242,213,255,234,242,213,255,235,242,213,255,235,243,213,255]);
                    expect(data.data).to.be.eql(expected);
                    done();
                }, 200)
            });
            const group = new maptalks.GroupGLLayer('group', [], { sceneConfig });
            group.addTo(map);

        });
    });


    context('mask', () => {
        it('ClipInsideMask', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
                })
            ];
            const mask = new maptalks.ClipInsideMask(maskCoordinate);
            const terrain = {
                fadeAnimation: false,
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0,
                masks: [mask]
            }
            const group = new maptalks.GroupGLLayer('group', skinLayers, {
                terrain
            });
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    group.once('layerload', () => {
                        const canvas = map.getRenderer().canvas;
                        const ctx = canvas.getContext('2d');
                        const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                        expect(pixel).to.be.eql({ data: { '0': 0, '1': 0, '2': 0, '3': 0 } });
                        done();
                    });
                });
            });
            group.addTo(map);
        });

        it('ClipOutsideMask', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
                })
            ];
            const mask = new maptalks.ClipOutsideMask(maskCoordinate);
            const terrain = {
                fadeAnimation: false,
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0,
                masks: [mask]
            }
            const group = new maptalks.GroupGLLayer('group', skinLayers, {
                terrain
            });
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    group.once('layerload', () => {
                        const canvas = map.getRenderer().canvas;
                        const ctx = canvas.getContext('2d');
                        const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                        expect(pixel).to.be.eql({ data: { '0': 136, '1': 140, '2': 141, '3': 255 } });
                        done();
                    });
                });
            });
            group.addTo(map);
        });

        it('FlatInsideMask', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            map.setPitch(45);
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
                })
            ];
            const mask = new maptalks.FlatInsideMask(maskCoordinate, {
                flatHeight: 500
            });
            const terrain = {
                fadeAnimation: false,
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0,
                masks: [mask]
            }
            const group = new maptalks.GroupGLLayer('group', skinLayers, {
                terrain
            });
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    group.once('layerload', () => {
                        const canvas = map.getRenderer().canvas;
                        const ctx = canvas.getContext('2d');
                        const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                        expect(pixel.data['3']).to.be.eql(255);
                        done();
                    });
                });
            });
            group.addTo(map);
        });

        it('FlatOutsideMask', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            map.setPitch(45);
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
                })
            ];
            const mask = new maptalks.FlatOutsideMask(maskCoordinate, {
                flatHeight: 500
            });
            const terrain = {
                fadeAnimation: false,
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0,
                masks: [mask]
            }
            const group = new maptalks.GroupGLLayer('group', skinLayers, {
                terrain
            });
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    group.once('layerload', () => {
                        const canvas = map.getRenderer().canvas;
                        const ctx = canvas.getContext('2d');
                        const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                        // expect(pixel).to.be.eql({ data: { '0': 163, '1': 161, '2': 144, '3': 255 } });
                        expect(pixel.data['3']).to.be.eql(255);
                        done();
                    });
                });
            });
            group.addTo(map);
        });

        it('ColorMask', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            map.setPitch(20);
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
                })
            ];
            const mask = new maptalks.ColorMask(maskCoordinate, {
                symbol: {
                    polygonFill: '#0f0',
                    polygonOpacity: 0.8
                }
            });
            const terrain = {
                fadeAnimation: false,
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0,
                masks: [mask]
            }
            const group = new maptalks.GroupGLLayer('group', skinLayers, {
                terrain
            });
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    group.once('layerload', () => {
                        const canvas = map.getRenderer().canvas;
                        const ctx = canvas.getContext('2d');
                        const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                        // expect(pixel).to.be.eql({ data: { '0': 26, '1': 229, '2': 24, '3': 255 } });
                        expect(pixel.data['1']).to.be.above(200);
                        expect(pixel.data['3']).to.be.eql(255);
                        done();
                    });
                });
            });
            group.addTo(map);
        });

        it('terrain suppot floodAnalysis', (done) => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            map.setPitch(20);
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
                })
            ];
            const terrain = {
                fadeAnimation: false,
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0
            };
            const boundary = [[90.97311862304686, 29.72796651904297],
                [91.1619461376953, 29.795257778808594],
                [91.35901339843748, 29.666855068847656],
                [91.17567904785155, 29.554245205566406],
                [90.87904818847655, 29.614670010253906]];
            const floodAnalysis = new maptalks.FloodAnalysis({
                // 水淹区域
                boundary,
                waterHeight: 3800,
                waterColor: [0.1, 0.5, 0.9],
                waterOpacity: 0.6
            });
            const group = new maptalks.GroupGLLayer('group', skinLayers, {
                terrain,
                sceneConfig: {
                    postProcess: { enable: true }
                }
            });
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    group.once('layerload', () => {
                        const canvas = map.getRenderer().canvas;
                        const ctx = canvas.getContext('2d');
                        const pixel1 = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                        expect(pixel1).to.be.eql({ data: { '0': 68, '1': 128, '2': 185, '3': 255 } });
                        const pixel2 = ctx.getImageData(canvas.width / 2, canvas.height / 2 + 250, 1, 1);
                        expect(pixel2).to.be.eql({ data: { '0': 125, '1': 115, '2': 95, '3': 255 } });
                        done();
                    });
                });
            });
            group.addTo(map);
            floodAnalysis.addTo(group);
        })
    });
});

function readPixel(canvas, x, y) {
    resultCanvas.width = canvas.width;
    resultCanvas.height = canvas.height;
    const ctx = resultCanvas.getContext('2d');
    ctx.drawImage(canvas, 0, 0);
    return ctx.getImageData(x, y, 1, 1);
}
