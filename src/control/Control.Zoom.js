/**
 * @classdesc
 * A zoom control with buttons to zoomin/zoomout and a slider indicator for the zoom level.
 * @class
 * @category control
 * @extends maptalks.control.Control
 * @memberOf maptalks.control
 * @name Zoom
 * @param {Object} [options=null] - options defined in [maptalks.control.Zoom]{@link maptalks.control.Zoom#options}
 * @example
 * var zoomControl = new maptalks.control.Zoom({
 *     position : 'top-left',
 *     slider : true,
 *     zoomLevel : false
 * }).addTo(map);
 */
Z.control.Zoom = Z.control.Control.extend(/** @lends maptalks.control.Zoom.prototype */{

    /**
     * @property {Object}   options - options
     * @property {String|Object}   [options.position="top-left"]  - position of the zoom control.
     * @property {Boolean}  [options.slider=true]                         - Whether to display the slider
     * @property {Boolean}  [options.zoomLevel=true]                      - Whether to display the text box of zoom level
     */
    options:{
        'position'  : 'top-left',
        'slider'    : true,
        'zoomLevel' : true
    },

    buildOn: function (map) {
        this._map = map;
        var options = this.options;

        var dom = Z.DomUtil.createEl('div', 'maptalks-zoom');

        if (options['zoomLevel']) {
            var levelDOM = Z.DomUtil.createEl('span', 'maptalks-zoom-zoomlevel');
            dom.appendChild(levelDOM);
            this._levelDOM = levelDOM;
        }

        var zoomDOM = Z.DomUtil.createEl('div', 'maptalks-zoom-slider');

        var zoomInButton = Z.DomUtil.createEl('a', 'maptalks-zoom-zoomin');
        zoomInButton.href = 'javascript:;';
        zoomInButton.innerHTML = '+';
        zoomDOM.appendChild(zoomInButton);
        this._zoomInButton = zoomInButton;

        if (options['slider']) {
            var sliderDOM = Z.DomUtil.createEl('div', 'maptalks-zoom-slider-box');
            var ruler = Z.DomUtil.createEl('div', 'maptalks-zoom-slider-ruler');
            var reading = Z.DomUtil.createEl('span', 'maptalks-zoom-slider-reading');
            var dot = Z.DomUtil.createEl('span', 'maptalks-zoom-slider-dot');
            ruler.appendChild(reading);
            ruler.appendChild(dot);
            sliderDOM.appendChild(ruler);
            zoomDOM.appendChild(sliderDOM);
            this._sliderBox = sliderDOM;
            this._sliderRuler = ruler;
            this._sliderReading = reading;
            this._sliderDot = dot;
        }

        var zoomOutButton = Z.DomUtil.createEl('a', 'maptalks-zoom-zoomout');
        zoomOutButton.href = 'javascript:;';
        zoomOutButton.innerHTML = '-';
        zoomDOM.appendChild(zoomOutButton);
        this._zoomOutButton = zoomOutButton;

        dom.appendChild(zoomDOM);

        map.on('_zoomend _zoomstart _viewchange', this._update, this);

        this._update();
        this._registerDomEvents();

        return dom;
    },

    _update:function () {
        var map = this.getMap();
        if (this._sliderBox) {
            var pxUnit = 10;
            var totalRange = (map.getMaxZoom() - map.getMinZoom()) * pxUnit;
            this._sliderBox.style.height = totalRange + 6 + 'px';
            this._sliderRuler.style.height = totalRange + 'px';
            var zoomRange = (map.getZoom() - map.getMinZoom()) * pxUnit;
            this._sliderReading.style.height = zoomRange + 'px';
            this._sliderDot.style.bottom = zoomRange + 'px';
        }
        if (this._levelDOM) {
            this._levelDOM.innerHTML = map.getZoom();
        }

    },

    _registerDomEvents:function () {
        var map = this.getMap();
        if (this._zoomInButton) {
            Z.DomUtil.on(this._zoomInButton, 'click', map.zoomIn, map);
        }
        if (this._zoomOutButton) {
            Z.DomUtil.on(this._zoomOutButton, 'click', map.zoomOut, map);
        }
        //TODO slider dot拖放缩放逻辑还没有实现
    },

    onRemove: function () {
        var map = this.getMap();
        if (this._zoomInButton) {
            Z.DomUtil.off(this._zoomInButton, 'click', map.zoomIn, map);
        }
        if (this._zoomOutButton) {
            Z.DomUtil.off(this._zoomOutButton, 'click', map.zoomOut, map);
        }
    }
});

Z.Map.mergeOptions({

    'zoomControl': false
});

Z.Map.addOnLoadHook(function () {
    if (this.options['zoomControl']) {
        this.zoomControl = new Z.control.Zoom(this.options['zoomControl']);
        this.addControl(this.zoomControl);
    }
});
