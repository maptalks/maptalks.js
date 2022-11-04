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
            zoom: 12
        });
    });

    afterEach(() => {
        map.remove();
        document.body.removeChild(container);
    });
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
        weather: {
            enable: true,
            fog: {
              enable: true,
              start: 0.1,
              end: 45,
              color: [0.9, 0.9, 0.9],
            }
        }
    };

    it('enable fog', done => {
        const url = "models/Duck/Duck.glb";
        const gltfLayer = new maptalks.GLTFLayer("gltf");
        const position = map.getCenter();
        const gltfMarker = new maptalks.GLTFMarker(position, {
            symbol: {
                url: url,
                shadow: true
            }
        });
        gltfMarker.once('load', () => {
            setTimeout(function() {
                const canvas = map.getRenderer().canvas;
                const ctx = canvas.getContext("2d");
                const pixel = ctx.getImageData(map.width / 2, map.height / 2, 1, 1).data;
                expect(Array.from(pixel)).to.be.eql([248, 228, 96, 255]);
                done();
            }, 100);
        });
        gltfLayer.addGeometry(gltfMarker);
        new maptalks.GroupGLLayer("gl", [gltfLayer], {
            sceneConfig
        }).addTo(map);
    });

    it('enable snow', done => {
        const snow = {
            enable: true
        };
        delete sceneConfig.weather.rain;
        sceneConfig.weather.snow = snow;
        const url = "models/Duck/Duck.glb";
        const gltfLayer = new maptalks.GLTFLayer("gltf");
        const position = map.getCenter();
        const gltfMarker = new maptalks.GLTFMarker(position, {
            symbol: {
                url: url,
                shadow: true
            }
        });
        gltfMarker.once('load', () => {
            setTimeout(function() {
                const canvas = map.getRenderer().canvas;
                const ctx = canvas.getContext("2d");
                const pixel = ctx.getImageData(map.width / 2, map.height / 2, 1, 1).data;
                expect(Array.from(pixel)).to.be.eql([248, 246, 236, 255]);
                done();
            }, 100);
        });
        gltfLayer.addGeometry(gltfMarker);
        new maptalks.GroupGLLayer("gl", [gltfLayer], {
            sceneConfig
        }).addTo(map);
    });

    it('enable rain', done => {
        const rain = {
            enable: true,
            density: 2000,
            windDirectionX: 0,
            windDirectionY: 0,
            rainTexture: 'resources/rain.png',
        };
        delete sceneConfig.weather.snow;
        sceneConfig.weather.rain = rain;
        const url = "models/Duck/Duck.glb";
        const gltfLayer = new maptalks.GLTFLayer("gltf");
        const position = map.getCenter();
        const gltfMarker = new maptalks.GLTFMarker(position, {
            symbol: {
                url: url,
                shadow: true
            }
        });
        gltfMarker.once('load', () => {
            setTimeout(function() {
                const canvas = map.getRenderer().canvas;
                const ctx = canvas.getContext("2d");
                const pixel = ctx.getImageData(map.width / 2, map.height / 2, 1, 1).data;
                expect(Array.from(pixel)).to.be.eql([248, 228, 96, 255]);
                done();
            }, 100);
        });
        gltfLayer.addGeometry(gltfMarker);
        new maptalks.GroupGLLayer("gl", [gltfLayer], {
            sceneConfig
        }).addTo(map);
    });
});
