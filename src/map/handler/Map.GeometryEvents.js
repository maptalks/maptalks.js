import { now, isArrayHasData, requestAnimFrame, cancelAnimFrame } from 'core/util';
import { on, off, getEventContainerPoint, preventDefault, stopPropagation } from 'core/util/dom';
import Handler from 'handler/Handler';
import Geometry from 'geometry/Geometry';
import Map from '../Map';

const EVENTS = 'mousedown mouseup mousemove click dblclick contextmenu touchstart touchmove touchend';

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
        const layers = map._getLayers(layer => {
            if (layer.identify && layer.options['geometryEvents']) {
                return true;
            }
            return false;
        });
        if (!layers.length) {
            return;
        }
        let oneMoreEvent = null;
        const eventType = type || domEvent.type;
        // ignore click lasted for more than 300ms.
        if (eventType === 'mousedown' || (eventType === 'touchstart' && domEvent.touches.length === 1)) {
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
        const containerPoint = getEventContainerPoint(actual, map._containerDOM),
            coordinate = map.containerPointToCoordinate(containerPoint);
        if (eventType === 'touchstart') {
            preventDefault(domEvent);
        }
        let geometryCursorStyle = null;
        const identifyOptions = {
            'includeInternals': true,
            //return only one geometry on top,
            'filter': geometry => {
                if (!(geometry instanceof Geometry)) {
                    return false;
                }
                const eventToFire = geometry._getEventTypeToFire(domEvent);
                if (eventType === 'mousemove') {
                    if (!geometryCursorStyle && geometry.options['cursor']) {
                        geometryCursorStyle = geometry.options['cursor'];
                    }
                    if (!geometry.listens('mousemove') && !geometry.listens('mouseover')) {
                        return false;
                    }
                } else if (!geometry.listens(eventToFire) && !geometry.listens(oneMoreEvent)) {
                    return false;
                }

                return true;
            },
            'count': 1,
            'coordinate': coordinate,
            'onlyVisible' : map.options['onlyVisibleGeometryEvents'],
            'layers': layers
        };
        const callback = fireGeometryEvent.bind(this);

        if (this._queryIdentifyTimeout) {
            cancelAnimFrame(this._queryIdentifyTimeout);
        }
        if (eventType === 'mousemove' || eventType === 'touchmove') {
            this._queryIdentifyTimeout = requestAnimFrame(() => {
                if (map.isInteracting()) {
                    return;
                }
                map.identify(identifyOptions, callback);
            });
        } else {
            map.identify(identifyOptions, callback);
        }

        function fireGeometryEvent(geometries) {
            let propagation = true;
            if (eventType === 'mousemove') {
                const geoMap = {};
                if (isArrayHasData(geometries)) {
                    for (let i = geometries.length - 1; i >= 0; i--) {
                        if (!(geometries[i] instanceof Geometry)) {
                            continue;
                        }
                        geoMap[geometries[i]._getInternalId()] = geometries[i];
                        geometries[i]._onEvent(domEvent);
                        //the first geometry is on the top, so ignore the latter cursors.
                        propagation = geometries[i]._onMouseOver(domEvent);
                    }
                }

                map._setPriorityCursor(geometryCursorStyle);

                const oldTargets = this._prevMouseOverTargets;
                this._prevMouseOverTargets = geometries;
                if (isArrayHasData(oldTargets)) {
                    for (let i = oldTargets.length - 1; i >= 0; i--) {
                        const oldTarget = oldTargets[i];
                        if (!(oldTarget instanceof Geometry)) {
                            continue;
                        }
                        const oldTargetId = oldTargets[i]._getInternalId();
                        if (geometries && geometries.length > 0) {
                            let mouseout = true;
                            /**
                             * 鼠标经过的新位置中不包含老的目标geometry
                             */
                            if (geoMap[oldTargetId]) {
                                mouseout = false;
                            }
                            if (mouseout) {
                                oldTarget._onMouseOut(domEvent);
                            }
                        } else { //鼠标新的位置不包含任何geometry，将触发之前target的mouseOut事件
                            oldTarget._onMouseOut(domEvent);
                        }
                    }
                }

            } else {
                if (!geometries || !geometries.length) { return; }
                for (let i = geometries.length - 1; i >= 0; i--) {
                    if (!(geometries[i] instanceof Geometry)) {
                        continue;
                    }
                    propagation = geometries[i]._onEvent(domEvent);
                    if (oneMoreEvent) {
                        geometries[i]._onEvent(domEvent, oneMoreEvent);
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
    'onlyVisibleGeometryEvents' : true
});

Map.addOnLoadHook('addHandler', 'geometryEvents', MapGeometryEventsHandler);

export default MapGeometryEventsHandler;
