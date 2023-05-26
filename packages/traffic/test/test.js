/* eslint-disable no-undef */
describe('traffic', () => {
    let map;
    function createMap() {
        const container = document.createElement('div');
        container.style.width = '400px';
        container.style.height = '300px';
        container.style.backgroundColor = '#000';
        document.body.appendChild(container);
        const map = new maptalks.Map(container, {
            center: [0, 0],
            zoom: 17
        });
        return map;
    }

    function pickPixel(map, x, y, width, height) {
        const px = x || map.width / 2, py = y || map.height / 2;
        const w = width || 1, h = height || 1;
        const canvas = map.getRenderer().canvas;
        const ctx = canvas.getContext("2d");
        const pixel = ctx.getImageData(px, py, w, h).data;
        return pixel;
    }

    function pixelMatch(expectedValue, pixelValue, diff) {
        for (let i = 0; i < expectedValue.length; i++) {
            if (Math.abs(pixelValue[i] - expectedValue[i]) > diff) {
                return false;
            }
        }
        return true;
    }

    beforeEach(function() {
        map = createMap();
    });

    afterEach(function() {
        map.remove();
        document.body.innerHTML = '';
    });

    const symbols = [
        {
            url: 'cube',
            scaleX: 8,
            scaleY: 8,
            scaleZ: 8,
            shadow: true
        },
        {
            url: 'cube',
            scaleX: 8,
            scaleY: 8,
            scaleZ: 8,
            shadow: true
        }
    ];
    const lines = [
        [
            [-1, 0], [0, 0], [1, 0]
        ],
        [
            [0, 1], [0, 0], [0, -1]
        ]
    ];
    it('add traffic to map', done => {
        const groupgllayer = new maptalks.GroupGLLayer('gl', []).addTo(map);
        const scene = new maptalks.TrafficScene();
        scene.addTo(groupgllayer);
        scene.generateTraffic(lines);
        scene.setSymbols(symbols);
        scene.carsNumber = 50;
        scene.run();
        setTimeout(function() {
            scene.stop();
            const pixel = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
            expect(pixelMatch([160, 160, 160, 130], pixel, 50));
            done();
        }, 500);
    });

    it('update cars number', done => {
        const groupgllayer = new maptalks.GroupGLLayer('gl', []).addTo(map);
        const scene = new maptalks.TrafficScene();
        scene.addTo(groupgllayer);
        scene.generateTraffic(lines);
        scene.setSymbols(symbols);
        scene.carsNumber = 50;
        scene.run();
        function checkColor() {
            setTimeout(function() {
                scene.stop();
                const pixel = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([150, 150, 150, 120], pixel, 50));
                done();
            }, 500);
        }
        setTimeout(function() {
            scene.carsNumber = 100;
            checkColor();
        }, 100);
    })

    it('run、stop、remove', done => {
        const groupgllayer = new maptalks.GroupGLLayer('gl', []).addTo(map);
        const scene = new maptalks.TrafficScene();
        scene.addTo(groupgllayer);
        scene.generateTraffic(lines);
        scene.setSymbols(symbols);
        scene.carsNumber = 50;
        scene.run();
        scene.stop();
        setTimeout(function() {
            scene.remove();
            done();
        }, 100);
    });
});
