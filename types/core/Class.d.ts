/**
 * This library uses ES2015 class system. <br />
 * Class is the root class of class hierachy. <br />
 * It provides utility methods to make it easier to manage configration options, merge mixins and add init hooks.
 * @example
 * var defaultOptions = {
 *     'foo' : 'bar'
 * };
 * class Foo extends maptalks.Class {
 *     constructor(id, options) {
 *         super(options);
 *         this.setId(id);
 *     }
 *
 *     setId(id) {
 *         this.id = id;
 *     }
 *
 *     whenCreated() {
 *         // .....
 *     }
 * }
 *
 * Foo.mergeOptions(defaultOptions);
 *
 * Foo.addInitHook('whenCreated');
 * @category core
 * @abstract
 */
declare class Class {
    _initHooksCalled: boolean;
    _isUpdatingOptions: boolean;
    options: object;
    /**
     * Create an object, set options if given and call all the init hooks.<br />
     * Options is where the object manages its configuration. Options passed to the object will be merged with parent's instead of overriding it.
     *
     * @param  {Object} options - options to set
     */
    constructor(options: object);
    proxyOptions(): this;
    /**
     * Visit and call all the init hooks defined on Class and its parents.
     * @return {Class} this
     */
    callInitHooks(): this;
    /**
     * Merges options with the default options of the object.
     * @param {Object} options - options to set
     * @return {Class} this
     */
    setOptions(options: any): this;
    /**
     * 1. Return object's options if no parameter is provided. <br/>
     *
     * 2. update an option and enable/disable the handler if a handler with the same name existed.
     * @example
     * // Get marker's options;
     * var options = marker.config();
     * // Set map's option "draggable" to false and disable map's draggable handler.
     * map.config('draggable', false);
     * // You can update more than one options like this:
     * map.config({
     *     'scrollWheelZoom' : false,
     *     'doubleClickZoom' : false
     * });
     * @param  {Object} conf - config to update
     * @return {Class} this
     */
    config(conf: any): {};
    /**
     * Default callback when config is called
     */
    onConfig(conf: any): void;
    _visitInitHooks(proto: any): void;
    /**
     * Add an init hook, which will be called when the object is initiated. <br>
     * It is useful in plugin developing to do things when creating objects without changing class's constructor.
     * @param {String|Function} fn - a hook function or name of the hook function
     * @param {Any[]} args         - arguments for the init hook function
     */
    static addInitHook(fn: any, ...args: any[]): typeof Class;
    /**
     * Mixin the specified objects into the class as prototype properties or methods.
     * @param  {...Object} sources - objects to mixin
     */
    static include(...sources: any[]): typeof Class;
    /**
     * Mixin options with the class's default options. <br />
     * @param  {Object} options - options to merge.
     */
    static mergeOptions(options: object): typeof Class;
}
export default Class;
