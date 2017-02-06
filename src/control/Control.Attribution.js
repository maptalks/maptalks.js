import { createEl } from '../core/util/dom';
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
    'position': 'bottom-left',
    'content': 'Powered By <a href="http://www.maptalks.org" target="_blank">maptalks</a>'
};

/**
 * @classdesc
 * A control to allows to display attribution content in a small text box on the map.
 * @category control
 * @extends control.Control
 * @memberOf control
 * @example
 * var attribution = new maptalks.control.Attribution({
 *     position : 'bottom-left',
 *     content : 'hello maptalks'
 * }).addTo(map);
 */
class Attribution extends Control {

    buildOn() {
        this._attributionContainer = createEl('div', 'maptalks-attribution');
        this._update();
        return this._attributionContainer;
    }

    /**
     * Set content of the attribution
     * @param {String} content - attribution content
     * @return {Attribution} this
     */
    setContent(content) {
        this.options['content'] = content;
        this._update();
        return this;
    }

    _update() {
        if (!this.getMap()) {
            return;
        }
        this._attributionContainer.innerHTML = this.options['content'];
    }
}

Attribution.mergeOptions(options);

Map.mergeOptions({
    'attributionControl': false
});

Map.addOnLoadHook(function () {
    if (this.options['attributionControl']) {
        this.attributionControl = new Attribution(this.options['attributionControl']);
        this.addControl(this.attributionControl);
    }
});

export default Attribution;
