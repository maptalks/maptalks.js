let container, map, eventContainer;
const center = new maptalks.Coordinate([0, 0]);
const url1 = 'video/test1.mp4';
const url2 = 'video/test2.mp4';
const coordinates = [[-1, 1, 5], [-1, -1, 5], [1, -1, 5], [1, 1, 5]];
const sceneConfig = {
    shadow : {
        enable : true,
        opacity : 1,
        color : [0, 0, 0]
    },
    postProcess: {
        enable: true,
        outline: {
            enable: true
        }
    }
};
const lights =  {
    ambient: {
        color: [0.08, 0.08, 0.08],
        exposure: 1.5
    },
    directional: {
        color : [0.1, 0.1, 0.1],
        direction : [1, 1, -1],
    }
};
beforeEach(function () {
    container = document.createElement('div');
    container.style.width = '400px';
    container.style.height = '300px';
    document.body.appendChild(container);
    map = new maptalks.Map(container, {
        center,
        zoom: 8,
        lights
    });
});
afterEach(function () {
    map.remove();
    maptalks.DomUtil.removeDomNode(container);
});

function pickPixel(map, x, y, width, height) {
    const px = x || map.width / 2, py = y || map.height / 2;
    const w = width || 1, h = height || 1;
    const canvas = map.getRenderer().canvas;
    const ctx = canvas.getContext('2d');
    const pixel = ctx.getImageData(px, py, w, h).data;
    return pixel;
}

function hasColor(color) {
    if (color[0] || color[1] || color[2] || color[3]) {
        return true;
    }
    return false;
}

describe('maptalks.videolayer', () => {
    it('add videosurface', done => {
        const videoSurface = new maptalks.VideoSurface(coordinates, {
            url: url1
        });
        const videoLayer = new maptalks.VideoLayer('video');
        videoSurface.addTo(videoLayer);
        new maptalks.GroupGLLayer('g', [videoLayer], { sceneConfig }).addTo(map);
        videoSurface.setOpacity(0.6);
        const handle = function () {
            const pixel = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
            if (!hasColor(pixel)) {
                return;
            } else {
                videoSurface.off('playing', handle);
                done();
            }
        };
        videoSurface.on('playing', handle);
    });

    it('remove videosurface', done => {
        const videoSurface = new maptalks.VideoSurface(coordinates, {
            url: url1
        });
        const videoLayer = new maptalks.VideoLayer('video');
        videoSurface.addTo(videoLayer);
        new maptalks.GroupGLLayer('g', [videoLayer], { sceneConfig }).addTo(map);
        const handle = function () {
            const pixel = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
            if (!hasColor(pixel)) {
                return;
            } else {
                videoSurface.off('playing', handle);
                videoSurface.remove();
                setTimeout(function () {
                    const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                    expect(pixel1).to.be.eql([0, 0, 0, 0]);
                    done();
                }, 100);
            }
        };
        videoSurface.on('playing', handle);
    });

    it('add more than one videosurface', done => {
        const videoSurface1 = new maptalks.VideoSurface(coordinates, {
            url: url1
        });
        const videoSurface2 = new maptalks.VideoSurface(coordinates, {
            url: url2
        });
        const videoLayer = new maptalks.VideoLayer('video');
        videoSurface1.addTo(videoLayer);
        videoSurface2.addTo(videoLayer);
        new maptalks.GroupGLLayer('g', [videoLayer], { sceneConfig }).addTo(map);
        const handle = function () {
            const pixel = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
            if (!hasColor(pixel)) {
                return;
            } else {
                videoSurface1.off('playing', handle);
                done();
            }
        };
        videoSurface1.on('playing', handle);
    });

    it('show and hide videosurface', done => {
        const videoSurface = new maptalks.VideoSurface(coordinates, {
            url: url1
        });
        const videoLayer = new maptalks.VideoLayer('video');
        videoSurface.addTo(videoLayer);
        new maptalks.GroupGLLayer('g', [videoLayer], { sceneConfig }).addTo(map);
        const handle = function () {
            const pixel = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
            if (!hasColor(pixel)) {
                return;
            } else {
                videoSurface.off('playing', handle);
                videoSurface.hide();
                setTimeout(function () {
                    const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                    expect(pixel1).to.be.eql([0, 0, 0, 0]);
                    done();
                }, 100);
            }
        };
        videoSurface.on('playing', handle);
    });

    it('clear', done => {
        const videoLayer = new maptalks.VideoLayer('video');
        for (let i = 0; i < 5; i++) {
            const videoSurface = new maptalks.VideoSurface(coordinates, {
                url: url1
            });
            videoSurface.addTo(videoLayer);
        }
        const surfaces = videoLayer.getVideoSurfaces();
        new maptalks.GroupGLLayer('g', [videoLayer], { sceneConfig }).addTo(map);
        const handle = function () {
            const pixel = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
            if (!hasColor(pixel)) {
                return;
            } else {
                surfaces[0].off('playing', handle);
                videoLayer.clear();
                setTimeout(function () {
                    const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                    expect(pixel1).to.be.eql([0, 0, 0, 0]);
                    done();
                }, 100);
            }
        };
        surfaces[0].on('playing', handle);
    });

    it('setVideo', done => {
        const videoSurface = new maptalks.VideoSurface(coordinates, {
            url: url1
        });
        const videoLayer = new maptalks.VideoLayer('video');
        videoSurface.addTo(videoLayer);
        new maptalks.GroupGLLayer('g', [videoLayer], { sceneConfig }).addTo(map);
        const handle = function () {
            const pixel = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
            if (!hasColor(pixel)) {
                return;
            } else {
                videoSurface.off('playing', handle);
                done();
            }
        };
        videoSurface.on('playing', handle);
        videoSurface.setVideo(url2);
    });

    it('edit', (done) => {
        map.setZoom(7);
        eventContainer = map._panels.canvasContainer;
        map.on('click', e => {
            console.log(e.containerPoint);
        });
        const videoSurface = new maptalks.VideoSurface(coordinates, {
            url: url1
        });
        const videoLayer = new maptalks.VideoLayer('video');
        videoSurface.addTo(videoLayer);
        new maptalks.GroupGLLayer('g', [videoLayer], { sceneConfig }).addTo(map);
        videoSurface.startEdit();
        const point = new maptalks.Point([109, 59]);
        happen.mousedown(eventContainer, {
            'clientX': point.x,
            'clientY': point.y
        });
        for (let i = 0; i < 10; i++) {
            happen.mousemove(eventContainer, {
                'clientX':point.x - i,
                'clientY':point.y - i
            });
        }
        happen.mouseup(eventContainer);
        const handle = function () {
            const pixel = pickPixel(map, 105, 55, 1, 1);
            if (!hasColor(pixel)) {
                return;
            } else {
                videoSurface.off('playing', handle);
                done();
            }
        };
        videoSurface.on('playing', handle);
    });

    it('add video by element id', done => {
        const video = document.createElement('video');
        video.src = url1;
        video.autoplay = true;
        video.id = 'myvideo';
        video.style.display = 'none';
        document.body.appendChild(video);
        const videoSurface = new maptalks.VideoSurface(coordinates, {
            elementId: 'myvideo'
        });
        const videoLayer = new maptalks.VideoLayer('video');
        videoSurface.addTo(videoLayer);
        new maptalks.GroupGLLayer('g', [videoLayer], { sceneConfig }).addTo(map);
        videoSurface.setOpacity(0.6);
        const handle = function () {
            const pixel = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
            if (!hasColor(pixel)) {
                return;
            } else {
                videoSurface.off('playing', handle);
                done();
            }
        };
        videoSurface.on('playing', handle);
    });

    it('set doubleside for videolayer', done => {
        const coordinates = [[-1, 1, 5], [1, 1, 5], [1, -1, 5], [-1, -1, 5]];
        const videoSurface = new maptalks.VideoSurface(coordinates, {
            url: url1
        });
        const videoLayer = new maptalks.VideoLayer('video', {
            doubleSide: false
        });
        videoSurface.addTo(videoLayer);
        new maptalks.GroupGLLayer('g', [videoLayer], { sceneConfig }).addTo(map);
        videoSurface.setOpacity(0.6);
        const handle = function () {
            const pixel = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
            if (!hasColor(pixel)) {
                done();
            }
        };
        videoSurface.on('playing', handle);
    });

    it('no video resource', done => {
        const videoSurface = new maptalks.VideoSurface(coordinates, {
            url: './error.mp4' //this url has no video resource
        });
        const videoLayer = new maptalks.VideoLayer('video');
        videoSurface.addTo(videoLayer);
        new maptalks.GroupGLLayer('g', [videoLayer], { sceneConfig }).addTo(map);
        videoSurface.setOpacity(0.6);
        const handle = function () {
            done();
        };
        videoSurface.on('error', handle);
    });
});
