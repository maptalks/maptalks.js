import { createEl } from '../core/util/dom';
import { isString } from 'core/util';
import Control from './Control';
import Map from '../map/Map';

/**
 * @property {Object} options - options
 * @property {Object} [options.position='bottom-left'] - position of the control
 * @property {String} [options.content='Powered By <a href="http://www.org" target="_blank">maptalks</a>']  - content of the attribution control, HTML format
 * @memberOf control.Attribution
 * @instance
 */
const options = {
    'position': {
        'bottom': 0,
        'left': 0
    },
    'content': 'Powered By <a href="http://www.maptalks.org" target="_blank">maptalks</a>'
};

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
 *    attribution: true, // default to true
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
        this._update();
        return this._attributionContainer;
    }

    onAdd() {
        this.getMap().on('addlayer removelayer setbaselayer baselayerremove', this._update, this);
    }

    _update() {
        if (!this.getMap()) {
            return;
        }
        let hasAttrLayers = [];
        const baseLayer = this.getMap().getBaseLayer();
        if (baseLayer) {
            const attrBaseLayer = baseLayer.options['attribution'] ? baseLayer : null;
            if (attrBaseLayer) {
                hasAttrLayers.push(attrBaseLayer);
            }
        }
        const attrLayers = this.getMap().getLayers(function (layer) {
            return (layer.options['attribution']);
        });
        hasAttrLayers = hasAttrLayers.concat(attrLayers);
        this.options['content'] = 'Powered By <a href="http://www.maptalks.org" target="_blank">maptalks</a>';
        if (hasAttrLayers.length > 0) {
            for (const layer of hasAttrLayers) {
                this.options['content'] += layer.options['attribution'];
            }
        }
        const tempContent = this.options['content'];
        let content = '';
        if (isString(tempContent) && tempContent.charAt(0) !== '<') {
            this._attributionContainer.className = 'maptalks-attribution';
            content = '<span style="padding:0px 4px">' + tempContent + '</span>';
        }
        this._attributionContainer.innerHTML = content;
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
