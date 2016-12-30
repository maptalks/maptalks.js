import {
    commonSetupMap,
    removeContainer
} from '../SpecCommon';
import Coordinate from 'geo/Coordinate';
import {
    UIMarker
} from 'ui';

describe('#UIMarker', function () {
    var container;
    var map;
    var center = new Coordinate(118.846825, 32.046534);
    var layer;
    var context = {};

    beforeEach(function () {
        var setups = commonSetupMap(center);
        container = setups.container;
        map = setups.map;
        context.map = map;
    });

    afterEach(function () {
        map.removeLayer(layer);
        removeContainer(container);
    });

    it('add', function () {
        var marker = new UIMarker(map.getCenter(), {
            content: '<div id="uimarker">marker</div>'
        });
        marker.addTo(map).show();
        var m = document.getElementById('uimarker');
        expect(m).to.be.ok();
        expect(m.clientHeight).to.be.above(0);
        expect(m.clientWidth).to.be.above(0);
    });

    it('add2', function () {
        var dom = document.createElement('div');
        dom.id = 'uimarker';
        dom.innerHTML = 'marker';
        var marker = new UIMarker(map.getCenter(), {
            content: dom
        });
        marker.addTo(map).show();
        var m = document.getElementById('uimarker');
        expect(m).to.be.ok();
        expect(m.clientHeight).to.be.above(0);
        expect(m.clientWidth).to.be.above(0);
    });

    it('show when zooming', function (done) {
        var marker = new UIMarker(map.getCenter(), {
            content: '<div id="uimarker">marker</div>'
        });
        marker.addTo(map).show();
        map.on('zoomstart', function () {
            expect(marker.isVisible()).to.be.ok();
        });
        map.on('zoomend', function () {
            expect(marker.isVisible()).to.be.ok();
            done();
        });
        map.zoomIn();
    });

    it('can hide', function () {
        var marker = new UIMarker(map.getCenter(), {
            content: '<div id="uimarker">marker</div>',
            animation: null
        });
        marker.addTo(map).show();
        marker.hide();
        expect(marker.isVisible()).not.to.be.ok();
        var m = document.getElementById('uimarker');
        expect(m).to.be.ok();
        expect(m.clientHeight).to.be.eql(0);
        expect(m.clientWidth).to.be.eql(0);
    });

    it('can remove', function () {
        var marker = new UIMarker(map.getCenter(), {
            content: '<div id="uimarker">marker</div>'
        });
        marker.addTo(map).show();
        marker.remove();
        var m = document.getElementById('uimarker');
        expect(m).not.to.be.ok();
    });

    it('is not single', function () {
        var marker = new UIMarker(map.getCenter(), {
            content: '<svg>marker</svg>'
        });
        marker.addTo(map).show();
        var marker2 = new UIMarker(map.getCenter(), {
            content: '<svg>marker2</svg>'
        });
        marker2.addTo(map).show();

        var m = document.getElementsByTagName('svg');
        expect(m).to.have.length(2);
    });

    it('can be set to single', function () {
        var marker = new UIMarker(map.getCenter(), {
            single: true,
            content: '<svg>marker</svg>'
        });
        marker.addTo(map).show();
        var marker2 = new UIMarker(map.getCenter(), {
            single: true,
            content: '<svg>marker2</svg>'
        });
        marker2.addTo(map).show();

        var m = document.getElementsByTagName('svg');
        expect(m).to.have.length(1);
    });

    it('can getContent', function () {
        var content = '<svg>marker</svg>';
        var marker = new UIMarker(map.getCenter(), {
            single: true,
            content: content
        });
        marker.addTo(map).show();
        expect(marker.getContent()).to.be.eql(content);
    });

    it('can setContent', function () {
        var content = '<svg>marker</svg>';
        var marker = new UIMarker(map.getCenter(), {
            single: true,
            content: '<div id="uimarker">marker</div>'
        });
        marker.addTo(map).show();
        var m = document.getElementById('uimarker');
        expect(m).to.be.ok();
        marker.setContent(content);
        expect(marker.getContent()).to.be.eql(content);
        m = document.getElementById('uimarker');
        expect(m).not.to.be.ok();
    });

    it('can getCoordinates', function () {
        var content = '<svg>marker</svg>';
        var marker = new UIMarker(map.getCenter(), {
            single: true,
            content: content
        });
        marker.addTo(map).show();
        expect(marker.getCoordinates().toArray()).to.be.eql(map.getCenter().toArray());
    });

    it('can setCoordinates', function () {
        var content = '<svg>marker</svg>';
        var marker = new UIMarker(map.getCenter(), {
            single: true,
            content: content
        });
        marker.addTo(map).show();
        marker.setCoordinates(map.getCenter().add(0.01, 0.01));
        expect(marker.getCoordinates().toArray()).to.be.eql(map.getCenter().add(0.01, 0.01).toArray());
    });
});
