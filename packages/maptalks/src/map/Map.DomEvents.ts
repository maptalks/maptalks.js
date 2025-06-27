import GlobalConfig from '../GlobalConfig';
import { now, extend, Vector3 } from '../core/util';
import {
    addDomEvent,
    removeDomEvent,
    preventDefault,
    getEventContainerPoint,
    isMoveEvent,
    isMousemoveEventBlocked
} from '../core/util/dom';
import Map from './Map';
import { Coordinate, Point } from '../geo';
import Ray from '../core/math/Ray';

declare module "./Map" {
    interface Map {
        //@internal
        _removeDomEvents(): void;
        //@internal
        _ignoreEvent(domEvent: MapEventDomType): boolean;
        //@internal
        _isEventOutMap(domEvent: MapEventDomType): boolean;
        //@internal
        _parseEvent(e: MapEventDomType, type?: string): MapEventDataType;
        //@internal
        _parseEventFromCoord(coord: Coordinate): MapEventDataType;
        //@internal
        _fireDOMEvent(target: any, e: MapEventDomType, type: string);
        //@internal
        _getEventParams(e: MapEventDomType): MapEventDataType;
        //@internal
        _isContainerPointOutOfMap(containerPoint: Point): boolean;
        //@internal
        _getActualEvent(e: MapEventDomType): MapEventDomType;
    }
}

const PITCH_TO_CHECK = [60, 120];

export type MapEventDomType = MouseEvent | TouchEvent | DragEvent;
export type MapEventDataType = {
    coordinate?: Coordinate;
    containerPoint?: Point;
    viewPoint?: Point;
    point2d?: Point;
    domEvent?: MouseEvent | DragEvent | TouchEvent;
    terrain?: { coordinate: Coordinate, altitude: number } | null;
}



function dragEventHanlder(event) {
    event.stopPropagation();
    event.preventDefault();
}
const DRAGEVENTS = ['dragstart', 'dragenter', 'dragend', 'dragleave', 'dragover'].join(' ').toString();

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
    'touchend ' +
    /**
     * drop event
     * @event Map#drop
     * @type {Object}
     * @property {String} type                    - drop
     * @property {Map} target            - the map fires event
     * @property {Coordinate} coordinate - coordinate of the event
     * @property {Point} containerPoint  - container point of the event
     * @property {Point} viewPoint       - view point of the event
     * @property {Event} domEvent                 - dom event
     */
    'drop ';

Map.include(/** @lends Map.prototype */ {
    //@internal
    _registerDomEvents() {
        const dom = this._panels.mapWrapper || this._containerDOM;
        addDomEvent(dom, events, this._handleDOMEvent, this);
        addDomEvent(dom, DRAGEVENTS, dragEventHanlder, this);
    },

    //@internal
    _removeDomEvents() {
        const dom = this._panels.mapWrapper || this._containerDOM;
        removeDomEvent(dom, events, this._handleDOMEvent);
        removeDomEvent(dom, DRAGEVENTS, dragEventHanlder);
    },

    //@internal
    _handleDOMEvent(e: MapEventDomType) {
        if (e && e.type === 'drop') {
            // https://developer.mozilla.org/zh-CN/docs/Web/API/HTML_Drag_and_Drop_API
            e.stopPropagation();
            e.preventDefault();
            let eventParam = this._parseEvent(e, e.type);
            eventParam = extend({}, eventParam, { dataTransfer: (e as DragEvent).dataTransfer });
            this._fireEvent(e.type, eventParam);
            return;
        }
        const clickTimeThreshold = this.options['clickTimeThreshold'];
        const type = e.type;
        if (isMoveEvent(type) && !GlobalConfig.isTest && this.options['mousemoveThrottleEnable'] && isMousemoveEventBlocked(this, this.options['mousemoveThrottleTime'])) {
            return;
        }
        const isMouseDown = type === 'mousedown' || (type === 'touchstart' && (!(e as TouchEvent).touches || (e as TouchEvent).touches.length === 1));
        // prevent default contextmenu
        if (isMouseDown) {
            this._domMouseDownTime = now();
            this._domMouseDownView = this.getView();
        }
        const isRotating = type === 'contextmenu' && isRotatingMap(this);
        if (type === 'contextmenu') {
            // prevent context menu, if duration from mousedown > 300ms
            preventDefault(e);
            const downTime = this._domMouseDownTime;
            const time = now();
            if (time - downTime <= clickTimeThreshold && !isRotating) {
                this._fireDOMEvent(this, e, 'dom:' + e.type);
            }
        } else {
            this._fireDOMEvent(this, e, 'dom:' + e.type);
        }
        if (this._ignoreEvent(e)) {
            return;
        }
        let mimicClick = false;
        // ignore click lasted for more than 300ms.
        // happen.js produce event without touches
        if (isMouseDown) {
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
                if (time - downTime > clickTimeThreshold) {
                    if (type === 'click' || type === 'contextmenu') {
                        return;
                    }
                } else if (type === 'contextmenu') {
                    if (isRotating) {
                        return;
                    }
                } else if (type === 'touchend') {
                    mimicClick = true;
                }
            }
        }
        let mimicEvent;
        if (mimicClick) {
            if (this._clickTime && (now() - this._clickTime <= clickTimeThreshold)) {
                delete this._clickTime;
                mimicEvent = 'dblclick';
                this._fireDOMEvent(this, e, 'dom:dblclick');
            } else {
                this._clickTime = now();
                mimicEvent = 'click';
                this._fireDOMEvent(this, e, 'dom:click');
            }
        }
        if (this._ignoreEvent(e)) {
            return;
        }
        this._fireDOMEvent(this, e, type);
        if (mimicEvent) {
            this._fireDOMEvent(this, e, mimicEvent);
        }
    },

    //@internal
    _ignoreEvent(domEvent) {
        //ignore events originated from control and ui doms.
        if (!domEvent || !this._panels.control) {
            return false;
        }
        // if (this._isEventOutMap(domEvent)) {
        //     return true;
        // }
        let target = domEvent.srcElement || domEvent.target;
        let preTarget;
        if (target) {
            while (target && target !== this._containerDOM) {
                if (target.className && target.className.indexOf &&
                    (target.className.indexOf('maptalks-control') >= 0 || (target.className.indexOf('maptalks-ui') >= 0 && preTarget && !preTarget['eventsPropagation']))) {
                    return true;
                }
                preTarget = target;
                target = target.parentNode;
            }

        }
        return false;
    },

    //@internal
    _isEventOutMap(domEvent: MapEventDomType) {
        const actualEvent = this._getActualEvent(domEvent);
        const cp = getEventContainerPoint(actualEvent, this._containerDOM);
        return this._isContainerPointOutOfMap(cp);
    },

    _isContainerPointOutOfMap: function () {
        const from: Vector3 = [0, 0, 0];
        const to: Vector3 = [0, 0, 0];
        const ray = new Ray(from, to);
        // const fromGround : Vector3 = [0, 0, 0];
        const rayOnGround: Vector3 = [0, 0, 0];

        return function (containerPoint: Point) {
            const pitch = this.getPitch();
            if (pitch > PITCH_TO_CHECK[0] && pitch < PITCH_TO_CHECK[1]) {
                this.getContainerPointRay(from, to, containerPoint, 0, 0.5);
                ray.setFromTo(from, to);
                const intersection = ray.intersectGround(rayOnGround);
                if (!intersection) {
                    return true;
                }
                const t = ray.distanceToGround();
                if (t <= 0) {
                    return true;
                }
                // const dir = ray.direction;
                // vec3.set(fromGround, from[0], from[1], 0);
                // vec3.sub(rayOnGround, fromGround, rayOnGround);
                // vec3.normalize(rayOnGround, rayOnGround);
                // const dot = vec3.dot(dir, rayOnGround);
                // const angle = Math.abs(Math.acos(dot));
                // // 如果鼠标射线与地面的角度小于设定度数，则认为
                // return Math.PI - angle < 1 * Math.PI / 180;
            }
            return false;
        }
    }(),

    //@internal
    _wrapTerrainData(eventParam: MapEventDataType) {
        if (this.options['queryTerrainInMapEvents'] && eventParam.containerPoint && !eventParam.terrain) {
            eventParam.terrain = this._queryTerrainInfo(eventParam.containerPoint);
        }
    },

    //@internal
    _parseEvent(e: MapEventDomType, type: string): MapEventDataType {
        if (!e) {
            return null;
        }
        let eventParam: MapEventDataType = {
            'domEvent': e
        };
        if (type !== 'keypress') {
            const actual = this._getActualEvent(e);
            if (actual && actual.clientX !== undefined) {
                const containerPoint = getEventContainerPoint(actual, this._containerDOM);
                eventParam = extend(eventParam, {
                    'containerPoint': containerPoint,
                    'viewPoint': this.containerPointToViewPoint(containerPoint)
                });
                // ignore coorindate out of visual extent
                if (!this._isContainerPointOutOfMap(containerPoint)) {
                    eventParam = extend(eventParam, {
                        'coordinate': this.containerPointToCoord(containerPoint),
                        'point2d': this._containerPointToPoint(containerPoint)
                    });
                }
            }
        }
        this._wrapTerrainData(eventParam);
        return eventParam;
    },

    //@internal
    _parseEventFromCoord(coord: Coordinate): MapEventDataType {
        const containerPoint = this.coordToContainerPoint(coord),
            viewPoint = this.containerPointToViewPoint(containerPoint);
        const e = {
            'coordinate': coord,
            'containerPoint': containerPoint,
            'viewPoint': viewPoint,
            'point2d': this.coordToPoint(coord)
        };
        return e;
    },

    //@internal
    _getActualEvent(e: MapEventDomType) {
        e = e as TouchEvent;
        return e.touches && e.touches.length > 0 ?
            e.touches[0] : e.changedTouches && e.changedTouches.length > 0 ?
                e.changedTouches[0] : e;
    },

    //@internal
    _fireDOMEvent(target, e: MapEventDomType, type: string) {
        if (this.isRemoved()) {
            return;
        }

        const eventParam = this._parseEvent(e, type);
        //mouse point Beyond the visible range of the map(Sky Box Area)
        if (!eventParam.coordinate && type !== 'keypress' && type.indexOf('dom:') === -1) {
            return;
        }
        this._wrapTerrainData(eventParam);
        
        const mousemoveHandler = () => {
            if (eventParam.domEvent && eventParam.domEvent._cancelBubble) {
                // Always trigger _moumove _touchmove event
                // for hit test etc
                this._fireEvent('_' + type, eventParam);
                return;
            }
            this._fireEvent(type, eventParam);
        };
        if (isMoveEvent(type)) {
            if (!this.options['mousemoveThrottleEnable']) {
                mousemoveHandler();
            } else {
                this.getRenderer().callInNextFrame(() => {
                    mousemoveHandler();
                });
            }
        } else {
            this._fireEvent(type, eventParam);
        }
    },

    // _onKeyPress(e) {
    //     if (!this.isRemoved() && e.keyCode === 48 && e.ctrlKey) {
    //         this.setBearing(0);
    //     }
    // }

    // Extract _ geteventparams is reused in other plug-ins,such as maptalks.three plugin
    //@internal
    _getEventParams(e): MapEventDataType {
        const map = this;
        const eventParam = {
            'domEvent': e
        };
        const actual = e.touches && e.touches.length > 0 ? e.touches[0] : e.changedTouches && e.changedTouches.length > 0 ? e.changedTouches[0] : e;
        if (actual) {
            const containerPoint = getEventContainerPoint(actual, map.getContainer());
            eventParam['coordinate'] = map.containerPointToCoordinate(containerPoint);
            eventParam['containerPoint'] = containerPoint;
            eventParam['viewPoint'] = map.containerPointToViewPoint(containerPoint);
            eventParam['point2d'] = map._containerPointToPoint(containerPoint);
        }
        this._wrapTerrainData(eventParam);
        return eventParam;
    }
});

Map.addOnLoadHook('_registerDomEvents');

Map.mergeOptions({
    'queryTerrainInMapEvents': true
});

function isRotatingMap(map) {
    if (!map._domMouseDownView) {
        return true;
    }
    const view = map.getView(), mouseDownView = map._domMouseDownView;
    return (view.bearing !== mouseDownView.bearing || view.pitch !== mouseDownView.pitch);
}
