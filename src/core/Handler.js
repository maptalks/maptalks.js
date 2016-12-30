import Eventable from 'core/Event';

class Handler {
    constructor(target) {
        this.target = target;
    }

    /**
     * Enables the handler
     * @return {Handler} this
     */
    enable() {
        if (this._enabled) {
            return this;
        }
        this._enabled = true;
        this.addHooks();
        return this;
    }

    /**
     * Disablesthe handler
     * @return {Handler} this
     */
    disable() {
        if (!this._enabled) {
            return this;
        }
        this._enabled = false;
        this.removeHooks();
        return this;
    }

    /**
     * Returns true if the handler is enabled.
     * @return {Boolean}
     */
    enabled() {
        return !!this._enabled;
    }

    remove() {
        this.disable();
        delete this.target;
        delete this.dom;
    }
}

/**
 * Base class for all the interaction handlers
 * @class
 * @category handler
 * @extends Class
 * @mixins Eventable
 * @abstract
 * @protected
 */
export default class extends Eventable(Handler) {


}
