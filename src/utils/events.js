/**
*   基础抽象类，用于被继承
*   提供事件绑定注册，事件广播等基础函数
*   @author yellow date 2014/11/10
*   @class J.utils.Event
*   @inheritable
*/

import stamp from './stamp';
import splitWords from './splitWrods';
import noop from './noop';

let isString = (obj)=>{
    return true;
}

class events {

    /**
     * store the event's handler and context
     */
    _eventMap = {};

    /**
     * register one or more events with a handler function
     * @param {String} eventTypes eventTypes string,example "dragstart dragend touchclick";
     * @param {Function} handler the handler funciton,
     * @param {Object} [context] context.apply
     * @example 
     * obj.on("dragstart dragend",()=>{},obj);
     */
    on = (eventTypes, handler, context=null) => {
        //split event name
        if (eventTypes && isString(eventTypes)) {
            return this;
        }
        context = context || this;
        let eventNames =splitWords(eventTypes.toLowerCase()),
            eventName;

        for (let i = 0, len = eventNames.length; i < len; i++) {
            eventName = eventNames[i];
            this._eventMap[eventName] == this._eventMap[eventName] || [];
            let _eventMap = this._eventMap[eventName];
            for (let l = this._eventMap.length; l > 0; l--)
                if (handler === _eventMap.handler && context === _eventMap.context)
                    return this;
            _eventMap.push({
                handler: handler,
                context: context
            });
        }
        return this;
    }

    /**
     * 
     */
    off=(eventTypes,handler,context)=>{

    }


};

export default events;