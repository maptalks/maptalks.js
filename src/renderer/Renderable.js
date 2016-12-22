/**
 * Common methods for classes can be rendered, e.g. Map, Layers
 * @mixin
 * @protected
 */
export const Renderable = {
    /**
     * Register a renderer class with the given name.
     * @param  {String} name  - renderer's register key
     * @param  {Function} clazz - renderer's class, a function (not necessarily a [Class]{@link Class}).
     * @static
     * @return {*} this
     */
    registerRenderer: function (name, clazz) {
        if (!this._regRenderers) {
            this._regRenderers = {};
        }
        this._regRenderers[name.toLowerCase()] = clazz;
        return this;
    },

    /**
     * Get the registered renderer class by the given name
     * @param  {String} name  - renderer's register key
     * @return {Function} renderer's class
     * @static
     */
    getRendererClass: function (name) {
        if (!this._regRenderers) {
            return null;
        }
        return this._regRenderers[name.toLowerCase()];
    }
};
