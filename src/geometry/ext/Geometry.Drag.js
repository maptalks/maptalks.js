import { INTERNAL_LAYER_PREFIX } from 'core/Constants';
import { isNil } from 'core/util';
import { lowerSymbolOpacity } from 'core/util/style';
import Browser from 'core/Browser';
import Handler from 'handler/Handler';
import Geometry from 'geometry/Geometry';
import DragHandler from 'handler/Drag';
import VectorLayer from 'layer/VectorLayer';
import { ConnectorLine } from 'geometry/ConnectorLine';
import { ResourceCache } from 'renderer/layer/CanvasRenderer';

const DRAG_STAGE_LAYER_ID = INTERNAL_LAYER_PREFIX + '_drag_stage';

const EVENTS = Browser.touch ? 'touchstart mousedown' : 'mousedown';

/**
 * Drag handler for geometries.
 * @category handler
 * @extends Handler
 * @ignore
 */
class GeometryDragHandler extends Handler  {

    /**
     * @param  {Geometry} target geometry target to drag
     */
    constructor(target) {
        super(target);
    }

    addHooks() {
        this.target.on(EVENTS, this._startDrag, this);
    }

    removeHooks() {
        this.target.off(EVENTS, this._startDrag, this);
    }

    _startDrag(param) {
        const map = this.target.getMap();
        if (!map) {
            return;
        }
        const parent = this.target._getParent();
        if (parent) {
            return;
        }
        if (this.isDragging()) {
            return;
        }
        const domEvent = param['domEvent'];
        if (domEvent.touches && domEvent.touches.length > 1) {
            return;
        }
        this.target.on('click', this._endDrag, this);
        this._lastCoord = param['coordinate'];
        this._lastPoint = param['containerPoint'];
        this._prepareMap();
        this._prepareDragHandler();
        this._dragHandler.onMouseDown(param['domEvent']);
        this._moved = false;
        /**
         * drag start event
         * @event Geometry#dragstart
         * @type {Object}
         * @property {String} type                    - dragstart
         * @property {Geometry} target       - the geometry fires event
         * @property {Coordinate} coordinate - coordinate of the event
         * @property {Point} containerPoint  - container point of the event
         * @property {Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        this.target._fireEvent('dragstart', param);
    }

    _prepareMap() {
        const map = this.target.getMap();
        this._mapDraggable = map.options['draggable'];
        this._mapHitDetect = map.options['hitDetect'];
        map._trySetCursor('move');
        map.config({
            'hitDetect': false,
            'draggable': false
        });
    }

    _restoreMap() {
        const map = this.target.getMap();
        //restore map status
        map._trySetCursor('default');
        if (isNil(this._mapDraggable)) {
            this._mapDraggable = true;
        }
        map.config({
            'hitDetect': this._mapHitDetect,
            'draggable': this._mapDraggable
        });

        delete this._mapDraggable;
        delete this._mapHitDetect;
    }

    _prepareDragHandler() {
        const map = this.target.getMap();
        this._dragHandler = new DragHandler(map._panels.mapWrapper || map._containerDOM);
        this._dragHandler.on('dragging', this._dragging, this);
        this._dragHandler.on('mouseup', this._endDrag, this);
        this._dragHandler.enable();
    }

    _prepareShadow() {
        const target = this.target;
        this._prepareDragStageLayer();
        if (this._shadow) {
            this._shadow.remove();
        }

        this._shadow = target.copy();
        this._shadow.setSymbol(target._getInternalSymbol());
        const shadow = this._shadow;
        if (target.options['dragShadow']) {
            const symbol = lowerSymbolOpacity(shadow._getInternalSymbol(), 0.5);
            shadow.setSymbol(symbol);
        }
        shadow.setId(null);
        this._prepareShadowConnectors();
    }

    _prepareShadowConnectors() {
        //copy connectors
        const target = this.target;
        const shadow = this._shadow;
        const resources = this._dragStageLayer._getRenderer().resources;

        const shadowConnectors = [];
        if (ConnectorLine._hasConnectors(target)) {
            const connectors = ConnectorLine._getConnectors(target);

            for (let i = 0, l = connectors.length; i < l; i++) {
                const targetConn = connectors[i];
                const connOptions = targetConn.config(),
                    connSymbol = targetConn._getInternalSymbol();
                connOptions['symbol'] = lowerSymbolOpacity(connSymbol, 0.5);
                let conn;
                if (targetConn.getConnectSource() === target) {
                    conn = new targetConn.constructor(shadow, targetConn.getConnectTarget(), connOptions);
                } else {
                    conn = new targetConn.constructor(targetConn.getConnectSource(), shadow, connOptions);
                }
                shadowConnectors.push(conn);
                if (targetConn.getLayer() && targetConn.getLayer()._getRenderer()) {
                    resources.merge(targetConn.getLayer()._getRenderer().resources);
                }

            }
        }
        this._shadowConnectors = shadowConnectors;
        shadowConnectors.push(shadow);
        this._dragStageLayer.bringToFront().addGeometry(shadowConnectors);
    }

    _onTargetUpdated() {
        if (this._shadow) {
            this._shadow.setSymbol(this.target._getSymbol());
        }
    }

    _prepareDragStageLayer() {
        const map = this.target.getMap(),
            layer = this.target.getLayer();
        this._dragStageLayer = map.getLayer(DRAG_STAGE_LAYER_ID);
        if (!this._dragStageLayer) {
            this._dragStageLayer = new VectorLayer(DRAG_STAGE_LAYER_ID, {
                'drawImmediate': true
            });
            map.addLayer(this._dragStageLayer);
        }
        //copy resources to avoid repeat resource loading.
        const resources = new ResourceCache();
        resources.merge(layer._getRenderer().resources);
        this._dragStageLayer._getRenderer().resources = resources;
    }

    _dragging(param) {
        const target = this.target;
        const map = target.getMap(),
            eventParam = map._parseEvent(param['domEvent']);

        const domEvent = eventParam['domEvent'];
        if (domEvent.touches && domEvent.touches.length > 1) {
            return;
        }

        if (!this._moved) {
            this._moved = true;
            target.on('symbolchange', this._onTargetUpdated, this);
            // this._prepareMap();
            this._isDragging = true;
            this._prepareShadow();
            if (!target.options['dragShadow']) {
                target.hide();
            }
            this._shadow._fireEvent('dragstart', eventParam);
            return;
        }
        if (!this._shadow) {
            return;
        }
        const axis = this._shadow.options['dragOnAxis'],
            coord = eventParam['coordinate'],
            point = eventParam['containerPoint'];
        if (!this._lastCoord) {
            this._lastCoord = coord;
        }
        if (!this._lastPoint) {
            this._lastPoint = point;
        }
        const coordOffset = coord.sub(this._lastCoord),
            pointOffset = point.sub(this._lastPoint);
        if (axis === 'x') {
            coordOffset.y = 0;
            pointOffset.y = 0;
        } else if (axis === 'y') {
            coordOffset.x = 0;
            pointOffset.x = 0;
        }
        this._lastCoord = coord;
        this._lastPoint = point;
        this._shadow.translate(coordOffset);
        if (!target.options['dragShadow']) {
            target.translate(coordOffset);
        }
        eventParam['coordOffset'] = coordOffset;
        eventParam['pointOffset'] = pointOffset;
        this._shadow._fireEvent('dragging', eventParam);

        /**
         * dragging event
         * @event Geometry#dragging
         * @type {Object}
         * @property {String} type                    - dragging
         * @property {Geometry} target       - the geometry fires event
         * @property {Coordinate} coordinate - coordinate of the event
         * @property {Point} containerPoint  - container point of the event
         * @property {Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        target._fireEvent('dragging', eventParam);

    }

    _endDrag(param) {
        const target = this.target,
            map = target.getMap();
        if (this._dragHandler) {
            target.off('click', this._endDrag, this);
            this._dragHandler.disable();
            delete this._dragHandler;
        }
        if (!map) {
            return;
        }
        const eventParam = map._parseEvent(param['domEvent']);
        target.off('symbolchange', this._onTargetUpdated, this);

        this._updateTargetAndRemoveShadow(eventParam);

        delete this._lastCoord;
        delete this._lastPoint;

        this._restoreMap();

        this._isDragging = false;
        /**
         * dragend event
         * @event Geometry#dragend
         * @type {Object}
         * @property {String} type                    - dragend
         * @property {Geometry} target       - the geometry fires event
         * @property {Coordinate} coordinate - coordinate of the event
         * @property {Point} containerPoint  - container point of the event
         * @property {Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        target._fireEvent('dragend', eventParam);
    }

    isDragging() {
        if (!this._isDragging) {
            return false;
        }
        return true;
    }

    _updateTargetAndRemoveShadow(eventParam) {
        const target = this.target,
            layer = target.getLayer(),
            map = target.getMap();
        if (!target.options['dragShadow']) {
            const d = layer.options['drawImmediate'];
            layer.config('drawImmediate', true);
            target.show();
            layer.config('drawImmediate', d);
        }
        const shadow = this._shadow;
        if (shadow) {
            if (target.options['dragShadow']) {
                const d = layer.options['drawImmediate'];
                layer.config('drawImmediate', true);
                target.setCoordinates(shadow.getCoordinates());
                layer.config('drawImmediate', d);
            }
            shadow._fireEvent('dragend', eventParam);
            shadow.remove();
            delete this._shadow;
        }
        if (this._shadowConnectors) {
            map.getLayer(DRAG_STAGE_LAYER_ID).removeGeometry(this._shadowConnectors);
            delete this._shadowConnectors;
        }
        if (this._dragStageLayer) {
            this._dragStageLayer.remove();
        }
    }

}

Geometry.mergeOptions({
    'draggable': false,
    'dragShadow': true,
    'dragOnAxis': null
});

Geometry.addInitHook('addHandler', 'draggable', GeometryDragHandler);

Geometry.include(/** @lends Geometry.prototype */ {
    /**
     * Whether the geometry is being dragged.
     * @reutrn {Boolean}
     */
    isDragging() {
        if (this._getParent()) {
            return this._getParent().isDragging();
        }
        if (this['draggable']) {
            return this['draggable'].isDragging();
        }
        return false;
    }
});

export default GeometryDragHandler;
