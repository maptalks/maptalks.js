import Eventable from '../core/Eventable';

/**
 * Base class for all the interaction handlers
 * @category handler
 * @abstract
 * @protected
 */
class Handler {
    target: any;
    dom?: HTMLElement;
    _enabled: boolean;

    constructor(target: any) {
        this.target = target;
    }

    addHooks(): void {}
    removeHooks(): void {}

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

// cheats to ts compiler
class HandlerMixin extends Eventable(Handler) {

}

export default HandlerMixin;
