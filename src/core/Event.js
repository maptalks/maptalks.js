/**
 * This provides methods used for event handling. It's a mixin and not meant to be used directly.
 * @mixin
 */
Z.Eventable = {
    /**
     * Register a handler function to be called whenever this event is fired.
     *
     * @param {String} eventTypeArr     - event types to register, seperated by space if more than one.
     * @param {Function} handler                 - handler function to be called
     * @param {Object} [context=null]            - the context of the handler
     * @return {*} this
     * @instance
     */
    on: function(eventTypeArr, handler, context) {
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
     * Same as on, except the listener will only get fired once and then removed.
     *
     * @param {String} eventTypeArr     - event types to register, seperated by space if more than one.
     * @param {Function} handler                 - listener handler
     * @param {Object} [context=null]            - the context of the handler
     * @return {*} this
     * @instance
     */
    once: function(eventTypeArr, handler, context) {
        var me = this;
        function onceHandler() {
            handler.call(this, arguments);
            me.off(eventTypeArr, onceHandler, context);
        }
        return this.on(eventTypeArr, onceHandler, context);
    },

    /**
     * Unregister the event handler for the specified event types.
     *
     * @param {String} eventTypeArr    - event types to unregister, seperated by space if more than one.
     * @param {Function} handler                - listener handler
     * @param {Object} [context=null]           - the context of the handler
     * @return {*} this
     * @instance
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
     * Returns true if any listener registered for the event type.
     *
     * @param {String} eventType - event type
     * @return {Boolean}
     * @instance
     */
    listens:function(eventType) {
        if (!this._eventMap || !Z.Util.isString(eventType)) {return 0;}
        var handlerChain =  this._eventMap[eventType.toLowerCase()];
        if (!handlerChain) {return 0;}
        return handlerChain.length;
    },

   /**
    * Copy all the event listener to the target object
    * @param {Object} target - target object to copy to.
    * @return {*} this
    * @instance
    */
    copyEventListeners: function(target) {
        var eventMap = target._eventMap;
        if(!eventMap) {return this;}
        for (var eventType in eventMap) {
            var handlerChain = eventMap[eventType];
            for(var i=0,len=handlerChain.length;i<len;i++) {
                if (handlerChain[i].del) {
                    continue;
                }
                this.on(eventType, handlerChain[i].handler, handlerChain[i].context);
            }
        }
        return this;
    },

    /**
     * Fire an event, causing all handlers for that event name to run.
     *
     * @param  {String} eventType - an event type to fire
     * @param  {Object} param     - parameters for the listener function.
     * @return {*} this
     * @instance
     */
    fire:function(eventType, param) {
        if (!this._eventMap) {return this;}
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

            param['type'] = eventType;
            param['target'] = this;
            var bubble = true;
            if (context) {
                bubble = handlerChain[i].handler.call(context,param);
            } else {
                bubble = handlerChain[i].handler(param);
            }
            //stops the event propagation if the handler returns false.
            if (false === bubble) {
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

/**
* Alias for [on]{@link maptalks.Eventable.on}
*
* @param {String} eventTypeArr     - event types to register, seperated by space if more than one.
* @param {Function} handler                 - handler function to be called
* @param {Object} [context=null]            - the context of the handler
* @return {*} this
* @function
* @instance
* @memberOf maptalks.Eventable
* @name addEventListener
*/
Z.Eventable.addEventListener = Z.Eventable.on;
/**
 * Alias for [off]{@link maptalks.Eventable.off}
 *
 * @param {String} eventTypeArr    - event types to unregister, seperated by space if more than one.
 * @param {Function} handler                - listener handler
 * @param {Object} [context=null]           - the context of the handler
 * @return {*} this
 * @function
 * @instance
 * @memberOf maptalks.Eventable
 * @name removeEventListener
 */
Z.Eventable.removeEventListener = Z.Eventable.off;
