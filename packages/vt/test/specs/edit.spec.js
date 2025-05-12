const assert = require('assert');
const { readPixel } = require('../common/Util');
const maptalks = require('maptalks');
const { PolygonLayer } = require('../../dist/maptalks.vt.js');
const happen = require('happen');

const DEFAULT_VIEW = {
    center: [(121.111 + 122.222) / 2, (30.111 + 30.333) / 2],
    zoom: 17,
    pitch: 0,
    bearing: 0,
    attribution: false,
    devicePixelRatio: 1,
    lights: {
        ambient: {
            color: [0.1, 0.1, 0.1]
        },
        directional: {
            color: [0.1, 0.1, 0.1],
            direction: [1, 0, -1],
        }
    }
};

function GET_PAGE_POSITION(obj) {
    const docEl = document.documentElement;
    const rect = obj.getBoundingClientRect();
    return new maptalks.Point(rect['left'] + docEl['scrollLeft'], rect['top'] + docEl['scrollTop']);
}

describe('edit specs', () => {
    let container, eventContainer, map;
    before(() => {
        container = document.createElement('div');
        container.style.width = '128px';
        container.style.height = '128px';
        document.body.appendChild(container);
    });

    beforeEach(() => {
        map = new maptalks.Map(container, DEFAULT_VIEW);
        eventContainer = map._panels.canvasContainer;
    });

    afterEach(() => {
        map.remove();
    });

    function dragGeometry(geometry, offset) {
        const domPosition = GET_PAGE_POSITION(container);
        const point = map.coordinateToContainerPoint(geometry.getCenter()).add(domPosition);
        if (offset) {
            point._add(offset);
        }
        happen.mousedown(eventContainer, {
            'clientX': point.x,
            'clientY': point.y
        });
        for (let i = 0; i < 10; i++) {
            happen.mousemove(document, {
                'clientX': point.x + i,
                'clientY': point.y + i
            });
        }
        happen.mouseup(document);
    }

    const polygonShell = [
        [
            { x: 121.111, y: 30.111 },
            { x: 122.222, y: 30.111 },
            { x: 122.222, y: 30.333 },
            { x: 121.111, y: 30.333 }
        ]
    ];

    it('can only edit marker on a map', function () {
        var marker = new maptalks.Marker(map.getCenter());
        marker.startEdit();
        assert(!marker.isEditing());
    });

    it('should can drag polygon', done => {
        const polygon = new maptalks.Polygon(polygonShell, {
            symbol: {
                polygonFill: '#f00',
                lineWidth: 2,
                lineColor: '#000'
            }
        });
        const renderer = map.getRenderer();

        const polygonLayer = new PolygonLayer('polygons', [polygon]);
        const center = polygon.getCenter();
        polygonLayer.once('canvasisdirty', () => {

            polygon.startEdit();
            dragGeometry(polygon);
        });
        polygonLayer.once('updatemesh', () => {
            renderer.callInNextFrame(() => {
                const newCenter = polygon.getCenter();
                assert(newCenter.x !== center.x);
                assert(newCenter.y !== center.y);
                const pixel = readPixel(renderer.canvas, renderer.canvas.width / 2 + 20, renderer.canvas.height / 2);
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                done();
            });
        });
        polygonLayer.addTo(map);
    });

    it('should can drag MultiPolygon, maptalks/issues#230', done => {
        const polygon = new maptalks.MultiPolygon([polygonShell], {
            symbol: {
                polygonFill: '#f00',
                lineWidth: 2,
                lineColor: '#000'
            }
        });
        const renderer = map.getRenderer();

        const polygonLayer = new PolygonLayer('polygons', [polygon]);
        const center = polygon.getCenter();
        polygonLayer.once('canvasisdirty', () => {

            polygon.startEdit();
            dragGeometry(polygon);
        });
        polygonLayer.once('updatemesh', () => {
            renderer.callInNextFrame(() => {
                const newCenter = polygon.getCenter();
                assert(newCenter.x !== center.x);
                assert(newCenter.y !== center.y);
                const pixel = readPixel(renderer.canvas, renderer.canvas.width / 2 + 20, renderer.canvas.height / 2);
                assert.deepEqual(pixel, [255, 0, 0, 255]);
                done();
            });
        });
        polygonLayer.addTo(map);
    });
});
