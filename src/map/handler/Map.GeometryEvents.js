maptalks.Map.mergeOptions({
    'geometryEvents': true
});

maptalks.Map.GeometryEvents = maptalks.Handler.extend({
    EVENTS: 'mousedown mouseup mousemove click dblclick contextmenu touchstart touchmove touchend',

    addHooks: function () {
        var map = this.target;
        var dom = map._panels.allLayers || map._containerDOM;
        if (dom) {
            maptalks.DomUtil.on(dom, this.EVENTS, this._identifyGeometryEvents, this);
        }

    },

    removeHooks: function () {
        var map = this.target;
        var dom = map._panels.allLayers || map._containerDOM;
        if (dom) {
            maptalks.DomUtil.off(dom, this.EVENTS, this._identifyGeometryEvents, this);
        }
    },

    _identifyGeometryEvents: function (domEvent) {
        var map = this.target;
        var vectorLayers = map._getLayers(function (layer) {
            if (layer instanceof maptalks.VectorLayer) {
                return true;
            }
            return false;
        });
        if (map._isBusy() || !vectorLayers || vectorLayers.length === 0) {
            return;
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
        var eventType = domEvent.type;
        var actual = domEvent.touches && domEvent.touches.length > 0 ?
            domEvent.touches[0] : domEvent.changedTouches && domEvent.changedTouches.length > 0 ?
            domEvent.changedTouches[0] : domEvent;
        if (!actual) {
            return;
        }
        var containerPoint = maptalks.DomUtil.getEventContainerPoint(actual, map._containerDOM),
            coordinate = map.containerPointToCoordinate(containerPoint);
        if (eventType === 'touchstart') {
            maptalks.DomUtil.preventDefault(domEvent);
        }
        var geometryCursorStyle = null;
        var identifyOptions = {
            'includeInternals' : true,
            //return only one geometry on top,
            'filter':function (geometry) {
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
            'count' : 1,
            'coordinate' : coordinate,
            'layers': layers
        };
        var callback = maptalks.Util.bind(fireGeometryEvent, this);
        var me = this;
        if (this._queryIdentifyTimeout) {
            maptalks.Util.cancelAnimFrame(this._queryIdentifyTimeout);
        }
        if (eventType === 'mousemove'  || eventType === 'touchmove') {
            this._queryIdentifyTimeout = maptalks.Util.requestAnimFrame(function () {
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
                if (maptalks.Util.isArrayHasData(geometries)) {
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
                if (maptalks.Util.isArrayHasData(oldTargets)) {
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
                if (!geometries || geometries.length === 0) { return; }
                propagation = geometries[geometries.length - 1]._onEvent(domEvent);
            }
            if (propagation === false) {
                maptalks.DomUtil.stopPropagation(domEvent);
            }
        }

    }
});

maptalks.Map.addInitHook('addHandler', 'geometryEvents', maptalks.Map.GeometryEvents);
