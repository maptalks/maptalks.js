/**
 * 事件处理机制,为需要的类添加事件处理机制
 * @class maptalks.Eventable
 * @author Maptalks Team
 */
Z.Eventable = {
    /**
     * 添加事件
     * @param {String} eventTypeArr 事件名字符串，多个事件名用空格分开
     * @param {Function} handler 事件触发后的回调函数
     * @param {Object} context 上下文对象
     * @return {Object} 上下文对象
     */
    on:function(eventTypeArr, handler, context) {
        if (!eventTypeArr || !handler) {return this;}
        if (!this._eventMap) {
            this._eventMap = {};
        }
        var eventTypes = eventTypeArr.split(' ');
        var eventType;
        if(!context) {context = this;}
        for (var j = 0, jl = eventTypes.length; j <jl; j++) {
            eventType = eventTypes[j].toLowerCase();
            var handlerChain = this._eventMap[eventType];
            if (!handlerChain) {
                handlerChain = [];
                this._eventMap[eventType]=handlerChain;
            }
            for (var i=0, len=handlerChain.length;i<len;i++) {
                if (handler == handlerChain[i].handler) {
                    if (!handlerChain[i].del && ((context && handlerChain[i].context === context) || (Z.Util.isNil(context) && Z.Util.isNil(handlerChain[i].context)))) {
                        return this;
                    }
                }
            }
            handlerChain.push({
                handler:handler,
                context:context
            });
        }
        return this;
    },

    /**
     * 删除事件
     * @param {String} eventTypeArr 事件名字符串，多个事件名用空格分开
     * @param {Function} handler 事件触发后的回调函数
     * @param {Object} context 上下文对象
     * @return {Object} 上下文对象
     */
    off:function(eventTypeArr, handler, context) {
        if (!eventTypeArr || !this._eventMap || !handler) {return this;}
        var eventTypes = eventTypeArr.split(' ');
        var eventType;
        if(!context) {context = this;}
        for (var j = 0, jl = eventTypes.length; j <jl; j++) {
            eventType = eventTypes[j].toLowerCase();
            var handlerChain =  this._eventMap[eventType];
            if (!handlerChain) {return this;}
            for (var i=0, len= handlerChain.length;i<len;i++) {
                if (handler == handlerChain[i].handler) {
                    if ((context && (handlerChain[i].context == context)) || Z.Util.isNil(context)) {
                        handlerChain[i].del = true;
                    }
                }
            }
        }
        return this;
    },

    _clearListeners:function(eventType) {
        if (!this._eventMap || !Z.Util.isString(eventType)) {return;}
        var handlerChain =  this._eventMap[eventType.toLowerCase()];
        if (!handlerChain) {return;}
        this._eventMap[eventType] = null;
    },

    _clearAllListeners:function() {
        this._eventMap = null;
    },

    /**
     * 判断当前对象上是否绑定了某种类型的监听事件
     * @param {String} eventType 事件名
     * @return {Boolean} true,绑定了事件
     */
    hasListeners:function(eventType) {
        if (!this._eventMap || !Z.Util.isString(eventType)) {return 0;}
        var handlerChain =  this._eventMap[eventType.toLowerCase()];
        if (!handlerChain) {return 0;}
        return handlerChain.length;
    },

   /**
    * copy event listener from target object
    * @param {Object} target
    */
    copyEventListener: function(target) {
        var eventMap = target._eventMap;
        if(!eventMap) {return this;}
        for (var eventType in eventMap) {
            var events = eventMap[eventType];
            for(var i=0,len=events.length;i<len;i++) {
                this.on(eventType, events[i].handler, events[i].context);
            }
        }
        return this;
    },

    fire:function(eventType, param) {
        if (!this._eventMap) {return this;}
        //if (!this.hasListeners(eventType)) {return;}
        var handlerChain = this._eventMap[eventType.toLowerCase()];
        if (!handlerChain) {return this;}
        if (!param) {
            param = {};
        }
        var delhits = [];
        for (var i=0, len = handlerChain.length;i<len; i++) {
            if (!handlerChain[i]) {continue;}
            if (handlerChain[i].del) {
                continue;
            }
            var context = handlerChain[i].context;
            //增加type和target参数, 表示事件类型和事件源对象
            param['type'] = eventType;
            param['target'] = this;
            var bubble = true;
            if (context) {
                bubble = handlerChain[i].handler.call(context,param);
            } else {
                bubble = handlerChain[i].handler(param);
            }
            if (!bubble) {
                if (param['domEvent']) {
                    Z.DomUtil.stopPropagation(param['domEvent']);
                }
            }
        }
        for (i=0, len = handlerChain.length;i<len; i++) {
            if (!handlerChain[i]) {continue;}
            if (handlerChain[i].del) {
                delhits.push(i);
                continue;
            }
        }
        if (delhits.length > 0) {
            for (len=delhits.length, i=len-1;i>=0;i--) {
                handlerChain.splice(delhits[i],1);
            }
        }
        return this;
    }
};


Z.Eventable.once = function(eventTypeArr, handler, context) {
    var me = this;
    function onceHandler() {
        handler.call(this, arguments);
        me.off(eventTypeArr, onceHandler, context);
    }
    return this.on(eventTypeArr, onceHandler, context);
}
