/**
 * Handler总线, 通过include,使类拥有handler的处理能力
 * @type {Object}
 */
Z.Handlerable = {
    /**
     * [addHandler description]
     * @param {[type]} name         [description]
     * @param {[type]} HandlerClass [description]
     * @expose
     */
    addHandler: function (name, HandlerClass) {
        if (!HandlerClass) { return this; }
        if (!this._handlers) {
            this._handlers = [];
        }
        //handler已经存在
        if (this[name]) {
            this[name].enable();
            return;
        }

        var handler = this[name] = new HandlerClass(this);

        this._handlers.push(handler);

        if (this.options[name]) {
            handler.enable();
        }
        return this;
    },

    removeHandler: function(name) {
        if (!name) {return this;}
        //handler已经存在
        var handler = this[name];
        if (handler) {
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
