import { createEl, on } from '../core/util/dom';
import Control from './Control';

/**
 * @property {Object}   options - options
 * @property {String|Object}   [options.position="top-left"]  - position of the rest control.
 * @memberOf control.Reset
 * @instance
 * @example
 * var resetControl = new Reset({
 *     position : 'top-left',
 * }).addTo(map);
 */

const options = {
    position: 'top-left',
    view: null
};

class Reset extends Control {
    /**
     * method to build DOM of the control
     * @param  {Map} map map to build on
     * @return {HTMLDOMElement}
     */
    buildOn() {
        const reset = this._getReset();
        this._reset = reset;

        this._registerDomEvents();

        return reset;
    }

    onAdd() {
        this._view = !this.options.view ? this.getMap().getView() : this.options.view;
    }

    setView(view) {
        this._view = view;
    }

    _getReset() {
        const reset = createEl('div', 'maptalks-reset');
        return reset;
    }

    _registerDomEvents() {
        on(this._reset, 'click', this._resetView, this);
    }

    onRemove() {
        this.getMap().off('animating mousemove touchmove', this._rotateCompass, this);
        delete this._reset;
        delete this._view;
    }

    _resetView() {
        this.getMap().setView(this._view);
    }
}

Reset.mergeOptions(options);

export default Reset;
