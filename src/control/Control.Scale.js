import { createEl, createElOn } from '../core/util/dom';
import Map from '../map/Map';
import Control from './Control';

/**
 * @property {Object} [options=null] - options
 * @property {String|Object}   [options.position="bottom-left"]  - position of the scale control.
 * @property {Number} [options.maxWidth=100]               - max width of the scale control.
 * @property {Boolean} [options.metric=true]               - Whether to show the metric scale line (m/km).
 * @property {Boolean} [options.imperial=false]            - Whether to show the imperial scale line (mi/ft).
 * @property {String|Object} [options.containerClass=null]           - scalControl's container div's CSS class
 * @instance
 * @memberOf control.Scale
 */
const options = {
    'position': 'bottom-left',
    'maxWidth': 100,
    'metric': true,
    'imperial': false,
    'containerClass': null
};

/**
 * @classdesc
 * Based on scale control of Leaflet, a simple scale control that shows the scale of the current center of screen in metric (m/km) and imperial (mi/ft) systems.
 * @category control
 * @extends control.Control
 * @memberOf control
 * @example
 * var scale = new Scale({
 *     position : 'bottom-left',
 *     maxWidth : 160,
 *     metric : true,
 *     imperial : true,
 *     containerClass : null
 * }).addTo(map);
 */
class Scale extends Control {

    /**
     * method to build DOM of the control
     * @param  {Map} map map to build on
     * @return {HTMLDOMElement}
     */
    buildOn(map) {
        this._map = map;
        this._scaleContainer = createEl('div', this.options['containerClass']);
        this._addScales();
        map.on('zoomend', this._update, this);
        if (this._map._loaded) {
            this._update();
        }
        return this._scaleContainer;
    }

    onRemove() {
        this.getMap().off('zoomend', this._update, this);
    }

    _addScales() {
        const css = 'border: 2px solid #000000;border-top: none;line-height: 1.1;padding: 2px 5px 1px;' +
            'color: #000000;font-size: 11px;text-align:center;white-space: nowrap;overflow: hidden' +
            ';-moz-box-sizing: content-box;box-sizing: content-box;background: #fff; background: rgba(255, 255, 255, 0);';
        if (this.options['metric']) {
            this._mScale = createElOn('div', this.options['containerClass'] ? null : css, this._scaleContainer);
        }
        if (this.options['imperial']) {
            this._iScale = createElOn('div', this.options['containerClass'] ? null : css, this._scaleContainer);
        }
    }

    _update() {
        const map = this._map;
        const maxMeters = map.pixelToDistance(this.options['maxWidth'], 0);
        this._updateScales(maxMeters);
    }

    _updateScales(maxMeters) {
        if (this.options['metric'] && maxMeters) {
            this._updateMetric(maxMeters);
        }
        if (this.options['imperial'] && maxMeters) {
            this._updateImperial(maxMeters);
        }
    }

    _updateMetric(maxMeters) {
        const meters = this._getRoundNum(maxMeters),
            label = meters < 1000 ? meters + ' m' : (meters / 1000) + ' km';

        this._updateScale(this._mScale, label, meters / maxMeters);
    }

    _updateImperial(maxMeters) {
        const maxFeet = maxMeters * 3.2808399;
        let maxMiles, miles, feet;

        if (maxFeet > 5280) {
            maxMiles = maxFeet / 5280;
            miles = this._getRoundNum(maxMiles);
            this._updateScale(this._iScale, miles + ' mile', miles / maxMiles);

        } else {
            feet = this._getRoundNum(maxFeet);
            this._updateScale(this._iScale, feet + ' feet', feet / maxFeet);
        }
    }

    _updateScale(scale, text, ratio) {
        scale['style']['width'] = Math.round(this.options['maxWidth'] * ratio) + 'px';
        scale['innerHTML'] = text;
    }

    _getRoundNum(num) {
        const pow10 = Math.pow(10, (Math.floor(num) + '').length - 1);
        let d = num / pow10;

        d = d >= 10 ? 10 :
            d >= 5 ? 5 :
                d >= 3 ? 3 :
                    d >= 2 ? 2 : 1;

        return pow10 * d;
    }
}

Scale.mergeOptions(options);

Map.mergeOptions({
    'scaleControl': false
});

Map.addOnLoadHook(function () {
    if (this.options['scaleControl']) {
        this.scaleControl = new Scale(this.options['scaleControl']);
        this.addControl(this.scaleControl);
    }
});

export default Scale;
