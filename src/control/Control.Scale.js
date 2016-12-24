import { createEl, createElOn } from 'core/util/dom';
import Map from 'map';
import Control from './Control';

/**
 * @classdesc
 * Based on the implementation in Leaflet, a simple scale control that shows the scale of the current center of screen in metric (m/km) and imperial (mi/ft) systems.
 * @class
 * @category control
 * @extends Control
 * @memberOf control
 * @name Scale
 * @param {Object} [options=null] - options defined in [Scale]{@link Scale#options}
 * @example
 * var scale = new Scale({
 *     position : 'bottom-left',
 *     maxWidth : 160,
 *     metric : true,
 *     imperial : true
 * }).addTo(map);
 */
export const Scale = Control.extend(/** @lends Scale.prototype */ {

    /**
     * @property {Object} [options=null] - options
     * @property {String|Object}   [options.position="bottom-left"]  - position of the scale control.
     * @property {Number} [options.maxWidth=100]               - max width of the scale control.
     * @property {Boolean} [options.metric=true]               - Whether to show the metric scale line (m/km).
     * @property {Boolean} [options.imperial=false]            - Whether to show the imperial scale line (mi/ft).
     */
    options: {
        'position': 'bottom-left',
        'maxWidth': 100,
        'metric': true,
        'imperial': false
    },

    buildOn: function (map) {
        this._map = map;
        this._scaleContainer = createEl('div');
        this._addScales();
        map.on('zoomend', this._update, this);
        if (this._map._loaded) {
            this._update();
        }
        return this._scaleContainer;
    },

    onRemove: function () {
        this.getMap().off('zoomend', this._update, this);
    },

    _addScales: function () {
        var css = 'border: 2px solid #000000;border-top: none;line-height: 1.1;padding: 2px 5px 1px;' +
            'color: #000000;font-size: 11px;text-align:center;white-space: nowrap;overflow: hidden' +
            ';-moz-box-sizing: content-box;box-sizing: content-box;background: #fff; background: rgba(255, 255, 255, 0);';
        if (this.options['metric']) {
            this._mScale = createElOn('div', css, this._scaleContainer);
        }
        if (this.options['imperial']) {
            this._iScale = createElOn('div', css, this._scaleContainer);
        }
    },

    _update: function () {
        var map = this._map;
        var maxMeters = map.pixelToDistance(this.options['maxWidth'], 0);
        this._updateScales(maxMeters);
    },

    _updateScales: function (maxMeters) {
        if (this.options['metric'] && maxMeters) {
            this._updateMetric(maxMeters);
        }
        if (this.options['imperial'] && maxMeters) {
            this._updateImperial(maxMeters);
        }
    },

    _updateMetric: function (maxMeters) {
        var meters = this._getRoundNum(maxMeters),
            label = meters < 1000 ? meters + ' m' : (meters / 1000) + ' km';

        this._updateScale(this._mScale, label, meters / maxMeters);
    },

    _updateImperial: function (maxMeters) {
        var maxFeet = maxMeters * 3.2808399,
            maxMiles, miles, feet;

        if (maxFeet > 5280) {
            maxMiles = maxFeet / 5280;
            miles = this._getRoundNum(maxMiles);
            this._updateScale(this._iScale, miles + ' mile', miles / maxMiles);

        } else {
            feet = this._getRoundNum(maxFeet);
            this._updateScale(this._iScale, feet + ' feet', feet / maxFeet);
        }
    },

    _updateScale: function (scale, text, ratio) {
        scale['style']['width'] = Math.round(this.options['maxWidth'] * ratio) + 'px';
        scale['innerHTML'] = text;
    },

    _getRoundNum: function (num) {
        var pow10 = Math.pow(10, (Math.floor(num) + '').length - 1),
            d = num / pow10;

        d = d >= 10 ? 10 :
            d >= 5 ? 5 :
            d >= 3 ? 3 :
            d >= 2 ? 2 : 1;

        return pow10 * d;
    }
});

Map.mergeOptions({
    'scaleControl': false
});

Map.addOnLoadHook(function () {
    if (this.options['scaleControl']) {
        this.scaleControl = new Scale(this.options['scaleControl']);
        this.addControl(this.scaleControl);
    }
});
