import Class from 'core/class';
import Eventable from 'core/Event';

/**
 * Base class for all the interaction handlers
 * @class
 * @category handler
 * @extends Class
 * @mixins Eventable
 * @abstract
 * @protected
 */
const Handler = Class.extend(/** @lends Handler.prototype */ {
    includes: Eventable,

    initialize: function (target) {
        this.target = target;
    },

    /**
     * Enables the handler
     * @return {Handler} this
     */
    enable: function () {
        if (this._enabled) {
            return this;
        }
        this._enabled = true;
        this.addHooks();
        return this;
    },

    /**
     * Disablesthe handler
     * @return {Handler} this
     */
    disable: function () {
        if (!this._enabled) {
            return this;
        }
        this._enabled = false;
        this.removeHooks();
        return this;
    },

    /**
     * Returns true if the handler is enabled.
     * @return {Boolean}
     */
    enabled: function () {
        return !!this._enabled;
    },

    remove: function () {
        this.disable();
        delete this.target;
        delete this.dom;
    }
});

export default Handler;
