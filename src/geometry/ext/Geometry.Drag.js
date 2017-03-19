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
        var map = this.target.getMap();
        if (!map) {
            return;
        }
        var parent = this.target._getParent();
        if (parent) {
            return;
        }
        if (this.isDragging()) {
            return;
        }
        var domEvent = param['domEvent'];
        if (domEvent.touches && domEvent.touches.length > 1) {
            return;
        }
        this.target.on('click', this._endDrag, this);
        this._lastPos = param['coordinate'];
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
        var map = this.target.getMap();
        this._mapDraggable = map.options['draggable'];
        this._mapHitDetect = map.options['hitDetect'];
        map._trySetCursor('move');
        map.config({
            'hitDetect': false,
            'draggable': false
        });
    }

    _prepareDragHandler() {
        var map = this.target.getMap();
        this._dragHandler = new DragHandler(map._panels.mapWrapper || map._containerDOM);
        this._dragHandler.on('dragging', this._dragging, this);
        this._dragHandler.on('mouseup', this._endDrag, this);
        this._dragHandler.enable();
    }

    _prepareShadow() {
        var target = this.target;
        this._prepareDragStageLayer();
        var resources = this._dragStageLayer._getRenderer().resources;
        if (this._shadow) {
            this._shadow.remove();
        }

        this._shadow = target.copy();
        this._shadow.setSymbol(target._getInternalSymbol());
        var shadow = this._shadow;
        if (target.options['dragShadow']) {
            var symbol = lowerSymbolOpacity(shadow._getInternalSymbol(), 0.5);
            shadow.setSymbol(symbol);
        }
        shadow.setId(null);
        //copy connectors
        var shadowConnectors = [];
        if (ConnectorLine._hasConnectors(target)) {
            var connectors = ConnectorLine._getConnectors(target);

            for (let i = 0, l = connectors.length; i < l; i++) {
                let targetConn = connectors[i];
                let connOptions = targetConn.config(),
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
        var map = this.target.getMap(),
            layer = this.target.getLayer();
        this._dragStageLayer = map.getLayer(DRAG_STAGE_LAYER_ID);
        if (!this._dragStageLayer) {
            this._dragStageLayer = new VectorLayer(DRAG_STAGE_LAYER_ID, {
                'drawImmediate': true
            });
            map.addLayer(this._dragStageLayer);
        }
        //copy resources to avoid repeat resource loading.
        var resources = new ResourceCache();
        resources.merge(layer._getRenderer().resources);
        this._dragStageLayer._getRenderer().resources = resources;
    }

    _dragging(param) {
        var target = this.target;
        var map = target.getMap(),
            eventParam = map._parseEvent(param['domEvent']);

        var domEvent = eventParam['domEvent'];
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
        var axis = this._shadow.options['dragOnAxis'];
        var currentPos = eventParam['coordinate'];
        if (!this._lastPos) {
            this._lastPos = currentPos;
        }
        var dragOffset = currentPos.substract(this._lastPos);
        if (axis === 'x') {
            dragOffset.y = 0;
        } else if (axis === 'y') {
            dragOffset.x = 0;
        }
        this._lastPos = currentPos;
        this._shadow.translate(dragOffset);
        if (!target.options['dragShadow']) {
            target.translate(dragOffset);
        }
        eventParam['dragOffset'] = dragOffset;
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
        var target = this.target,
            map = target.getMap();
        if (this._dragHandler) {
            target.off('click', this._endDrag, this);
            this._dragHandler.disable();
            delete this._dragHandler;
        }
        if (!map) {
            return;
        }
        var eventParam;
        if (map) {
            eventParam = map._parseEvent(param['domEvent']);
        }
        target.off('symbolchange', this._onTargetUpdated, this);

        if (!target.options['dragShadow']) {
            target.show();
        }
        var shadow = this._shadow;
        if (shadow) {
            if (target.options['dragShadow']) {
                target.setCoordinates(shadow.getCoordinates());
            }
            shadow._fireEvent('dragend', eventParam);
            shadow.remove();
            delete this._shadow;
        }
        if (this._shadowConnectors) {
            map.getLayer(DRAG_STAGE_LAYER_ID).removeGeometry(this._shadowConnectors);
            delete this._shadowConnectors;
        }
        delete this._lastPos;

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
        if (this._dragStageLayer) {
            this._dragStageLayer.remove();
        }
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
