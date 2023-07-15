import { now } from '../../core/util';
import { on, off, getEventContainerPoint, preventDefault, stopPropagation, isMoveEvent } from '../../core/util/dom';
import Handler from '../../handler/Handler';
import Geometry from '../../geometry/Geometry';
import Map from '../Map';

const EVENTS =
    /**
     * mousedown event
     * @event Geometry#mousedown
     * @type {Object}
     * @property {String} type                    - mousedown
     * @property {Geometry} target            - the Geometry fires event
     * @property {Coordinate} coordinate - coordinate of the event
     * @property {Point} containerPoint  - container point of the event
     * @property {Point} viewPoint       - view point of the event
     * @property {Event} domEvent                 - dom event
     */
    'mousedown ' +
    /**
     * mouseup event
     * @event Geometry#mouseup
     * @type {Object}
     * @property {String} type                    - mouseup
     * @property {Geometry} target            - the Geometry fires event
     * @property {Coordinate} coordinate - coordinate of the event
     * @property {Point} containerPoint  - container point of the event
     * @property {Point} viewPoint       - view point of the event
     * @property {Event} domEvent                 - dom event
     */
    'mouseup ' +
    /**
     * mousemove event
     * @event Geometry#mousemove
     * @type {Object}
     * @property {String} type                    - mousemove
     * @property {Geometry} target            - the Geometry fires event
     * @property {Coordinate} coordinate - coordinate of the event
     * @property {Point} containerPoint  - container point of the event
     * @property {Point} viewPoint       - view point of the event
     * @property {Event} domEvent                 - dom event
     */
    'mousemove ' +
    /**
     * click event
     * @event Geometry#click
     * @type {Object}
     * @property {String} type                    - click
     * @property {Geometry} target            - the Geometry fires event
     * @property {Coordinate} coordinate - coordinate of the event
     * @property {Point} containerPoint  - container point of the event
     * @property {Point} viewPoint       - view point of the event
     * @property {Event} domEvent                 - dom event
     */
    'click ' +
    /**
     * dblclick event
     * @event Geometry#dblclick
     * @type {Object}
     * @property {String} type                    - dblclick
     * @property {Geometry} target            - the Geometry fires event
     * @property {Coordinate} coordinate - coordinate of the event
     * @property {Point} containerPoint  - container point of the event
     * @property {Point} viewPoint       - view point of the event
     * @property {Event} domEvent                 - dom event
     */
    'dblclick ' +
    /**
     * contextmenu event
     * @event Geometry#contextmenu
     * @type {Object}
     * @property {String} type                    - contextmenu
     * @property {Geometry} target            - the Geometry fires event
     * @property {Coordinate} coordinate - coordinate of the event
     * @property {Point} containerPoint  - container point of the event
     * @property {Point} viewPoint       - view point of the event
     * @property {Event} domEvent                 - dom event
     */
    'contextmenu ' +
    /**
     * touchstart event
     * @event Geometry#touchstart
     * @type {Object}
     * @property {String} type                    - touchstart
     * @property {Geometry} target            - the Geometry fires event
     * @property {Coordinate} coordinate - coordinate of the event
     * @property {Point} containerPoint  - container point of the event
     * @property {Point} viewPoint       - view point of the event
     * @property {Event} domEvent                 - dom event
     */
    'touchstart ' +
    /**
     * touchmove event
     * @event Geometry#touchmove
     * @type {Object}
     * @property {String} type                    - touchmove
     * @property {Geometry} target            - the Geometry fires event
     * @property {Coordinate} coordinate - coordinate of the event
     * @property {Point} containerPoint  - container point of the event
     * @property {Point} viewPoint       - view point of the event
     * @property {Event} domEvent                 - dom event
     */
    'touchmove ' +
    /**
     * touchend event
     * @event Geometry#touchend
     * @type {Object}
     * @property {String} type                    - touchend
     * @property {Geometry} target            - the Geometry fires event
     * @property {Coordinate} coordinate - coordinate of the event
     * @property {Point} containerPoint  - container point of the event
     * @property {Point} viewPoint       - view point of the event
     * @property {Event} domEvent                 - dom event
     */
    'touchend ' +
    'mouseout';
/**
 * mouseenter event for geometry
 * @event Geometry#mouseenter
 * @type {Object}
 * @property {String} type                    - mouseenter
 * @property {Geometry} target       - the geometry fires mouseenter
 * @property {Coordinate} coordinate - coordinate of the event
 * @property {Point} containerPoint  - container point of the event
 * @property {Point} viewPoint       - view point of the event
 * @property {Event} domEvent                 - dom event
 */
/**
 * mouseover event for geometry
 * @event Geometry#mouseover
 * @type {Object}
 * @property {String} type                    - mouseover
 * @property {Geometry} target       - the geometry fires mouseover
 * @property {Coordinate} coordinate - coordinate of the event
 * @property {Point} containerPoint  - container point of the event
 * @property {Point} viewPoint       - view point of the event
 * @property {Event} domEvent                 - dom event
 */
/**
 * mouseout event for geometry
 * @event Geometry#mouseout
 * @type {Object}
 * @property {String} type                    - mouseout
 * @property {Geometry} target       - the geometry fires mouseout
 * @property {Coordinate} coordinate - coordinate of the event
 * @property {Point} containerPoint  - container point of the event
 * @property {Point} viewPoint       - view point of the event
 * @property {Event} domEvent                 - dom event
 */

const MOUSEEVENT_ASSOCIATION_TABLE = {
    'mousemove': ['mousemove', 'mouseover', 'mouseout', 'mouseenter'],
    'touchend': ['touchend', 'click']
};

/**
 * geo validate
 *
 */
const isGeo = (geometry) => {
    return geometry && geometry.getLayer && geometry.on && geometry.fire;
};

const getGeoId = (geometry) => {
    if (geometry._getInternalId) {
        return geometry._getInternalId();
    } else if (geometry.getId) {
        return geometry.getId();
    }
    return null;
};

const fireGeoEvent = (geometry, domEvent, type) => {
    if (geometry._onEvent) {
        return geometry._onEvent(domEvent, type);
    }
    //plugin layer,such as threelayer
    const layer = geometry.getLayer();
    if (layer && layer.fireGeoEvent) {
        return layer.fireGeoEvent(geometry, domEvent, type);
    }
    return null;
};

class MapGeometryEventsHandler extends Handler {

    addHooks() {
        const map = this.target;
        const dom = map._panels.allLayers || map._containerDOM;
        on(dom, EVENTS, this._identifyGeometryEvents, this);
    }

    removeHooks() {
        const map = this.target;
        const dom = map._panels.allLayers || map._containerDOM;
        off(dom, EVENTS, this._identifyGeometryEvents, this);
    }

    _identifyGeometryEvents(domEvent, type) {
        const map = this.target;
        if (map.isInteracting() || map._ignoreEvent(domEvent)) {
            return;
        }
        let oneMoreEvent = null;
        const eventType = type || domEvent.type;
        // ignore click lasted for more than 300ms.
        const isMousedown = eventType === 'mousedown' || (eventType === 'touchstart' && domEvent.touches && domEvent.touches.length === 1);
        if (isMousedown) {
            this._mouseDownTime = now();
        } else if ((eventType === 'click' || eventType === 'touchend') && this._mouseDownTime) {
            const downTime = this._mouseDownTime;
            delete this._mouseDownTime;
            const time = now();
            if (time - downTime > 300) {
                if (eventType === 'click') {
                    return;
                }
            } else if (eventType === 'touchend') {
                oneMoreEvent = 'click';
            }
        }


        const actual = domEvent.touches && domEvent.touches.length > 0 ?
            domEvent.touches[0] : domEvent.changedTouches && domEvent.changedTouches.length > 0 ?
                domEvent.changedTouches[0] : domEvent;
        if (!actual) {
            return;
        }
        const containerPoint = getEventContainerPoint(actual, map._containerDOM);
        if (eventType === 'touchstart') {
            if (map.options['preventTouch']) {
                preventDefault(domEvent);
            }
        }

        let geometryCursorStyle = null;
        const tops = this.target.getRenderer().getTopElements();
        const topOnlyEvent = isMousedown && domEvent.button !== 2;
        for (let i = 0; i < tops.length; i++) {
            if (tops[i].hitTest(containerPoint)) {
                const cursor = tops[i].options['cursor'];
                if (cursor) {
                    geometryCursorStyle = cursor;
                }
                if (topOnlyEvent || tops[i].events && tops[i].events.indexOf(eventType) >= 0) {
                    const e = { target: map, type: eventType, domEvent, containerPoint };
                    if (topOnlyEvent) {
                        map._setPriorityCursor(geometryCursorStyle);
                        tops[i].mousedown(e);
                        return;
                    } else {
                        tops[i].onEvent(e);
                    }
                }
            }
        }

        const layers = map._getLayers(layer => {
            if (layer.identify && layer.options['geometryEvents']) {
                return true;
            }
            return false;
        });
        map._setPriorityCursor(geometryCursorStyle);
        if (!layers.length) {
            return;
        }

        const eventTypes = MOUSEEVENT_ASSOCIATION_TABLE[eventType] || [eventType];
        const identifyOptions = {
            'includeInternals': true,
            //return only one geometry on top,
            'filter': geometry => {
                if (geometry instanceof Geometry) {
                    const eventToFire = geometry._getEventTypeToFire(domEvent);
                    if (eventType === 'mousemove') {
                        if (!geometryCursorStyle && geometry.options['cursor']) {
                            geometryCursorStyle = geometry.options['cursor'];
                        }
                        if (!geometry.listens('mousemove') && !geometry.listens('mouseover') && !geometry.listens('mouseenter')) {
                            return false;
                        }
                    } else if (!geometry.listens(eventToFire) && !geometry.listens(oneMoreEvent)) {
                        return false;
                    }
                    return true;
                } else if (isGeo(geometry)) {
                    return true;
                }
                return false;
            },
            'count': 1,
            'onlyVisible': map.options['onlyVisibleGeometryEvents'],
            containerPoint,
            layers,
            eventTypes,
            domEvent
        };
        const callback = fireGeometryEvent.bind(this);

        if (isMoveEvent(eventType)) {
            this._queryIdentifyTimeout = map.getRenderer().callInNextFrame(() => {
                if (map.isInteracting()) {
                    return;
                }
                map.identifyAtPoint(identifyOptions, callback);
            });
        } else {
            map.identifyAtPoint(identifyOptions, callback);
        }

        function fireGeometryEvent(geometries) {
            let propagation = true;

            const getOldGeos = () => {
                const geos = this._prevOverGeos && this._prevOverGeos.geos;
                return geos || [];
            };

            const oldGeosMouseout = (oldTargets = [], geoMap = {}) => {
                if (oldTargets && oldTargets.length > 0) {
                    for (let i = oldTargets.length - 1; i >= 0; i--) {
                        const oldTarget = oldTargets[i];
                        if (!isGeo(oldTarget)) {
                            continue;
                        }
                        // const oldTargetId = oldTargets[i]._getInternalId();
                        const oldTargetId = getGeoId(oldTargets[i]);
                        /**
                         * 鼠标经过的新位置中不包含老的目标geometry
                         */
                        if (!geoMap[oldTargetId]) {
                            // propagation = oldTarget._onEvent(domEvent, 'mouseout');
                            propagation = fireGeoEvent(oldTarget, domEvent, 'mouseout');
                        }
                    }
                }
            };
            //鼠标移出地图容器，所有的老的geos触发mouseout,这个属于原来没有做好的地方,现在加上
            if (eventType === 'mouseout') {
                const oldTargets = getOldGeos();
                this._prevOverGeos = {
                    'geos': [],
                    'geomap': {}
                };
                oldGeosMouseout(oldTargets, {});
            } else if (eventType === 'mousemove') {
                const geoMap = {};
                if (geometries.length > 0) {
                    for (let i = geometries.length - 1; i >= 0; i--) {
                        const geo = geometries[i];
                        if (!isGeo(geo)) {
                            continue;
                        }
                        const iid = getGeoId(geo);
                        geoMap[iid] = geo;
                        // geo._onEvent(domEvent);
                        fireGeoEvent(geo, domEvent);
                        if (!this._prevOverGeos || !this._prevOverGeos.geomap[iid]) {
                            // geo._onEvent(domEvent, 'mouseenter');
                            fireGeoEvent(geo, domEvent, 'mouseenter');
                        }
                        // propagation = geo._onEvent(domEvent, 'mouseover');
                        propagation = fireGeoEvent(geo, domEvent, 'mouseover');
                    }
                }

                map._setPriorityCursor(geometryCursorStyle);

                const oldTargets = getOldGeos();
                this._prevOverGeos = {
                    'geos': geometries,
                    'geomap': geoMap
                };
                oldGeosMouseout(oldTargets, geoMap);

            } else {
                if (!geometries || !geometries.length) { return; }
                for (let i = geometries.length - 1; i >= 0; i--) {
                    if (!isGeo(geometries[i])) {
                        continue;
                    }
                    // propagation = geometries[i]._onEvent(domEvent);
                    propagation = fireGeoEvent(geometries[i], domEvent);
                    if (oneMoreEvent) {
                        // geometries[i]._onEvent(domEvent, oneMoreEvent);
                        fireGeoEvent(geometries[i], domEvent, oneMoreEvent);
                    }
                    break;
                }
            }
            if (propagation === false) {
                stopPropagation(domEvent);
            }
        }

    }
}

Map.mergeOptions({
    'geometryEvents': true,
    'onlyVisibleGeometryEvents': true
});

Map.addOnLoadHook('addHandler', 'geometryEvents', MapGeometryEventsHandler);

export default MapGeometryEventsHandler;
