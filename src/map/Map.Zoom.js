import { bind, isNil, isInteger } from 'core/util';
import Browser from 'core/Browser';
import { Animation } from 'utils/Animation';
import Point from 'geo/Point';
import Map from './Map';

Map.include(/** @lends maptalks.Map.prototype */{
    _zoom: function (nextZoom, origin, startScale) {
        if (!this.options['zoomable'] || this._zooming) { return; }
        nextZoom = this._checkZoom(nextZoom);
        this.onZoomStart(nextZoom);
        this._frameZoom = this.getZoom();
        this.onZoomEnd(nextZoom, origin, startScale);
    },

    _isSeamlessZoom: function () {
        return !isInteger(this._zoomLevel);
    },

    _zoomAnimation: function (nextZoom, origin, startScale) {
        if (!this.options['zoomable'] || this._zooming) { return; }

        nextZoom = this._checkZoom(nextZoom);
        if (this.getZoom() === nextZoom) {
            return;
        }

        this.onZoomStart(nextZoom);
        if (!origin) {
            origin = new Point(this.width / 2, this.height / 2);
        }
        this._startZoomAnimation(nextZoom, origin, startScale);
    },

    _startZoomAnimation: function (nextZoom, origin, startScale) {
        if (isNil(startScale)) {
            startScale = 1;
        }
        var me = this;
        var endScale = this._getResolution(this._startZoomVal) / this._getResolution(nextZoom);
        var duration = this.options['zoomAnimationDuration'] * Math.abs(endScale - startScale) / Math.abs(endScale - 1);
        this._frameZoom = this._startZoomVal;
        Animation.animate(
            {
                'zoom'  : [this._startZoomVal, nextZoom]
            },
            {
                'easing' : 'out',
                'speed'  : duration
            },
            bind(function (frame) {
                if (frame.state.playState === 'finished') {
                    me.onZoomEnd(frame.styles['zoom'], origin);
                } else {
                    me.onZooming(frame.styles['zoom'], origin, startScale);
                }
            }, this)
        ).play();
    },

    onZoomStart: function (nextZoom) {
        this._zooming = true;
        this._enablePanAnimation = false;
        this._startZoomVal = this.getZoom();
        /**
          * zoomstart event
          * @event maptalks.Map#zoomstart
          * @type {Object}
          * @property {String} type                    - zoomstart
          * @property {Map} target            - the map fires event
          * @property {Number} from                    - zoom level zooming from
          * @property {Number} to                      - zoom level zooming to
          */
        this._fireEvent('zoomstart', { 'from' : this._startZoomVal, 'to': nextZoom });
    },

    onZooming: function (nextZoom, origin, startScale) {
        var frameZoom = this._frameZoom;
        if (frameZoom === nextZoom) {
            return;
        }
        if (isNil(startScale)) {
            startScale = 1;
        }
        var zoomOffset = this._zoomTo(nextZoom, origin, startScale);
        var res = this.getResolution(nextZoom);
        var fromRes = this.getResolution(this._startZoomVal);
        var scale = fromRes / res / startScale;
        var pos = this.offsetPlatform();
        var matrix = {
            'view' : [scale, 0, 0, scale, (origin.x - pos.x) *  (1 - scale), (origin.y - pos.y) *  (1 - scale)]
        };
        if (Browser.retina) {
            origin = origin.multi(2);
        }
        matrix['container'] = [scale, 0, 0, scale, origin.x * (1 - scale), origin.y *  (1 - scale)];
        /**
          * zooming event
          * @event maptalks.Map#zooming
          * @type {Object}
          * @property {String} type                    - zooming
          * @property {maptalks.Map} target            - the map fires event
          * @property {Number} from                    - zoom level zooming from
          * @property {Number} to                      - zoom level zooming to
          */
        this._fireEvent('zooming', { 'from' : this._startZoomVal, 'to': nextZoom, 'origin' : zoomOffset, 'matrix' : matrix });
        this._frameZoom = nextZoom;
        var renderer = this._getRenderer();
        if (renderer) {
            renderer.render();
        }
    },

    onZoomEnd: function (nextZoom, origin) {
        var startZoomVal = this._startZoomVal;
        this._zoomTo(nextZoom, origin);
        this._zooming = false;
        this._getRenderer().onZoomEnd();

        /**
          * zoomend event
          * @event maptalks.Map#zoomend
          * @type {Object}
          * @property {String} type                    - zoomend
          * @property {maptalks.Map} target            - the map fires event
          * @property {Number} from                    - zoom level zooming from
          * @property {Number} to                      - zoom level zooming to
          */
        this._fireEvent('zoomend', { 'from' : startZoomVal, 'to': nextZoom });
    },

    _zoomTo: function (nextZoom, origin, startScale) {
        var zScale = this._getResolution(this._frameZoom) / this._getResolution(nextZoom);
        var zoomOffset = this._getZoomCenterOffset(nextZoom, origin, startScale, zScale);
        this._zoomLevel = nextZoom;
        if (zoomOffset && (zoomOffset.x !== 0 || zoomOffset.y !== 0)) {
            this._offsetCenterByPixel(zoomOffset._multi(-1));
        }
        return zoomOffset;
    },

    _checkZoom:function (nextZoom) {
        var maxZoom = this.getMaxZoom(),
            minZoom = this.getMinZoom();
        if (nextZoom < minZoom) {
            nextZoom = minZoom;
        }
        if (nextZoom > maxZoom) {
            nextZoom = maxZoom;
        }
        return nextZoom;
    },

    _getZoomCenterOffset: function (nextZoom, origin, startScale, zScale) {
        if (!origin) {
            return null;
        }
        if (isNil(startScale)) {
            startScale = 1;
        }
        var zoomOffset = new Point(
            (origin.x - this.width / 2) * (zScale - startScale),
            (origin.y - this.height / 2) * (zScale - startScale)
        );

        var newCenter = this.containerPointToCoordinate(zoomOffset.add(this.width / 2, this.height / 2));
        if (!this._verifyExtent(newCenter)) {
            return new Point(0, 0);
        }

        return zoomOffset;
    },

    _getZoomMillisecs: function () {
        return 600;
    }
});
