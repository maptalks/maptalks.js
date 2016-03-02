Z.Map.include(/** @lends maptalks.Map.prototype */{
    _registerDomEvents: function(remove) {
        var events = /**
                      * mousedown event
                      * @event mousedown
                      * @type {Object}
                      * @property {String} type                    - mousedown
                      * @property {String} target                  - the map fires event
                      * @property {maptalks.Coordinate} coordinate - coordinate of the event
                      * @property {maptalks.Point} containerPoint  - container point of the event
                      * @property {maptalks.Point} viewPoint       - view point of the event
                      * @property {Event} domEvent                 - dom event
                      */
                     'mousedown '+
                     /**
                      * mouseup event
                      * @event mouseup
                      * @type {Object}
                      * @property {String} type                    - mouseup
                      * @property {String} target                  - the map fires event
                      * @property {maptalks.Coordinate} coordinate - coordinate of the event
                      * @property {maptalks.Point} containerPoint  - container point of the event
                      * @property {maptalks.Point} viewPoint       - view point of the event
                      * @property {Event} domEvent                 - dom event
                      */
                     'mouseup '+
                     /**
                      * mouseover event
                      * @event mouseover
                      * @type {Object}
                      * @property {String} type                    - mouseover
                      * @property {String} target                  - the map fires event
                      * @property {maptalks.Coordinate} coordinate - coordinate of the event
                      * @property {maptalks.Point} containerPoint  - container point of the event
                      * @property {maptalks.Point} viewPoint       - view point of the event
                      * @property {Event} domEvent                 - dom event
                      */
                     'mouseover '+
                     /**
                      * mouseout event
                      * @event mouseout
                      * @type {Object}
                      * @property {String} type                    - mouseout
                      * @property {String} target                  - the map fires event
                      * @property {maptalks.Coordinate} coordinate - coordinate of the event
                      * @property {maptalks.Point} containerPoint  - container point of the event
                      * @property {maptalks.Point} viewPoint       - view point of the event
                      * @property {Event} domEvent                 - dom event
                      */
                     'mouseout '+
                     /**
                      * mousemove event
                      * @event mousemove
                      * @type {Object}
                      * @property {String} type                    - mousemove
                      * @property {String} target                  - the map fires event
                      * @property {maptalks.Coordinate} coordinate - coordinate of the event
                      * @property {maptalks.Point} containerPoint  - container point of the event
                      * @property {maptalks.Point} viewPoint       - view point of the event
                      * @property {Event} domEvent                 - dom event
                      */
                     'mousemove '+
                     /**
                      * click event
                      * @event click
                      * @type {Object}
                      * @property {String} type                    - click
                      * @property {String} target                  - the map fires event
                      * @property {maptalks.Coordinate} coordinate - coordinate of the event
                      * @property {maptalks.Point} containerPoint  - container point of the event
                      * @property {maptalks.Point} viewPoint       - view point of the event
                      * @property {Event} domEvent                 - dom event
                      */
                     'click '+
                     /**
                      * dblclick event
                      * @event dblclick
                      * @type {Object}
                      * @property {String} type                    - dblclick
                      * @property {String} target                  - the map fires event
                      * @property {maptalks.Coordinate} coordinate - coordinate of the event
                      * @property {maptalks.Point} containerPoint  - container point of the event
                      * @property {maptalks.Point} viewPoint       - view point of the event
                      * @property {Event} domEvent                 - dom event
                      */
                     'dblclick '+
                     /**
                      * contextmenu event
                      * @event contextmenu
                      * @type {Object}
                      * @property {String} type                    - contextmenu
                      * @property {String} target                  - the map fires event
                      * @property {maptalks.Coordinate} coordinate - coordinate of the event
                      * @property {maptalks.Point} containerPoint  - container point of the event
                      * @property {maptalks.Point} viewPoint       - view point of the event
                      * @property {Event} domEvent                 - dom event
                      */
                     'contextmenu '+
                     /**
                      * keypress event
                      * @event keypress
                      * @type {Object}
                      * @property {String} type                    - keypress
                      * @property {String} target                  - the map fires event
                      * @property {maptalks.Coordinate} coordinate - coordinate of the event
                      * @property {maptalks.Point} containerPoint  - container point of the event
                      * @property {maptalks.Point} viewPoint       - view point of the event
                      * @property {Event} domEvent                 - dom event
                      */
                     'keypress '+
                     /**
                      * touchstart event
                      * @event touchstart
                      * @type {Object}
                      * @property {String} type                    - touchstart
                      * @property {String} target                  - the map fires event
                      * @property {maptalks.Coordinate} coordinate - coordinate of the event
                      * @property {maptalks.Point} containerPoint  - container point of the event
                      * @property {maptalks.Point} viewPoint       - view point of the event
                      * @property {Event} domEvent                 - dom event
                      */
                     'touchstart '+
                     /**
                      * touchmove event
                      * @event touchmove
                      * @type {Object}
                      * @property {String} type                    - touchmove
                      * @property {String} target                  - the map fires event
                      * @property {maptalks.Coordinate} coordinate - coordinate of the event
                      * @property {maptalks.Point} containerPoint  - container point of the event
                      * @property {maptalks.Point} viewPoint       - view point of the event
                      * @property {Event} domEvent                 - dom event
                      */
                     'touchmove '+
                     /**
                      * touchend event
                      * @event touchend
                      * @type {Object}
                      * @property {String} type                    - touchend
                      * @property {String} target                  - the map fires event
                      * @property {maptalks.Coordinate} coordinate - coordinate of the event
                      * @property {maptalks.Point} containerPoint  - container point of the event
                      * @property {maptalks.Point} viewPoint       - view point of the event
                      * @property {Event} domEvent                 - dom event
                      */
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
