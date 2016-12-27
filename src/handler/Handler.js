/**
 * Base class for all the interaction handlers
 * @class
 * @category handler
 * @extends maptalks.Class
 * @mixins maptalks.Eventable
 * @abstract
 * @protected
 */
maptalks.Handler = maptalks.Class.extend(/** @lends maptalks.Handler.prototype */{

    includes: maptalks.Eventable,

    initialize: function (target) {
        this.target = target;
    },

    /**
     * Enables the handler
     * @return {maptalks.Handler} this
     */
    enable: function () {
        if (this._enabled) { return this; }
        this._enabled = true;
        this.addHooks();
        return this;
    },

    /**
     * Disablesthe handler
     * @return {maptalks.Handler} this
     */
    disable: function () {
        if (!this._enabled) { return this; }
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
