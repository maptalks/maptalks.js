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

    _onTouchStart:function (event) {
        var map = this.target;
        if (!event.touches || event.touches.length !== 2 || map._zooming) { return; }
        var container = map._containerDOM;
        var p1 = Z.DomUtil.getEventContainerPoint(event.touches[0], container),
            p2 = Z.DomUtil.getEventContainerPoint(event.touches[1], container);

        this._startDist = p1.distanceTo(p2);
        this._startZoom = map.getZoom();
        if (map.options['touchZoomOrigin'] === 'pinch') {
            this._preOrigin = p1.add(p2)._multi(1 / 2);
        } else {
            var size = map.getSize();
            this._preOrigin = new Z.Point(size['width'] / 2, size['height'] / 2);
        }


        map._zooming = true;

        Z.DomUtil.addDomEvent(document, 'touchmove', this._onTouchMove, this)
            .addDomEvent(document, 'touchend', this._onTouchEnd, this);

        Z.DomUtil.preventDefault(event);
        /**
          * touchzoomstart event
          * @event maptalks.Map#touchzoomstart
          * @type {Object}
          * @property {String} type                    - touchzoomstart
          * @property {maptalks.Map} target            - the map fires event
          */
        map._fireEvent('touchzoomstart');
    },

    _onTouchMove:function (event) {
        var map = this.target;
        if (!event.touches || event.touches.length !== 2 || !map._zooming) { return; }
        var container = map._containerDOM,
            p1 = Z.DomUtil.getEventContainerPoint(event.touches[0], container),
            p2 = Z.DomUtil.getEventContainerPoint(event.touches[1], container),
            scale = p1.distanceTo(p2) / this._startDist;
        var origin;
        if (map.options['touchZoomOrigin'] === 'pinch') {
            origin = p1.add(p2)._multi(1 / 2);
        } else {
            var size = map.getSize();
            origin = new Z.Point(size['width'] / 2, size['height'] / 2);
        }
        var offset = this._preOrigin.substract(origin);
        map.offsetPlatform(offset);
        map._offsetCenterByPixel(offset);
        this._preOrigin = origin;
        this._scale = scale;

        var renderer = map._getRenderer();

        var matrix = map._generateMatrices(origin, scale);
        renderer.transform(matrix);
        /**
          * touchzooming event
          * @event maptalks.Map#touchzooming
          * @type {Object}
          * @property {String} type                    - touchzooming
          * @property {maptalks.Map} target            - the map fires event
          * @property {Matrix} matrix                  - transforming matrix
          */
        map._fireEvent('touchzooming', {'matrix': matrix});
        // Z.DomUtil.preventDefault(event);
    },

    _onTouchEnd:function () {
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
        /**
          * touchzoomend event
          * @event maptalks.Map#touchzoomend
          * @type {Object}
          * @property {String} type                    - touchzoomend
          * @property {maptalks.Map} target            - the map fires event
          */
        map._fireEvent('touchzoomend');
        if (zoom === map.getZoom()) {
            //remove scale transform
            map._getRenderer().transform(null);
        } else {
            map._zoomAnimation(zoom, this._preOrigin, this._scale);
        }
    }
});


Z.Map.addInitHook('addHandler', 'touchZoom', Z.Map.TouchZoom);
