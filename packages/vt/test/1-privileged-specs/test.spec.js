const assert = require('assert');
const maptalks = require('maptalks');

const {
    PolygonLayer
} = require('../../dist/maptalks.vt.js');

const DEFAULT_VIEW = {
    center: [0, 0],
    zoom: 6,
    pitch: 0,
    bearing: 0,
    devicePixelRatio: 1
};

describe('priviledged specs', () => {
    let map, container;
    before(() => {
        container = document.createElement('div');
        container.style.width = '128px';
        container.style.height = '128px';
        document.body.appendChild(container);
    });
    afterEach(() => {
        map.remove();
    });

    it('should can setZIndex and identify, maptalks/maptalks.js#1685', done => {
        map = new maptalks.Map(container, DEFAULT_VIEW);
        let clicked = 0;
        let finished = false;
        const polygons =[];
        function click(e) {
            clicked++;
            if (clicked === 1) {
                const id = e.target.getId();
                assert(id === '2');
                polygons[1].setZIndex(500);
            } else if (!finished && e.target.getId() === '1') {
                finished = true;
                done();
            }
            map.getRenderer().setToRedraw();
        }
        const layer = new PolygonLayer('gvt');
        const gap = 0.3;
        const colors = ['#f00', '#0f0', '#00f'];
        for (let i = 0; i < 3; i++) {
            const polygon = new maptalks.Polygon([
              [
                [0 + i * gap, 0 + i * gap],
                [4 + i * gap, 0 + i * gap],
                [4 + i * gap, 4 + i * gap],
                [0 + i * gap, 0 + i * gap]
              ]
            ], {
              id: i + '',
              symbol: {
                polygonFill: colors[i],
                polygonOpacity: 0.5
              }
            });
            polygon.on('mousedown', click);
            polygons.push(polygon);
        }

        layer.addGeometry(polygons);
        layer.on('canvasisdirty', () => {
            if (!finished) {
                const point = {
                    type: 'mousedown',
                    clientX: map.width / 2 + 50,
                    clientY: map.height / 2 - 20
                }
                const handlers = map._handlers;
                for (let i = 0; i < handlers.length; i++) {
                    if (handlers[i]._identifyGeometryEvents) {
                        handlers[i]._identifyGeometryEvents(point, 'mousedown');
                        break;
                    }
                }
            }
        });
        layer.addTo(map);
    });
});
