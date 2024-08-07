import { MixinConstructor } from "../types/typings";

export type HandlerFnResultType = {
    type: string;
    target: any;
    [propName: string]: any;
}

export type BaseEventParamsType = {
    type?: string,
    target?: any;
    [propName: string]: any;
};


export type HandlerFn = (result?: HandlerFnResultType) => void | boolean;

export default function <T extends MixinConstructor>(Base: T) {
    return class EventableMixin extends Base {
        //@internal
        _events: Record<string, BaseEventParamsType>
        on(type: string, handler: HandlerFn) {
            if (!this._events) {
                this._events = {
                    type : [handler]
                };
            }
            this._events[type] = this._events[type] || [];
            this._events[type].push(handler);
            return this;
        }
        once(type: string, handler: HandlerFn) {
            return this.on(type, this._wrapOnce(type, handler));
        }
        off(type: string, handler: HandlerFn) {
            if (!this._events || !this._events[type]) {
                return this;
            }
            this._events[type].splice(this._events[type].indexOf(handler), 1);
            return this;
        }
        fire(type: string, params: BaseEventParamsType = {}) {
            if (!this._events || !this._events[type]) {
                return this;
            }
            if (!params.target) {
                params.target = this;
            }
            const queue = this._events[type].slice(0);
            for (const p of queue) {
                p(params);
            }
            return this;
        }
        //@internal
        _wrapOnce(type: string, handler: HandlerFn) {
            const self = this;
            let called = false;
            const fn = function onceHandler(params) {
                if (called) {
                    return;
                }
                called = true;
                handler(params);
                self.off(type, onceHandler);
            };
            return fn;
        }
    };
}
