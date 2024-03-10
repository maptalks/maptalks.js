type Constructor = new (...args: any[]) => {};
/**
 * A helper mixin for JSON serialization.
 * @mixin JSONAble
 */
declare function JSONAble<TBase extends Constructor>(Base: TBase): {
    new (...args: any[]): {
        _jsonType: string;
        /**
         * Get object's JSON Type
         * @return {String}
         * @function JSONAble.getJSONType
         */
        getJSONType(): string;
    };
    /**
     * It is a static method. <br>
     * Register layer for JSON serialization and assign a JSON type.
     * @param  {String} type - JSON type
     * @function JSONAble.registerJSONType
     */
    registerJSONType(type: string): any & TBase;
    /**
     * It is a static method. <br>
     * Get class of input JSON type
     * @param  {String} type - JSON type
     * @return {Class}      Class
     * @function JSONAble.getJSONClass
     */
    getJSONClass(type: string): any;
} & TBase;
export default JSONAble;
