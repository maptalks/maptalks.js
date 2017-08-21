import { now } from 'core/util';
import {
    addDomEvent,
    removeDomEvent,
    preventDefault,
    getEventContainerPoint
} from 'core/util/dom';
import Map from './Map';

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
     * mouseenter event
     * @event Map#mouseenter
     * @type {Object}
     * @property {String} type                    - mouseenter
     * @property {Map} target            - the map fires event
     * @property {Coordinate} coordinate - coordinate of the event
     * @property {Point} containerPoint  - container point of the event
     * @property {Point} viewPoint       - view point of the event
     * @property {Event} domEvent                 - dom event
     */
    'mouseenter ' +
    /**
     * mouseleave event
     * @event Map#mouseleave
     * @type {Object}
     * @property {String} type                    - mouseleave
     * @property {Map} target            - the map fires event
     * @property {Coordinate} coordinate - coordinate of the event
     * @property {Point} containerPoint  - container point of the event
     * @property {Point} viewPoint       - view point of the event
     * @property {Event} domEvent                 - dom event
     */
    'mouseleave ' +
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

Map.include(/** @lends Map.prototype */ {
    _registerDomEvents() {
        const dom = this._panels.mapWrapper || this._containerDOM;
        addDomEvent(dom, events, this._handleDOMEvent, this);
    },

    _removeDomEvents() {
        const dom = this._panels.mapWrapper || this._containerDOM;
        removeDomEvent(dom, events, this._handleDOMEvent, this);
    },

    _handleDOMEvent(e) {
        let type = e.type;
        if (this._ignoreEvent(e)) {
            return;
        }
        // prevent default contextmenu
        if (type === 'contextmenu') {
            preventDefault(e);
        }
        let mimicClick = false;
        // ignore click lasted for more than 300ms.
        if (type === 'mousedown' || (type === 'touchstart' && e.touches.length === 1)) {
            this._mouseDownTime = now();
        } else if ((type === 'click' || type === 'touchend' || type === 'contextmenu')) {
            if (!this._mouseDownTime) {
                //mousedown | touchstart propogation is stopped
                //ignore the click/touchend/contextmenu
                return;
            } else {
                const downTime = this._mouseDownTime;
                delete this._mouseDownTime;
                const time = now();
                if (time - downTime > 300) {
                    if (type === 'click' || type === 'contextmenu') {
                        return;
                    }
                } else if (type === 'touchend') {
                    mimicClick = true;
                }
            }
        }
        if (type === 'click') {
            const button = e.button;
            if (button === 2) {
                type = 'contextmenu';
            }
        }
        this._fireDOMEvent(this, e, type);
        if (mimicClick) {
            let mimicDblClick = false;
            this._fireDOMEvent(this, e, 'click');
            if (this._clickTime && (now() - this._clickTime <= 300)) {
                mimicDblClick = true;
                delete this._clickTime;
            } else {
                this._clickTime = now();
            }
            if (mimicDblClick) {
                this._fireDOMEvent(this, e, 'dblclick');
            }
        }
    },

    _ignoreEvent(domEvent) {
        //ignore events originated from control and ui doms.
        if (!domEvent || !this._panels.control) {
            return false;
        }
        let target = domEvent.srcElement || domEvent.target;
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

    _parseEvent(e, type) {
        if (!e) {
            return null;
        }
        const eventParam = {
            'domEvent': e
        };
        if (type !== 'keypress') {
            const actual = e.touches && e.touches.length > 0 ?
                e.touches[0] : e.changedTouches && e.changedTouches.length > 0 ?
                e.changedTouches[0] : e;
            if (actual) {
                const containerPoint = getEventContainerPoint(actual, this._containerDOM);
                eventParam['coordinate'] = this.containerPointToCoordinate(containerPoint);
                eventParam['containerPoint'] = containerPoint;
                eventParam['viewPoint'] = this.containerPointToViewPoint(containerPoint);
                eventParam['point2d'] = this._containerPointToPoint(containerPoint);
            }
        }
        return eventParam;
    },

    _fireDOMEvent(target, e, type) {
        if (this.isRemoved()) {
            return;
        }
        const eventParam = this._parseEvent(e, type);
        this._fireEvent(type, eventParam);
    }
});

Map.addOnLoadHook('_registerDomEvents');
