Z.Map.mergeOptions({
    'touchZoom': true,
    'touchZoomOrigin' : 'center'
});

//handler to zoom map by pinching
Z.Map.TouchZoom = Z.Handler.extend({
    addHooks: function () {
        Z.DomUtil.addDomEvent(this.target._containerDOM, 'touchstart', this._onTouchStart, this);
    },

    removeHooks: function () {
        Z.DomUtil.removeDomEvent(this.target._containerDOM, 'touchstart', this._onTouchStart);
    },

    _onTouchStart:function(event) {
        var map = this.target;
        if (!event.touches || event.touches.length !== 2 || map._zooming) { return; }
        var container = map._containerDOM;
        var p1 = Z.DomUtil.getEventContainerPoint(event.touches[0], container),
            p2 = Z.DomUtil.getEventContainerPoint(event.touches[1], container);

        this._startDist = p1.distanceTo(p2);
        this._startZoom = map.getZoom();
        if (map.options['touchZoomOrigin'] === 'pinch') {
            this._preOrigin = p1.add(p2)._multi(1/2);
        } else {
            var size = map.getSize();
            this._preOrigin = new Z.Point(size['width']/2, size['height']/2);
        }


        map._zooming = true;

        Z.DomUtil.addDomEvent(document, 'touchmove', this._onTouchMove, this)
            .addDomEvent(document, 'touchend', this._onTouchEnd, this);

        Z.DomUtil.preventDefault(event);
        map._fireEvent('touchzoomstart');
    },

    _onTouchMove:function(event) {
        var map = this.target;
        if (!event.touches || event.touches.length !== 2 || !map._zooming) { return; }
        var container = map._containerDOM,
            p1 = Z.DomUtil.getEventContainerPoint(event.touches[0], container),
            p2 = Z.DomUtil.getEventContainerPoint(event.touches[1], container),
            scale = p1.distanceTo(p2) / this._startDist;
        var origin;
        if (map.options['touchZoomOrigin'] === 'pinch') {
            origin = p1.add(p2)._multi(1/2);
        } else {
            var size = map.getSize();
            origin = new Z.Point(size['width']/2, size['height']/2);
        }
        var offset = this._preOrigin.substract(origin);
        map.offsetPlatform(offset);
        map._offsetCenterByPixel(offset.multi(-1));
        this._preOrigin = origin;
        this._scale = scale;

        var renderer = map._getRenderer();

        var matrix = renderer.getZoomMatrix(scale, origin);
        renderer.transform.call(renderer, matrix);

        Z.DomUtil.preventDefault(event);
    },

    _onTouchEnd:function(event) {
        var map = this.target;
        if (!map._zooming) {
            map._zooming = false;
            return;
        }
        map._zooming = false;

        Z.DomUtil
            .off(document, 'touchmove', this._onTouchMove, this)
            .off(document, 'touchend', this._onTouchEnd, this);

        var scale = this._scale;
        var zoom = map.getZoomForScale(scale);
        if (zoom === -1) {
            zoom = map.getZoom();
        }
        map._fireEvent('touchzoomend');
        map._zoomAnimation(zoom, this._preOrigin, this._scale);
    }
});


Z.Map.addInitHook('addHandler', 'touchZoom', Z.Map.TouchZoom);
