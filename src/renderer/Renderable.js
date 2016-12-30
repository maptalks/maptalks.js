/**
 * Common methods for classes can be rendered, e.g. Map, Layers
 * @mixin
 * @protected
 */
const Renderable = Base => class extends Base {
    /**
     * Register a renderer class with the given name.
     * @param  {String} name  - renderer's register key
     * @param  {Function} clazz - renderer's class, a function (not necessarily a [Class]{@link Class}).
     * @static
     * @return {*} this
     */
    static registerRenderer(name, clazz) {
        const proto = this.prototype;
        const parentProto = Object.getPrototypeOf(proto);
        if (!proto._rendererClasses || proto._rendererClasses === parentProto._rendererClasses) {
            proto._rendererClasses = proto._rendererClasses ? Object.create(proto._rendererClasses) : {};
        }
        proto._rendererClasses[name.toLowerCase()] = clazz;
        return this;
    }

    /**
     * Get the registered renderer class by the given name
     * @param  {String} name  - renderer's register key
     * @return {Function} renderer's class
     * @static
     */
    static getRendererClass(name) {
        const proto = this.prototype;
        if (!proto._rendererClasses) {
            return null;
        }
        return proto._rendererClasses[name.toLowerCase()];
    }
}

export default Renderable;
export { Renderable };
