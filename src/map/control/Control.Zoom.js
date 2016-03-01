/**
 * 地图放大缩小控件
 * @class maptalks.control.Zoom
 * @extends maptalks.Control

 */
Z.control.Zoom = Z.Control.extend({

    /**
     * @cfg {Object} options zoom控件属性
     */
    options:{
        'position'  : Z.Control['top_left'],
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

        var zoomDOM = Z.DomUtil.createEl('div','maptalks-zoom-slider');

        var zoomInButton = Z.DomUtil.createEl('a','maptalks-zoom-zoomin');
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

        var zoomOutButton = Z.DomUtil.createEl('a','maptalks-zoom-zoomout');
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

    _update:function() {
        var map = this._map;
        if (this._sliderBox) {
            var pxUnit = 10;
            var totalRange = (map.getMaxZoom() - map.getMinZoom()) * pxUnit;
            this._sliderBox.style.height = totalRange+6 + 'px';
            this._sliderRuler.style.height = totalRange + 'px';
            var zoomRange = (map.getZoom() - map.getMinZoom())*pxUnit;
            this._sliderReading.style.height = zoomRange + 'px';
            this._sliderDot.style.bottom = zoomRange + 'px';
        }
        if (this._levelDOM) {
            this._levelDOM.innerHTML = map.getZoom();
        }

    },

    _registerDomEvents:function() {
        var map = this._map;
        if (this._zoomInButton) {
            Z.DomUtil.on(this._zoomInButton, 'click', map.zoomIn, map);
        }
        if (this._zoomOutButton) {
            Z.DomUtil.on(this._zoomOutButton, 'click', map.zoomOut, map);
        }
        //TODO slider dot拖放缩放逻辑还没有实现
    },

    _onRemove: function () {
        var map = this.getMap();
        map.off('_zoomend _zoomstart', this._onZoomEnd, this);
    }
});

Z.Map.mergeOptions({
    /**
     * @cfg {Boolean} [zoomControl="false"] 是否显示zoom控件
     * @member maptalks.Map
     */
    'zoomControl': false,
});

Z.Map.addOnLoadHook(function () {
    if (this.options['zoomControl']) {
        var options = this.options['zoomControl'];
        if (options === true) {
            options = {};
        }
        this.zoomControl = new Z.control.Zoom(options);
        this.addControl(this.zoomControl);
    }
});
