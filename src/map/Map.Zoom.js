import { isNil } from 'core/util';
import Point from 'geo/Point';
import Map from './Map';

Map.include(/** @lends Map.prototype */ {
    _zoom: function (nextZoomLevel, origin, startScale) {
        if (!this.options['zoomable'] || this._zooming) {
            return;
        }
        this._originZoomLevel = this.getZoom();
        nextZoomLevel = this._checkZoomLevel(nextZoomLevel);
        this.onZoomStart(nextZoomLevel);
        var zoomOffset;
        if (origin) {
            origin = new Point(this.width / 2, this.height / 2);
            zoomOffset = this._getZoomCenterOffset(nextZoomLevel, origin, startScale);
        }
        this.onZoomEnd(nextZoomLevel, zoomOffset);
    },

    _zoomAnimation: function (nextZoomLevel, origin, startScale) {
        if (!this.options['zoomable'] || this._zooming) {
            return;
        }
        if (isNil(startScale)) {
            startScale = 1;
        }
        if (isNil(this._originZoomLevel)) {
            this._originZoomLevel = this.getZoom();
        }
        nextZoomLevel = this._checkZoomLevel(nextZoomLevel);
        if (this._originZoomLevel === nextZoomLevel) {
            return;
        }

        this.onZoomStart(nextZoomLevel);
        if (!origin) {
            origin = new Point(this.width / 2, this.height / 2);
        }
        this._startZoomAnimation(startScale, origin, nextZoomLevel);
    },

    _startZoomAnimation: function (startScale, transOrigin, nextZoomLevel) {
        var me = this;
        var resolutions = this._getResolutions();
        var endScale = resolutions[this._originZoomLevel] / resolutions[nextZoomLevel];
        var zoomOffset = this._getZoomCenterOffset(nextZoomLevel, transOrigin, startScale);
        if (zoomOffset.x === 0 && zoomOffset.y === 0) {
            //center is out of maxExtent
            transOrigin = new Point(this.width / 2, this.height / 2);
        }
        var duration = this.options['zoomAnimationDuration'] * Math.abs(endScale - startScale) / Math.abs(endScale - 1);
        this._getRenderer().animateZoom({
            startScale: startScale,
            endScale: endScale,
            origin: transOrigin,
            duration: duration
        },
        function () {
            me.onZoomEnd(nextZoomLevel, zoomOffset);
        });
    },

    onZoomStart: function (nextZoomLevel) {
        this._zooming = true;
        this._enablePanAnimation = false;
        /**
         * zoomstart event
         * @event Map#zoomstart
         * @type {Object}
         * @property {String} type                    - zoomstart
         * @property {Map} target            - the map fires event
         * @property {Number} from                    - zoom level zooming from
         * @property {Number} to                      - zoom level zooming to
         */
        this._fireEvent('zoomstart', {
            'from': this._originZoomLevel,
            'to': nextZoomLevel
        });
    },

    onZoomEnd: function (nextZoomLevel, zoomOffset) {
        this._zoomLevel = nextZoomLevel;
        if (zoomOffset && (zoomOffset.x !== 0 || zoomOffset.y !== 0)) {
            this._offsetCenterByPixel(zoomOffset._multi(-1));
        }
        var _originZoomLevel = this._originZoomLevel;
        this._originZoomLevel = nextZoomLevel;
        this._getRenderer().onZoomEnd();
        this._zooming = false;
        /**
         * zoomend event
         * @event Map#zoomend
         * @type {Object}
         * @property {String} type                    - zoomend
         * @property {Map} target            - the map fires event
         * @property {Number} from                    - zoom level zooming from
         * @property {Number} to                      - zoom level zooming to
         */
        this._fireEvent('zoomend', {
            'from': _originZoomLevel,
            'to': nextZoomLevel
        });
    },


    _checkZoomLevel: function (nextZoomLevel) {
        var maxZoom = this.getMaxZoom(),
            minZoom = this.getMinZoom();
        if (nextZoomLevel < minZoom) {
            nextZoomLevel = minZoom;
        }
        if (nextZoomLevel > maxZoom) {
            nextZoomLevel = maxZoom;
        }
        return nextZoomLevel;
    },

    _getZoomCenterOffset: function (nextZoomLevel, origin, startScale) {
        if (isNil(startScale)) {
            startScale = 1;
        }
        var resolutions = this._getResolutions();
        var zScale;
        var zoomOffset;
        if (nextZoomLevel < this._originZoomLevel) {
            zScale = resolutions[nextZoomLevel + 1] / resolutions[nextZoomLevel];
            zoomOffset = new Point(-(origin.x - this.width / 2) * (startScale - zScale), -(origin.y - this.height / 2) * (startScale - zScale));
        } else {
            zScale = resolutions[nextZoomLevel - 1] / resolutions[nextZoomLevel];
            zoomOffset = new Point(
                (origin.x - this.width / 2) * (zScale - startScale),
                (origin.y - this.height / 2) * (zScale - startScale)
            );
        }

        var newCenter = this.containerPointToCoordinate(new Point(this.width / 2 + zoomOffset.x, this.height / 2 + zoomOffset.y));
        if (!this._verifyExtent(newCenter)) {
            return new Point(0, 0);
        }

        return zoomOffset;
    },

    _getZoomMillisecs: function () {
        return 600;
    }
});
