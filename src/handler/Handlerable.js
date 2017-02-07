import { indexOfArray } from 'core/util';

/**
 * A mixin, to enable a class with [interaction handlers]{@link Handler}
 * @protected
 * @category handler
 * @mixin Handlerable
 */
export default function (Base) {
    return class extends Base {
        /**
         * Register a handler
         * @param {String} name       - name of the handler
         * @param {Handler}           - handler class
         * @return {*} this
         * @protected
         * @function Handerable.addHandler
         */
        addHandler(name, handlerClass) {
            if (!handlerClass) {
                return this;
            }
            if (!this._handlers) {
                this._handlers = [];
            }
            //handler已经存在
            if (this[name]) {
                this[name].enable();
                return this;
            }

            var handler = this[name] = new handlerClass(this);

            this._handlers.push(handler);

            if (this.options[name]) {
                handler.enable();
            }
            return this;
        }

        /**
         * Removes a handler
         * @param {String} name       - name of the handler
         * @return {*} this
         * @protected
         * @function Handerable.removeHandler
         */
        removeHandler(name) {
            if (!name) {
                return this;
            }
            var handler = this[name];
            if (handler) {
                //handler registered
                var hit = indexOfArray(handler, this._handlers);
                if (hit >= 0) {
                    this._handlers.splice(hit, 1);
                }
                this[name].remove();
                delete this[name];
            }
            return this;
        }

        _clearHandlers() {
            for (var i = 0, len = this._handlers.length; i < len; i++) {
                this._handlers[i].remove();
            }
            this._handlers = [];
        }
    };
}
