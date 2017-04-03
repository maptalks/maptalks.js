import { now } from 'core/util';
import {
    addDomEvent,
    removeDomEvent,
    preventDefault,
    getEventContainerPoint
} from 'core/util/dom';
import Map from './Map';

Map.include(/** @lends Map.prototype */ {
    _registerDomEvents: function (remove) {
        const events =
            /**
             * mousedown event
             * @event Map#mousedown
             * @type {Object}
             * @property {String} type                    - mousedown
             * @property {Map} target            - the map fires event
             * @property {Coordinate} coordinate - coordinate of the event
             * @property {Point} containerPoint  - container point of the event
             * @property {Point} viewPoint       - view point of the event
             * @property {Event} domEvent                 - dom event
             */
            'mousedown ' +
            /**
             * mouseup event
             * @event Map#mouseup
             * @type {Object}
             * @property {String} type                    - mouseup
             * @property {Map} target            - the map fires event
             * @property {Coordinate} coordinate - coordinate of the event
             * @property {Point} containerPoint  - container point of the event
             * @property {Point} viewPoint       - view point of the event
             * @property {Event} domEvent                 - dom event
             */
            'mouseup ' +
            /**
             * mouseover event
             * @event Map#mouseover
             * @type {Object}
             * @property {String} type                    - mouseover
             * @property {Map} target            - the map fires event
             * @property {Coordinate} coordinate - coordinate of the event
             * @property {Point} containerPoint  - container point of the event
             * @property {Point} viewPoint       - view point of the event
             * @property {Event} domEvent                 - dom event
             */
            'mouseover ' +
            /**
             * mouseout event
             * @event Map#mouseout
             * @type {Object}
             * @property {String} type                    - mouseout
             * @property {Map} target            - the map fires event
             * @property {Coordinate} coordinate - coordinate of the event
             * @property {Point} containerPoint  - container point of the event
             * @property {Point} viewPoint       - view point of the event
             * @property {Event} domEvent                 - dom event
             */
            'mouseout ' +
            /**
             * mousemove event
             * @event Map#mousemove
             * @type {Object}
             * @property {String} type                    - mousemove
             * @property {Map} target            - the map fires event
             * @property {Coordinate} coordinate - coordinate of the event
             * @property {Point} containerPoint  - container point of the event
             * @property {Point} viewPoint       - view point of the event
             * @property {Event} domEvent                 - dom event
             */
            'mousemove ' +
            /**
             * click event
             * @event Map#click
             * @type {Object}
             * @property {String} type                    - click
             * @property {Map} target            - the map fires event
             * @property {Coordinate} coordinate - coordinate of the event
             * @property {Point} containerPoint  - container point of the event
             * @property {Point} viewPoint       - view point of the event
             * @property {Event} domEvent                 - dom event
             */
            'click ' +
            /**
             * dblclick event
             * @event Map#dblclick
             * @type {Object}
             * @property {String} type                    - dblclick
             * @property {Map} target            - the map fires event
             * @property {Coordinate} coordinate - coordinate of the event
             * @property {Point} containerPoint  - container point of the event
             * @property {Point} viewPoint       - view point of the event
             * @property {Event} domEvent                 - dom event
             */
            'dblclick ' +
            /**
             * contextmenu event
             * @event Map#contextmenu
             * @type {Object}
             * @property {String} type                    - contextmenu
             * @property {Map} target            - the map fires event
             * @property {Coordinate} coordinate - coordinate of the event
             * @property {Point} containerPoint  - container point of the event
             * @property {Point} viewPoint       - view point of the event
             * @property {Event} domEvent                 - dom event
             */
            'contextmenu ' +
            /**
             * keypress event
             * @event Map#keypress
             * @type {Object}
             * @property {String} type                    - keypress
             * @property {Map} target            - the map fires event
             * @property {Coordinate} coordinate - coordinate of the event
             * @property {Point} containerPoint  - container point of the event
             * @property {Point} viewPoint       - view point of the event
             * @property {Event} domEvent                 - dom event
             */
            'keypress ' +
            /**
             * touchstart event
             * @event Map#touchstart
             * @type {Object}
             * @property {String} type                    - touchstart
             * @property {Map} target            - the map fires event
             * @property {Coordinate} coordinate - coordinate of the event
             * @property {Point} containerPoint  - container point of the event
             * @property {Point} viewPoint       - view point of the event
             * @property {Event} domEvent                 - dom event
             */
            'touchstart ' +
            /**
             * touchmove event
             * @event Map#touchmove
             * @type {Object}
             * @property {String} type                    - touchmove
             * @property {Map} target            - the map fires event
             * @property {Coordinate} coordinate - coordinate of the event
             * @property {Point} containerPoint  - container point of the event
             * @property {Point} viewPoint       - view point of the event
             * @property {Event} domEvent                 - dom event
             */
            'touchmove ' +
            /**
             * touchend event
             * @event Map#touchend
             * @type {Object}
             * @property {String} type                    - touchend
             * @property {Map} target            - the map fires event
             * @property {Coordinate} coordinate - coordinate of the event
             * @property {Point} containerPoint  - container point of the event
             * @property {Point} viewPoint       - view point of the event
             * @property {Event} domEvent                 - dom event
             */
            'touchend ';
        //phantomjs will crash when registering events on canvasContainer
        const dom = this._panels.mapWrapper || this._containerDOM;
        if (remove) {
            removeDomEvent(dom, events, this._handleDOMEvent, this);
        } else {
            addDomEvent(dom, events, this._handleDOMEvent, this);
        }

    },

    _handleDOMEvent: function (e) {
        var type = e.type;
        if (type === 'click') {
            var button = e.button;
            if (button === 2) {
                type = 'contextmenu';
            }
        }
        // prevent default contextmenu
        if (type === 'contextmenu') {
            preventDefault(e);
        }
        if (this._ignoreEvent(e)) {
            return;
        }
        var oneMoreEvent = null;
        // ignore click lasted for more than 300ms.
        if (type === 'mousedown' || (type === 'touchstart' && e.touches.length === 1)) {
            this._mouseDownTime = now();
        } else if ((type === 'click' || type === 'touchend') && this._mouseDownTime) {
            const downTime = this._mouseDownTime;
            delete this._mouseDownTime;
            var time = now();
            if (time - downTime > 300) {
                if (type === 'click') {
                    return;
                }
            } else if (type === 'touchend') {
                oneMoreEvent = 'click';
            }
        }
        this._fireDOMEvent(this, e, type);
        if (oneMoreEvent) {
            this._fireDOMEvent(this, e, oneMoreEvent);
        }
    },

    _ignoreEvent: function (domEvent) {
        //ignore events originated from control and ui doms.
        if (!domEvent || !this._panels.control) {
            return false;
        }
        var target = domEvent.srcElement || domEvent.target;
        if (target) {
            while (target && target !== this._containerDOM) {
                if (target.className && target.className.indexOf &&
                    (target.className.indexOf('maptalks-control') >= 0 || target.className.indexOf('maptalks-ui') >= 0)) {
                    return true;
                }
                target = target.parentNode;
            }

        }
        return false;
    },

    _parseEvent: function (e, type) {
        if (!e) {
            return null;
        }
        var eventParam = {
            'domEvent': e
        };
        if (type !== 'keypress') {
            var actual = e.touches && e.touches.length > 0 ?
                e.touches[0] : e.changedTouches && e.changedTouches.length > 0 ?
                e.changedTouches[0] : e;
            if (actual) {
                var containerPoint = getEventContainerPoint(actual, this._containerDOM);
                eventParam['coordinate'] = this.containerPointToCoordinate(containerPoint);
                eventParam['containerPoint'] = containerPoint;
                eventParam['viewPoint'] = this.containerPointToViewPoint(containerPoint);
                eventParam['point2d'] = this._containerPointToPoint(containerPoint);
            }
        }
        return eventParam;
    },

    _fireDOMEvent: function (target, e, type) {
        if (this.isRemoved()) {
            return;
        }
        var eventParam = this._parseEvent(e, type);
        this._fireEvent(type, eventParam);
    }
});
