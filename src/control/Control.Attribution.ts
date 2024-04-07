import { createEl } from '../core/util/dom';
import Control from './Control';
import Map from '../map/Map';

/**
 * @property {Object} options - options
 * @property {Object} [options.position='bottom-left'] - position of the control, this option defined in [Control.position]{@link Control#positions}.
 * @property {String} [options.content='Powered by <a href="http://maptalks.org" target="_blank">maptalks</a>']  - content of the attribution control, HTML format
 * @memberOf control.Attribution
 * @instance
 */
const options = {
    'position': {
        'bottom': 0,
        'left': 0
    },
    'content': '<a href="http://maptalks.org" target="_blank">maptalks</a>'
};

const layerEvents = 'addlayer removelayer setbaselayer baselayerremove';

/**
 * @classdesc
 * A control to allows to display attribution content in a small text box on the map.
 * @category control
 * @extends control.Control
 * @memberOf control
 * @example
 * var map = new maptalks.Map('map', {
 *    center: [-0.113049, 51.498568],
 *    zoom: 14,
 *    attribution: {
 *       content : 'my attribution',
 *       position : 'bottom-left'
 *    },
 *    baseLayer: new maptalks.TileLayer('base', {
 *        urlTemplate: 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
 *        subdomains: ['a','b','c','d'],
 *        attribution: '&copy; <a href="http://osm.org">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/">CARTO</a>'
 *    })
 * });
 * map.addLayer(new maptalks.TileLayer('base', {
 *      urlTemplate: 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
 *      subdomains: ['a','b','c','d'],
 *      attribution: '&copy; <a href="http://osm.org">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/">CARTO</a>'
 * }));
 */
class Attribution extends Control {

    buildOn() {
        this._attributionContainer = createEl('div');
        this._attributionContainer.className = 'maptalks-attribution';
        this._update();
        return this._attributionContainer;
    }

    onAdd() {
        this.getMap().on(layerEvents, this._update, this);
    }

    onRemove() {
        this.getMap().off(layerEvents, this._update, this);
    }

    _update() {
        const map = this.getMap();
        if (!map) {
            return;
        }

        const attributions = map
            ._getLayers(layer => layer.options['attribution'])
            .reverse()
            .map(layer => layer.options['attribution']);
        const content = this.options['content'] + (attributions.length > 0 ? ' - ' + attributions.join(', ') : '');
        this._attributionContainer.innerHTML = '<span style="padding:0px 4px">' + content + '</span>';
    }
}

Attribution.mergeOptions(options);

Map.mergeOptions({
    'attribution': true
});

Map.addOnLoadHook(function () {
    const a = this.options['attribution'] || this.options['attributionControl'];
    if (a) {
        this.attributionControl = new Attribution(a);
        this.addControl(this.attributionControl);
    }
});

export default Attribution;
