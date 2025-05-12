const assert = require('assert');
const { readPixel } = require('../common/Util');
const maptalks = require('maptalks');
const { PointLayer } = require('../../dist/maptalks.vt.js');
const { GroupGLLayer } = require('@maptalks/gl');
const happen = require('happen');

function GET_PAGE_POSITION(obj) {
    const docEl = document.documentElement;
    const rect = obj.getBoundingClientRect();
    return new maptalks.Point(rect['left'] + docEl['scrollLeft'], rect['top'] + docEl['scrollTop']);
}

const DEFAULT_VIEW = {
    center: [0, 0],
    zoom: 6,
    pitch: 0,
    bearing: 0,
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


describe('vector layers event specs', () => {
    let container, map, eventContainer;
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


    function fireGeometry(geometry, type, offset) {
        const domPosition = GET_PAGE_POSITION(container);
        const point = map.coordinateToContainerPoint(geometry.getCenter()).add(domPosition);
        if (offset) {
            point._add(offset);
        }
        happen[type](eventContainer, {
            'clientX': point.x,
            'clientY': point.y
        });
    }

    it('should can update geometry symbol on events, maptalks/issues#311', done => {
        const center = map.getCenter();
        const pointLayer = new PointLayer("point");
        const coordinates = [center.add(1, 0), center];
        const markers = [];
        for (let i = 0; i < coordinates.length; i++) {
            markers[i] = new maptalks.Marker(coordinates[i], {
                id: '' + i,
                symbol: [{
                    textName: `${i}`,
                    textSize: 18,
                    textFill: "#ddd",
                    textDy: -14,
                    textDx: 1
                },{
                    markerPerspectiveRatio: 0,
                    markerType: "ellipse",
                    markerFill: "#000",
                    markerFillOpacity: 1,
                    markerLineColor: "#ddd",
                    markerLineWidth: 2,
                    markerWidth: 25,
                    markerHeight: 25,
                }]
            }).addTo(pointLayer).on('mousedown mouseup', e => {
                if (e.type === 'mousedown') {
                    e.target.updateSymbol([{
                        textFill: '#f00'
                    },{
                        markerFill: '#f00'
                    }]);
                } else if (e.type === 'mouseup') {
                    e.target.updateSymbol([{
                        textFill: '#ddd'
                    },{
                    markerFill: '#ddd'
                    }]);
                }
                if (e.type === 'mouseup' && e.target.getId() === '1') {
                    done();
                }
            });
        }

        const groupLayer = new GroupGLLayer("group", [pointLayer]);
        groupLayer.addTo(map);
        const x = map.width;
        const y = map.height;

        setTimeout(() => {
            fireGeometry(markers[0], 'mousedown');
            setTimeout(() => {
                fireGeometry(markers[0], 'mouseup');
                setTimeout(() => {
                    fireGeometry(markers[1], 'mousedown');
                    setTimeout(() => {
                        const pixel = readPixel(groupLayer.getRenderer().canvas, x / 2, y / 2 - 4);
                        //开始`是红色
                        assert.deepEqual(pixel, [255, 0, 0, 255]);
                        fireGeometry(markers[1], 'mouseup');
                    }, 100);
                }, 100);
            }, 100);

        }, 100);
    });
});
