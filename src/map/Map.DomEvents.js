Z.Map.include({
    _registerDomEvents: function(remove) {
        var events = /**
                      * 触发mousedown事件
                      * @member maptalks.Map
                      * @event mousedown
                      */
                     'mousedown '+
                     /**
                      * 触发mouseup事件
                      * @member maptalks.Map
                      * @event mouseup
                      */
                     'mouseup '+
                     /**
                      * 触发mouseover事件
                      * @member maptalks.Map
                      * @event mouseover
                      */
                     'mouseover '+
                     /**
                      * 触发mouseout事件
                      * @member maptalks.Map
                      * @event mouseout
                      */
                     'mouseout '+
                     /**
                      * 触发mousemove事件
                      * @member maptalks.Map
                      * @event mousemove
                      */
                     'mousemove '+
                     /**
                      * 触发click事件
                      * @member maptalks.Map
                      * @event click
                      */
                     'click '+
                     /**
                      * 触发dblclick事件
                      * @member maptalks.Map
                      * @event dblclick
                      */
                     'dblclick '+
                     /**
                      * 触发contextmenu事件
                      * @member maptalks.Map
                      * @event contextmenu
                      */
                     'contextmenu '+
                     /**
                      * 触发keypress事件
                      * @member maptalks.Map
                      * @event keypress
                      */
                     'keypress '+
                     'touchstart '+
                     'touchmove '+
                     'touchend ';
        if (remove) {
            Z.DomUtil.removeDomEvent(this._containerDOM, events, this._handleDOMEvent);
        } else {
            Z.DomUtil.addDomEvent(this._containerDOM, events, this._handleDOMEvent, this);
        }

    },

    _handleDOMEvent: function (e) {
        var type = e.type;
        this._fireDOMEvent(this, e, type);
    },

    _parseEvent:function(e, type) {
        var eventParam = {
            'domEvent': e
        };
        if (type !== 'keypress') {
            var actual = e.touches ? e.touches[0] : e;
            if (actual) {
                var containerPoint = Z.DomUtil.getEventContainerPoint(actual, this._containerDOM);
                eventParam['coordinate'] = this.containerPointToCoordinate(containerPoint);
                eventParam['containerPoint'] = containerPoint;
                eventParam['viewPoint'] = this.containerPointToViewPoint(containerPoint);
            }
        }
        return eventParam;
    },

    _fireDOMEvent: function (target, e, type) {
        var eventParam = this._parseEvent(e, type);

        //阻止右键菜单
        if (type === 'contextmenu') {
            Z.DomUtil.preventDefault(e);
        }
        if (type === 'mousedown' || type === 'click') {
            var button = e.button;
            if (button === 2) {
                type = 'contextmenu';
            }
        }
        this._fireEvent(type, eventParam);
    }
});
