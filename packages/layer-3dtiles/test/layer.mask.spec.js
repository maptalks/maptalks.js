const maptalks = require('maptalks');
const { GroupGLLayer, FlatInsideMask, FlatOutsideMask, ClipInsideMask, ClipOutsideMask, ColorMask, VideoMask } = require('@maptalks/gl');
require('@maptalks/transcoders.draco');
require('@maptalks/transcoders.ktx2');
require('@maptalks/transcoders.crn');
const assert = require('assert');
const { Geo3DTilesLayer } = require('../dist/maptalks.3dtiles');
const startServer = require('./server.js');

const PORT = 39887;

function pickPixel(map, x, y, width, height) {
    const px = x || map.width / 2, py = y || map.height / 2;
    const w = width || 1, h = height || 1;
    const canvas = map.getRenderer().canvas;
    const ctx = canvas.getContext("2d");
    const pixel = ctx.getImageData(px, py, w, h).data;
    return pixel;
}

function pixelMatch(expectedValue, pixelValue, diff) {
    const diffValue = diff || 10;
    for (let i = 0; i < expectedValue.length; i++) {
        if (Math.abs(pixelValue[i] - expectedValue[i]) > diffValue) {
            return false;
        }
    }
    return true;
}
describe('render specs', () => {
    let server;
    before(done => {
        server = startServer(PORT, done);
    });

    after(() => {
        server.close();
    });

    let container, map;

    function createMap(center) {
        const option = {
            zoom: 20,
            center: center || [0, 0],
            // centerCross: true
        };
        map = new maptalks.Map(container, option);
    }

    function add3DTilesLayer(mask) {
        const resPath = 'BatchedDraco/dayanta/';
        const layer = new Geo3DTilesLayer('3d-tiles', {
            services : [
                {
                    url : `http://localhost:${PORT}/integration/fixtures/${resPath}/tileset.json`,
                    shader: 'phong',
                    heightOffset: -420
                }
            ]
        });
        if (mask) {
            layer.setMask(mask);
        }
        const group = new GroupGLLayer('group', [layer]);
        group.addTo(map);
        return layer;
    }

    beforeEach(() => {
        container = document.createElement('div');
        container.style.width = '800px';
        container.style.height = '600px';
        container.style.backgroundColor = '#000';
        document.body.appendChild(container);
        createMap();
    });

    afterEach(() => {
        map.remove();
        document.body.innerHTML = '';
    });

    const coordinates = [
        [108.95766345013931, 34.21798221243907],
        [108.95766927615637, 34.21766446103831],
        [108.95802151065914, 34.217669278472016],
        [108.95802191505629, 34.21794493851476]
    ];
    const symbol = {
        polygonFill: "#f00",
        polygonOpacity: 0.8
    };

    it('flat inside mask', done => {
        const layer = add3DTilesLayer();
        layer.once('loadtileset', () => {
            const extent = layer.getExtent(0);
            map.fitExtent(extent, 0, { animation: false });
            const mask = new FlatInsideMask(coordinates, {
                symbol,
                flatHeight: 0
            });
            layer.setMask(mask);
            setTimeout(function() {
                const pixel = pickPixel(map, 255, 497, 1, 1);
                assert(pixelMatch([104, 107, 114, 255], pixel) === true);
                done();
            }, 500);
        });
    }).timeout(10000);

    it('flat outside mask', done => {
        const layer = add3DTilesLayer();
        layer.once('loadtileset', () => {
            const extent = layer.getExtent(0);
            map.fitExtent(extent, 0, { animation: false });
            const mask = new FlatOutsideMask(coordinates, {
                symbol,
                flatHeight: 0
            });
            layer.setMask(mask);
            setTimeout(function() {
                const pixel = pickPixel(map, 255, 497, 1, 1);
                assert(pixelMatch([171, 175, 177, 255], pixel) === true);
                done();
            }, 200);
        });
    }).timeout(10000);

    it('clip inside mask', done => {
        const layer = add3DTilesLayer();
        layer.once('loadtileset', () => {
            const extent = layer.getExtent(0);
            map.fitExtent(extent, 0, { animation: false });
            const mask = new ClipInsideMask(coordinates, {
                symbol
            });
            layer.setMask(mask);
            setTimeout(function() {
                const pixel = pickPixel(map, 255, 497, 1, 1);
                assert(pixelMatch([0, 0, 0, 0], pixel) === true);
                done();
            }, 200);
        });
    }).timeout(10000);

    it('clip outside mask', done => {
        const layer = add3DTilesLayer();
        layer.once('loadtileset', () => {
            const extent = layer.getExtent(0);
            map.fitExtent(extent, 0, { animation: false });
            setTimeout(function() {
                const mask = new ClipOutsideMask(coordinates, {
                    symbol
                });
                layer.setMask(mask);
                const pixel = pickPixel(map, 255, 497, 1, 1);
                assert(pixelMatch([171, 174, 178, 255], pixel) === true);
                done();
            }, 200);
        });
    }).timeout(10000);


    it('color mask', done => {
        const layer = add3DTilesLayer();
        layer.once('loadtileset', () => {
            const extent = layer.getExtent(0);
            map.fitExtent(extent, 0, { animation: false });
            const mask = new ColorMask(coordinates, {
                symbol
            });
            layer.setMask(mask);
            setTimeout(function() {
                const pixel = pickPixel(map, 255, 497, 1, 1);
                assert(pixelMatch([238, 35, 35, 255], pixel) === true);
                done();
            }, 300);
        });
    }).timeout(10000);

    it('video mask', done => {
        const layer = add3DTilesLayer();
        layer.once('loadtileset', () => {
            const extent = layer.getExtent(0);
            map.fitExtent(extent, 0, { animation: false });
            const mask = new VideoMask(coordinates, {
                symbol,
                url: `http://localhost:${PORT}/resources/video.mp4`
            });
            layer.setMask(mask);
            setTimeout(function() {
                const pixel = pickPixel(map, 255, 497, 1, 1);
                assert(pixelMatch([53, 63, 81, 255], pixel, 50) === true);
                done();
            }, 1200);
        });
    }).timeout(10000);

    it('setServiceOpacity', done => {
        const layer = add3DTilesLayer();
        layer.once('loadtileset', () => {
            const extent = layer.getExtent(0);
            map.fitExtent(extent, 0, { animation: false });
            layer.setServiceOpacity(0, 0.5);
            setTimeout(function() {
                const pixel = pickPixel(map, 255, 497, 1, 1);
                assert(pixelMatch([255, 255, 255, 127], pixel) === true);
                done();
            }, 200);
        });
    }).timeout(10000);

    it('add mask with large extent', done => {
        const layer = add3DTilesLayer();
        layer.once('loadtileset', () => {
            const extent = layer.getExtent(0);
            map.fitExtent(extent, 0, { animation: false });
            const coordinates = [[73.345664,16.529296],[71.288347,54.288208],[139.066887,55.158173],[141.246746,15.542349]];
            const mask = new ColorMask(coordinates, {
                symbol
            });
            layer.setMask(mask);
            setTimeout(function() {
                const pixel = pickPixel(map, 255, 497, 1, 1);
                assert(pixelMatch([238, 35, 35, 255], pixel) === true);
                done();
            }, 200);
        });
    }).timeout(10000);

    it('set mask before layer added to map', done => {
        const mask = new ColorMask(coordinates, {
            symbol
        });
        const layer = add3DTilesLayer(mask);
        layer.once('loadtileset', () => {
            const extent = layer.getExtent(0);
            map.fitExtent(extent, 0, { animation: false });
            setTimeout(function() {
                const pixel = pickPixel(map, 255, 497, 1, 1);
                assert(pixelMatch([238, 35, 35, 255], pixel) === true);
                done();
            }, 300);
        });
    }).timeout(10000);

    it('add mask which is not in map extent', done => {
        const layer = add3DTilesLayer();
        layer.once('loadtileset', () => {
            const extent = layer.getExtent(0);
            map.fitExtent(extent, 0, { animation: false });
            const coordinates = [[-1, 1],[1, 1],[1, -1],[-1, -1]];
            const mask = new ColorMask(coordinates, {
                symbol
            });
            layer.setMask(mask);
            setTimeout(function() {
                const pixel = pickPixel(map, 255, 497, 1, 1);
                assert(pixelMatch([171, 175, 177, 255], pixel) === true);
                done();
            }, 500);
        });
    }).timeout(10000);
});
