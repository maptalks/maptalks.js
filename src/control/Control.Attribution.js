import { createEl } from '../core/util/dom';
import { isString } from '../core/util';
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
    'position': { 'bottom' : 0, 'left' : 0 },
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
        this._attributionContainer = createEl('div');
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
        let content = this.options['content'];
        if (isString(content) && content.charAt(0) !== '<') {
            this._attributionContainer.className = 'maptalks-attribution';
            content = '<span style="padding:0px 4px">' + content + '</span>';
        }
        this._attributionContainer.innerHTML = content;
    }
}

Attribution.mergeOptions(options);

Map.mergeOptions({
    'attribution': false
});

Map.addOnLoadHook(function () {
    const a = this.options['attribution'] || this.options['attributionControl'];
    if (a) {
        this.attributionControl = new Attribution(a);
        this.addControl(this.attributionControl);
    }
});

export default Attribution;
