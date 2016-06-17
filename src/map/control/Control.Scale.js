/**
 * @classdesc
 * Based on the implementation in Leaflet, a simple scale control that shows the scale of the current center of screen in metric (m/km) and imperial (mi/ft) systems.
 * @class
 * @category control
 * @extends maptalks.Control
 * @memberOf maptalks.control
 * @name Scale
 * @param {Object} [options=null] - construct options
 * @param {Object} [options.position=maptalks.Control.bottom_left]  - position of the scale control.
 * @param {Number} [options.maxWidth=100]               - max width of the scale control.
 * @param {Boolean} [options.metric=true]               - Whether to show the metric scale line (m/km).
 * @param {Boolean} [options.imperial=false]            - Whether to show the imperial scale line (mi/ft).
 */
Z.control.Scale = Z.Control.extend(/** @lends maptalks.control.Scale.prototype */{

    /**
     * @property {Object} [options=null] - options
     * @property {Object} [options.position=maptalks.Control.bottom_left]  - position of the scale control.
     * @property {Number} [options.maxWidth=100]               - max width of the scale control.
     * @property {Boolean} [options.metric=true]               - Whether to show the metric scale line (m/km).
     * @property {Boolean} [options.imperial=false]            - Whether to show the imperial scale line (mi/ft).
     */
    options:{
        'position' : Z.Control['bottom_left'],
        'maxWidth': 100,
        'metric': true,
        'imperial': false
    },

    statics: {
        'maptalks-control-scale' : 'border: 2px solid #000000;border-top: none;line-height: 1.1;padding: 2px 5px 1px;' +
                          'color: #000000;font-size: 11px;text-align:center;white-space: nowrap;overflow: hidden' +
                          ';-moz-box-sizing: content-box;box-sizing: content-box;background: #fff; background: rgba(255, 255, 255, 0);'
    },

    buildOn: function (map) {
        this._map = map;
        this._scaleContainer = Z.DomUtil.createEl('div');
        this._addScales();
        map.on('zoomend', this._update, this);
        if (this._map._loaded) {
            this._update();
        }
        return this._scaleContainer;
    },

    _onRemove: function () {
        var map = this.getMap();
        map.off('zoomend', this._update, this);
    },

    _addScales: function () {
        if (this.options['metric']) {
            this._mScale = Z.DomUtil.createElOn('div', Z.control.Scale['maptalks-control-scale'], this._scaleContainer);
        }
        if (this.options['imperial']) {
            this._iScale = Z.DomUtil.createElOn('div', Z.control.Scale['maptalks-control-scale'], this._scaleContainer);
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

Z.Map.mergeOptions({
    'scaleControl' : false
});

Z.Map.addOnLoadHook(function () {
    if (this.options['scaleControl']) {
        this.scaleControl = new Z.control.Scale(this.options['scaleControl']);
        this.addControl(this.scaleControl);
    }
});
