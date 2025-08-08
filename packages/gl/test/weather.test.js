describe('weather tests', () => {
    let container, map;
    beforeEach(() => {
        container = document.createElement('div');
        const width = 512, height = 512;
        container.style.width = width + 'px';
        container.style.height = height + 'px';
        container.style.backgroundColor = 'black';
        document.body.appendChild(container);
        map = new maptalks.Map(container, {
            center: [0, 0],
            pitch: 70,
            zoom: 12,
            devicePixelRatio: 1
        });
    });

    afterEach(() => {
        map.remove();
        document.body.removeChild(container);
    });

    function pickPixel(map, x, y, width, height) {
        const px = x || map.width / 2, py = y || map.height / 2;
        const w = width || 1, h = height || 1;
        const canvas = map.getRenderer().canvas;
        const ctx = canvas.getContext("2d");
        const pixel = ctx.getImageData(px, py, w, h).data;
        return pixel;
    }

    function pixelMatch(expectedValue, pixelValue, diff) {
        const diffValue = diff || 5;
        for (let i = 0; i < expectedValue.length; i++) {
            if (Math.abs(pixelValue[i] - expectedValue[i]) > diffValue) {
                return false;
            }
        }
        return true;
    }

    function hasColor(color) {
        if (color[0] || color[1] || color[2] || color[3]) {
            return true;
        }
        return false;
    }
    const sceneConfig = {
        environment: {
            enable: true,
            mode: 1,
            level: 1,
            brightness: 1
        },
        postProcess: {
            enable: true,
            antialias: {
                enable: true
            }
        },
        ground: {
            enable: true,
            renderPlugin: {
                type: "fill"
            },
            symbol: {
                polygonFill: [
                    0.3,
                    0.3,
                    0.3,
                    1.0,
                ],
                polygonOpacity: 0.8,
            }
        },
        weather: {
            enable: true,
            fog: {
                enable: true,
                start: 0.1,
                end: 45,
                color: [0.9, 0.9, 0.9]
            }
        }
    };

    it('enable and disable fog', done => {
        const url = "models/Duck/Duck.glb";
        const gltfLayer = new maptalks.GLTFLayer("gltf");
        const position = map.getCenter();
        const gltfMarker = new maptalks.GLTFMarker(position.add(0, 0.1), {
            symbol: {
                url: url,
                scaleX: 400,
                scaleY: 400,
                scaleZ: 400,
                shadow: true
            }
        });
        gltfMarker.once('load', () => {
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                const pixel2 = pickPixel(map, map.width / 2, 170 , 1, 1);
                expect(pixelMatch([169, 169, 169, 163], pixel1)).to.be.eql(true);
                expect(pixelMatch([236, 216, 117, 255], pixel2)).to.be.eql(true);
                disableFog();
            }, 100);
        });
        gltfLayer.addGeometry(gltfMarker);
        const gllayer = new maptalks.GroupGLLayer("gl", [gltfLayer], {
            sceneConfig
        }).addTo(map);
        function disableFog() {
            const sceneConfig = gllayer.getSceneConfig();
            const config = JSON.parse(JSON.stringify(sceneConfig));
            config.weather.fog.enable = false;
            gllayer.setSceneConfig(config);
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                const pixel2 = pickPixel(map, map.width / 2, 170 , 1, 1);
                expect(pixelMatch([77, 77, 77, 163], pixel1)).to.be.eql(true);
                expect(pixelMatch([242, 206, 27, 255], pixel2)).to.be.eql(true);
                done();
            }, 100);
        }
    });

    it.skip('enable snow', done => {
        const snow = {
            enable: true
        };
        const newSceneConfig = JSON.parse(JSON.stringify(sceneConfig));
        newSceneConfig.weather.snow = snow;
        const url = "models/Duck/Duck.glb";
        const gltfLayer = new maptalks.GLTFLayer("gltf");
        const position = map.getCenter();
        const gltfMarker = new maptalks.GLTFMarker(position.add(0, 0.1), {
            symbol: {
                url: url,
                shadow: true,
                scaleX: 400,
                scaleY: 400,
                scaleZ: 400
            }
        });
        const groupgllayer = new maptalks.GroupGLLayer("gl", [gltfLayer], {
            sceneConfig: newSceneConfig
        }).addTo(map);
        gltfMarker.once('load', () => {
            newSceneConfig.weather.playing = false;
            groupgllayer.setSceneConfig(newSceneConfig);
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                const pixel2 = pickPixel(map, map.width / 2, 137, 1, 1);
                expect(pixelMatch([161, 161, 161, 255], pixel1)).to.be.eql(true);
                expect(pixelMatch([186, 186, 186, 255], pixel2)).to.be.eql(true);
                done();
            }, 200);
        });
        gltfLayer.addGeometry(gltfMarker);
    });

    it('enable rain', done => {
        const rain = {
            enable: true,
            density: 2000,
            windDirectionX: 0,
            windDirectionY: 0,
            rainTexture: 'resources/rain.png',
        };
        const newSceneConfig = JSON.parse(JSON.stringify(sceneConfig));
        newSceneConfig.weather.rain = rain;
        const url = "models/Duck/Duck.glb";
        const gltfLayer = new maptalks.GLTFLayer("gltf");
        const position = map.getCenter();
        const gltfMarker = new maptalks.GLTFMarker(position.add(0, 0.1), {
            symbol: {
                url: url,
                shadow: true,
                scaleX: 400,
                scaleY: 400,
                scaleZ: 400
            }
        });
        gltfMarker.once('load', () => {
            newSceneConfig.weather.playing = false;
            groupgllayer.setSceneConfig(newSceneConfig);
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                const pixel2 = pickPixel(map, map.width / 2, 150, 1, 1);
                const pixel3 = pickPixel(map, 204, 417, 1, 1);
                expect(pixelMatch([121, 121, 121, 200], pixel1, 50)).to.be.eql(true);
                expect(pixelMatch([175, 175, 175, 200], pixel2, 50)).to.be.eql(true);//模型颜色
                expect(pixelMatch([92, 92, 92, 200], pixel3, 50)).to.be.eql(true);//涟漪颜色
                done();
            }, 100);
        });
        gltfLayer.addGeometry(gltfMarker);
        const groupgllayer = new maptalks.GroupGLLayer("gl", [gltfLayer], {
            sceneConfig: newSceneConfig
        }).addTo(map);
    });

    it('resize map', done => {
        const snow = {
            enable: true
        };
        const newSceneConfig = JSON.parse(JSON.stringify(sceneConfig));
        newSceneConfig.weather.snow = snow;
        newSceneConfig.ground.enable = false;
        const url = "models/Duck/Duck.glb";
        const gltfLayer = new maptalks.GLTFLayer("gltf");
        const position = map.getCenter();
        const gltfMarker = new maptalks.GLTFGeometry(position.add(0, 0.1), {
            symbol: {
                url: url,
                shadow: true,
                scaleX: 400,
                scaleY: 400,
                scaleZ: 400
            }
        });
        new maptalks.GroupGLLayer("gl", [gltfLayer], {
            sceneConfig: newSceneConfig
        }).addTo(map);
        gltfMarker.once('load', () => {
            container.style.width = 600 + 'px';
            container.style.height = 600 + 'px';
            setTimeout(function() {
                const pixel = pickPixel(map, 550, 550, 1, 1);
                expect(hasColor(pixel));
                done();
            }, 100);
        });
        gltfLayer.addGeometry(gltfMarker);
    });

    it('update weather', done => {
        const rain = {
            enable: true,
            density: 2000,
            windDirectionX: 0,
            windDirectionY: 0,
            rainTexture: 'resources/rain.png',
        };
        const newSceneConfig = JSON.parse(JSON.stringify(sceneConfig));
        newSceneConfig.weather.rain = rain;
        const url = "models/Duck/Duck.glb";
        const gltfLayer = new maptalks.GLTFLayer("gltf");
        const position = map.getCenter();
        const gltfMarker = new maptalks.GLTFGeometry(position, {
            symbol: {
                url: url,
                shadow: true,
                scaleX: 400,
                scaleY: 400,
                scaleZ: 400
            }
        });
        gltfMarker.once('load', () => {
            newSceneConfig.weather.playing = false;
            newSceneConfig.weather.rain.density = 5000;
            newSceneConfig.weather.rain.speed = 2;
            newSceneConfig.weather.rain.windDirectionX = 30;
            newSceneConfig.weather.rain.windDirectionY = 30;
            newSceneConfig.weather.rain.rainTexture = 'resources/newRain.png';
            groupgllayer.setSceneConfig(newSceneConfig);
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                const pixel2 = pickPixel(map, map.width / 2, 150, 1, 1);
                const pixel3 = pickPixel(map, 204, 417, 1, 1);
                expect(pixelMatch([121, 121, 121, 200], pixel1, 50)).to.be.eql(true);
                expect(pixelMatch([175, 175, 175, 200], pixel2, 50)).to.be.eql(true);//模型颜色
                expect(pixelMatch([92, 92, 92, 200], pixel3, 50)).to.be.eql(true);//涟漪颜色
                done();
            }, 100);
        });
        gltfLayer.addGeometry(gltfMarker);
        const groupgllayer = new maptalks.GroupGLLayer("gl", [gltfLayer], {
            sceneConfig: newSceneConfig
        }).addTo(map);
    });

    it('update snow intensity', done => {
        const snow = {
            enable: true
        };
        const newSceneConfig = JSON.parse(JSON.stringify(sceneConfig));
        newSceneConfig.weather.snow = snow;
        newSceneConfig.ground.enable = false;
        const url = "models/Duck/Duck.glb";
        const gltfLayer = new maptalks.GLTFLayer("gltf");
        const position = map.getCenter();
        const gltfMarker = new maptalks.GLTFGeometry(position.add(0, 0.1), {
            symbol: {
                url: url,
                shadow: true,
                scaleX: 400,
                scaleY: 400,
                scaleZ: 400
            }
        });
        const groupgllayer = new maptalks.GroupGLLayer("gl", [gltfLayer], {
            sceneConfig: newSceneConfig
        }).addTo(map);

        function updateSnowIntensity() {
            newSceneConfig.weather.snow.snowIntensity = 0.8;
            groupgllayer.setSceneConfig(newSceneConfig);
            setTimeout(function() {
                const pixel = pickPixel(map, 550, 550, 1, 1);
                expect(hasColor(pixel));
                done();
            }, 100);
        }
        gltfMarker.once('load', () => {
            setTimeout(function() {
                const pixel = pickPixel(map, 550, 550, 1, 1);
                expect(hasColor(pixel));
                updateSnowIntensity();
            }, 100);
        });
        gltfLayer.addGeometry(gltfMarker);
    });
});
