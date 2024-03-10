type Constructor = new (...args: any[]) => {};
/**
 * @ts-ignore
 * A mixin, to enable a class with [interaction handlers]{@link Handler}
 * @protected
 * @category handler
 * @mixin Handlerable
 */
declare function Handlerable<TBase extends Constructor>(Base: TBase): {
    new (...args: any[]): {
        _handlers: Array<any>;
        /**
               * Register a handler
               * @param {String} name       - name of the handler
               * @param {Handler}           - handler class
               * @return {*} this
               * @protected
               * @function Handerable.addHandler
               */
        addHandler(name: any, handlerClass: any): any;
        /**
         * Removes a handler
         * @param {String} name       - name of the handler
         * @return {*} this
         * @protected
         * @function Handerable.removeHandler
         */
        removeHandler(name: any): any;
        _clearHandlers(): void;
    };
} & TBase;
export default Handlerable;
