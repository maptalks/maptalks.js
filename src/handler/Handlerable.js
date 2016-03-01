/**
 * A mixin, to enable a class with [interaction handlers]{@link maptalks.Handler}
 * @protected
 * @mixin
 */
Z.Handlerable = {
    /**
     * Register a handler
     * @param {String} name       - name of the handler
     * @param {maptalks.Handler}  - handler class
     * @return {*} this
     */
    addHandler: function (name, handlerClass) {
        if (!handlerClass) { return this; }
        if (!this._handlers) {
            this._handlers = [];
        }
        //handler已经存在
        if (this[name]) {
            this[name].enable();
            return;
        }

        var handler = this[name] = new handlerClass(this);

        this._handlers.push(handler);

        if (this.options[name]) {
            handler.enable();
        }
        return this;
    },

    /**
     * Removes a handler
     * @param {String} name       - name of the handler
     * @return {*} this
     */
    removeHandler: function(name) {
        if (!name) {return this;}
        var handler = this[name];
        if (handler) {
            //handler registered
            var hit = Z.Util.searchInArray(handler,this._handlers);
            if (hit >= 0) {
                this._handlers.splice(hit,1);
            }
            this[name].disable();
            delete this[name];
        }
        return this;
    },

    _clearHandlers: function () {
        for (var i = 0, len = this._handlers.length; i < len; i++) {
            this._handlers[i].disable();
        }
    }
};
