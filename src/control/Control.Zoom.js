import { on, off, createEl } from 'core/util/dom';
import Map from 'map/Map';
import Control from './Control';

/**
 * @property {Object}   options - options
 * @property {String|Object}   [options.position="top-left"]  - position of the zoom control.
 * @property {Boolean}  [options.slider=true]                         - Whether to display the slider
 * @property {Boolean}  [options.zoomLevel=true]                      - Whether to display the text box of zoom level
 * @memberOf control.Zoom
 * @instance
 */
const options = {
    'position': 'top-left',
    'slider': true,
    'zoomLevel': true
};

/**
 * @classdesc
 * A zoom control with buttons to zoomin/zoomout and a slider indicator for the zoom level.
 * @category control
 * @extends control.Control
 * @memberOf control
 * @example
 * var zoomControl = new Zoom({
 *     position : 'top-left',
 *     slider : true,
 *     zoomLevel : false
 * }).addTo(map);
 */
class Zoom extends Control {
    /**
     * method to build DOM of the control
     * @param  {Map} map map to build on
     * @return {HTMLDOMElement}
     */
    buildOn(map) {
        this._map = map;
        var options = this.options;

        var dom = createEl('div', 'maptalks-zoom');

        if (options['zoomLevel']) {
            var levelDOM = createEl('span', 'maptalks-zoom-zoomlevel');
            dom.appendChild(levelDOM);
            this._levelDOM = levelDOM;
        }

        var zoomDOM = createEl('div', 'maptalks-zoom-slider');

        var zoomInButton = createEl('a', 'maptalks-zoom-zoomin');
        zoomInButton.href = 'javascript:;';
        zoomInButton.innerHTML = '+';
        zoomDOM.appendChild(zoomInButton);
        this._zoomInButton = zoomInButton;

        if (options['slider']) {
            var sliderDOM = createEl('div', 'maptalks-zoom-slider-box');
            var ruler = createEl('div', 'maptalks-zoom-slider-ruler');
            var reading = createEl('span', 'maptalks-zoom-slider-reading');
            var dot = createEl('span', 'maptalks-zoom-slider-dot');
            ruler.appendChild(reading);
            ruler.appendChild(dot);
            sliderDOM.appendChild(ruler);
            zoomDOM.appendChild(sliderDOM);
            this._sliderBox = sliderDOM;
            this._sliderRuler = ruler;
            this._sliderReading = reading;
            this._sliderDot = dot;
        }

        var zoomOutButton = createEl('a', 'maptalks-zoom-zoomout');
        zoomOutButton.href = 'javascript:;';
        zoomOutButton.innerHTML = '-';
        zoomDOM.appendChild(zoomOutButton);
        this._zoomOutButton = zoomOutButton;

        dom.appendChild(zoomDOM);

        map.on('_zoomend _zoomstart _viewchange', this._update, this);

        this._update();
        this._registerDomEvents();

        return dom;
    }

    _update() {
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

    }

    _registerDomEvents() {
        var map = this.getMap();
        if (this._zoomInButton) {
            on(this._zoomInButton, 'click', map.zoomIn, map);
        }
        if (this._zoomOutButton) {
            on(this._zoomOutButton, 'click', map.zoomOut, map);
        }
        //TODO slider dot拖放缩放逻辑还没有实现
    }

    onRemove() {
        var map = this.getMap();
        if (this._zoomInButton) {
            off(this._zoomInButton, 'click', map.zoomIn, map);
        }
        if (this._zoomOutButton) {
            off(this._zoomOutButton, 'click', map.zoomOut, map);
        }
    }
}

Zoom.mergeOptions(options);

Map.mergeOptions({
    'zoomControl': false
});

Map.addOnLoadHook(function () {
    if (this.options['zoomControl']) {
        this.zoomControl = new Zoom(this.options['zoomControl']);
        this.addControl(this.zoomControl);
    }
});

export default Zoom;
