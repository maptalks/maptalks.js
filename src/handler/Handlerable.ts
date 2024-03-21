import { MixinConstructor } from "../core/Mixin";
import Handler from "./Handler";

/**
 * A mixin, to enable a class with [interaction handlers]{@link Handler}
 * @protected
 * @category handler
 * @mixin Handlerable
 */
export default function <T extends MixinConstructor>(Base: T) {

    return class Handlerable extends Base {
        _handlers?: Handler[];
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

            const handler = this[name] = new handlerClass(this);

            this._handlers.push(handler);

            if ((this as any).options[name]) {
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
            const handler = this[name];
            if (handler) {
                //handler registered
                const hit = this._handlers.indexOf(handler);
                if (hit >= 0) {
                    this._handlers.splice(hit, 1);
                }
                this[name].remove();
                delete this[name];
            }
            return this;
        }

        _clearHandlers() {
            for (let i = 0, len = this._handlers.length; i < len; i++) {
                this._handlers[i].remove();
            }
            this._handlers = [];
        }
    };
}
