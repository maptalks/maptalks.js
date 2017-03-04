import { isNil } from 'core/util';
import Browser from 'core/Browser';
import { Animation } from 'core/Animation';
import Point from 'geo/Point';
import Map from './Map';

Map.include(/** @lends Map.prototype */{

    _zoom(nextZoom, origin, startScale) {
        if (!this.options['zoomable'] || this.isZooming()) { return; }
        if (this.options['zoomInCenter']) {
            origin = null;
        }
        nextZoom = this._checkZoom(nextZoom);
        this.onZoomStart(nextZoom);
        this._frameZoom = this.getZoom();
        this.onZoomEnd(nextZoom, origin, startScale);
    },

    _zoomAnimation(nextZoom, origin, startScale) {
        if (!this.options['zoomable'] || this.isZooming()) { return; }

        nextZoom = this._checkZoom(nextZoom);
        if (this.getZoom() === nextZoom) {
            return;
        }

        this.onZoomStart(nextZoom);
        if (!origin || this.options['zoomInCenter']) {
            origin = new Point(this.width / 2, this.height / 2);
        }
        this._startZoomAnimation(nextZoom, origin, startScale);
    },

    _startZoomAnimation(nextZoom, origin, startScale) {
        if (isNil(startScale)) {
            startScale = 1;
        }
        var endScale = this._getResolution(this._startZoomVal) / this._getResolution(nextZoom);
        var duration = this.options['zoomAnimationDuration'] * Math.abs(endScale - startScale) / Math.abs(endScale - 1);
        this._frameZoom = this._startZoomVal;
        Animation.animate(
            {
                'zoom'  : [this._startZoomVal, nextZoom]
            },
            {
                'easing' : 'out',
                'duration'  : duration
            },
            frame => {
                if (frame.state.playState === 'finished') {
                    this.onZoomEnd(frame.styles['zoom'], origin);
                } else {
                    this.onZooming(frame.styles['zoom'], origin, startScale);
                }
            }
        ).play();
    },

    onZoomStart(nextZoom) {
        this._zooming = true;
        this._enablePanAnimation = false;
        this._startZoomVal = this.getZoom();
        /**
          * zoomstart event
          * @event Map#zoomstart
          * @type {Object}
          * @property {String} type                    - zoomstart
          * @property {Map} target                     - the map fires event
          * @property {Number} from                    - zoom level zooming from
          * @property {Number} to                      - zoom level zooming to
          */
        this._fireEvent('zoomstart', { 'from' : this._startZoomVal, 'to': nextZoom });
    },

    onZooming(nextZoom, origin, startScale) {
        var frameZoom = this._frameZoom;
        if (frameZoom === nextZoom) {
            return;
        }
        if (isNil(startScale)) {
            startScale = 1;
        }
        this._zoomTo(nextZoom, origin, startScale);
        var res = this.getResolution(nextZoom);
        var fromRes = this.getResolution(this._startZoomVal);
        var scale = fromRes / res / startScale;
        var offset = this.offsetPlatform();
        var matrix = {
            'view' : [scale, 0, 0, scale, (origin.x - offset.x) *  (1 - scale), (origin.y - offset.y) *  (1 - scale)]
        };
        if (Browser.retina) {
            origin = origin.multi(2);
        }
        matrix['container'] = [scale, 0, 0, scale, origin.x * (1 - scale), origin.y *  (1 - scale)];
        /**
          * zooming event
          * @event Map#zooming
          * @type {Object}
          * @property {String} type                    - zooming
          * @property {Map} target                     - the map fires event
          * @property {Number} from                    - zoom level zooming from
          * @property {Number} to                      - zoom level zooming to
          */
        this._fireEvent('zooming', { 'from' : this._startZoomVal, 'to': nextZoom, 'origin' : origin, 'matrix' : matrix });
        this._frameZoom = nextZoom;
        var renderer = this._getRenderer();
        if (renderer) {
            renderer.render();
        }
    },

    onZoomEnd(nextZoom, origin) {
        var startZoomVal = this._startZoomVal;
        this._zoomTo(nextZoom, origin);
        this._zooming = false;
        this._getRenderer().onZoomEnd();

        /**
          * zoomend event
          * @event Map#zoomend
          * @type {Object}
          * @property {String} type                    - zoomend
          * @property {Map} target                     - the map fires event
          * @property {Number} from                    - zoom level zooming from
          * @property {Number} to                      - zoom level zooming to
          */
        this._fireEvent('zoomend', { 'from' : startZoomVal, 'to': nextZoom });
    },

    _zoomTo(nextZoom, origin, startScale) {
        const zScale = this._getResolution(this._frameZoom) / this._getResolution(nextZoom);
        const zoomOffset = this._getZoomCenterOffset(nextZoom, origin, startScale, zScale);
        this._zoomLevel = nextZoom;
        this._calcMatrices();
        if (zoomOffset && (zoomOffset.x !== 0 || zoomOffset.y !== 0)) {
            this._offsetCenterByPixel(zoomOffset._multi(-1));
        }
    },

    _checkZoom(nextZoom) {
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

    _getZoomCenterOffset(nextZoom, origin, startScale, zScale) {
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

    _getZoomMillisecs() {
        return 600;
    }
});
