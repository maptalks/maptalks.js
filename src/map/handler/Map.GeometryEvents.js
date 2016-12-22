import { now, isArrayHasData, requestAnimFrame, cancelAnimFrame, bind } from 'core/util';
import { on, off, getEventContainerPoint, preventDefault, stopPropagation } from 'core/util/dom';
import Handler from 'core/Handler';
import VectorLayer from 'layer/VectorLayer';
import Map from '../Map';

Map.mergeOptions({
    'geometryEvents': true
});

Map.GeometryEvents = Handler.extend({
    EVENTS: 'mousedown mouseup mousemove click dblclick contextmenu touchstart touchmove touchend',

    addHooks: function () {
        var map = this.target;
        var dom = map._panels.allLayers || map._containerDOM;
        if (dom) {
            on(dom, this.EVENTS, this._identifyGeometryEvents, this);
        }

    },

    removeHooks: function () {
        var map = this.target;
        var dom = map._panels.allLayers || map._containerDOM;
        if (dom) {
            off(dom, this.EVENTS, this._identifyGeometryEvents, this);
        }
    },

    _identifyGeometryEvents: function (domEvent) {
        var map = this.target;
        var vectorLayers = map._getLayers(function (layer) {
            if (layer instanceof VectorLayer) {
                return true;
            }
            return false;
        });
        if (map._isBusy() || !vectorLayers || vectorLayers.length === 0) {
            return;
        }
        var eventType = domEvent.type;
        // ignore click lasted for more than 300ms.
        if (eventType === 'mousedown') {
            this._mouseDownTime = now();
        } else if (eventType === 'click' && this._mouseDownTime) {
            var time = now();
            if (time - this._mouseDownTime > 300) {
                return;
            }
        }
        var layers = [];
        for (var i = 0; i < vectorLayers.length; i++) {
            if (vectorLayers[i].options['geometryEvents']) {
                layers.push(vectorLayers[i]);
            }
        }
        if (layers.length === 0) {
            return;
        }

        var actual = domEvent.touches && domEvent.touches.length > 0 ?
            domEvent.touches[0] : domEvent.changedTouches && domEvent.changedTouches.length > 0 ?
            domEvent.changedTouches[0] : domEvent;
        if (!actual) {
            return;
        }
        var containerPoint = getEventContainerPoint(actual, map._containerDOM),
            coordinate = map.containerPointToCoordinate(containerPoint);
        if (eventType === 'touchstart') {
            preventDefault(domEvent);
        }
        var geometryCursorStyle = null;
        var identifyOptions = {
            'includeInternals': true,
            //return only one geometry on top,
            'filter': function (geometry) {
                var eventToFire = geometry._getEventTypeToFire(domEvent);
                if (eventType === 'mousemove') {
                    if (!geometryCursorStyle && geometry.options['cursor']) {
                        geometryCursorStyle = geometry.options['cursor'];
                    }
                    if (!geometry.listens('mousemove') && !geometry.listens('mouseover')) {
                        return false;
                    }
                } else if (!geometry.listens(eventToFire)) {
                    return false;
                }

                return true;
            },
            'count': 1,
            'coordinate': coordinate,
            'layers': layers
        };
        var callback = bind(fireGeometryEvent, this);
        var me = this;
        if (this._queryIdentifyTimeout) {
            cancelAnimFrame(this._queryIdentifyTimeout);
        }
        if (eventType === 'mousemove' || eventType === 'touchmove') {
            this._queryIdentifyTimeout = requestAnimFrame(function () {
                map.identify(identifyOptions, callback);
            });
        } else {
            map.identify(identifyOptions, callback);
        }

        function fireGeometryEvent(geometries) {
            var propagation = true;
            var i;
            if (eventType === 'mousemove') {
                var geoMap = {};
                if (isArrayHasData(geometries)) {
                    for (i = geometries.length - 1; i >= 0; i--) {
                        geoMap[geometries[i]._getInternalId()] = geometries[i];
                        geometries[i]._onEvent(domEvent);
                        //the first geometry is on the top, so ignore the latter cursors.
                        propagation = geometries[i]._onMouseOver(domEvent);
                    }
                }

                map._setPriorityCursor(geometryCursorStyle);

                var oldTargets = me._prevMouseOverTargets;
                me._prevMouseOverTargets = geometries;
                if (isArrayHasData(oldTargets)) {
                    for (i = oldTargets.length - 1; i >= 0; i--) {
                        var oldTarget = oldTargets[i];
                        var oldTargetId = oldTargets[i]._getInternalId();
                        if (geometries && geometries.length > 0) {
                            var mouseout = true;
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
                if (!geometries || geometries.length === 0) {
                    return;
                }
                propagation = geometries[geometries.length - 1]._onEvent(domEvent);
            }
            if (propagation === false) {
                stopPropagation(domEvent);
            }
        }

    }
});

Map.addInitHook('addHandler', 'geometryEvents', Map.GeometryEvents);
