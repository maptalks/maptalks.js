import { INTERNAL_LAYER_PREFIX } from '../../core/Constants';
import { lowerSymbolOpacity } from '../../core/util/style';
import { on, off } from '../../core/util/dom';
import Browser from '../../core/Browser';
import Handler from '../../handler/Handler';
import Geometry from '../Geometry';
import DragHandler from '../../handler/Drag';
import VectorLayer from '../../layer/VectorLayer';
import { ConnectorLine } from '../ConnectorLine';
import { ResourceCache } from '../../renderer/layer/CanvasRenderer';

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
        this._endDrag();
        this.target.off(EVENTS, this._startDrag, this);
        delete this.container;
    }

    _prepareDragHandler() {
        this._dragHandler = new DragHandler(this.container);
        this._dragHandler.on('dragging', this._dragging, this)
            .on('mouseup', this._endDrag, this)
            .enable();
    }

    _prepareShadow() {
        const target = this.target;
        this._prepareDragStageLayer();
        if (this._shadow) {
            this._shadow.remove();
        }

        const shadow = this._shadow = target.copy();
        this._shadow.setSymbol(target._getInternalSymbol());
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
                enableAltitude : layer.options['enableAltitude'],
                altitudeProperty : layer.options['altitudeProperty']
            });
            map.addLayer(this._dragStageLayer);
        }
        //copy resources to avoid repeat resource loading.
        const resources = new ResourceCache();
        resources.merge(layer._getRenderer().resources);
        this._dragStageLayer._getRenderer().resources = resources;
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
        if (domEvent.touches && domEvent.touches.length > 1 || domEvent.button === 2) {
            return;
        }
        this.container = map._panels.mapWrapper || map._containerDOM;
        this.target.on('click', this._endDrag, this);
        this._lastCoord = this._correctCoord(param['coordinate']);
        this._lastPoint = param['containerPoint'];
        this._prepareDragHandler();
        this._dragHandler.onMouseDown(param['domEvent']);

        on(this.container, 'mouseleave', this._endDrag, this);
        this._startParam = param;
        this._moved = false;

        return;
    }

    _dragging(param) {
        const target = this.target;
        const map = target.getMap(),
            e = map._parseEvent(param['domEvent']);

        const domEvent = e['domEvent'];
        if (domEvent.touches && domEvent.touches.length > 1) {
            return;
        }

        if (!this._moved) {
            this._moved = true;
            target.on('symbolchange', this._onTargetUpdated, this);
            this._isDragging = true;
            this._prepareShadow();
            if (!target.options['dragShadow']) {
                target.hide();
            }
            this._shadow._fireEvent('dragstart', e);
            /**
             * drag start event
             * @event Geometry#dragstart
             * @type {Object}
             * @property {String} type           - dragstart
             * @property {Geometry} target       - the geometry fires event
             * @property {Coordinate} coordinate - coordinate of the event
             * @property {Point} containerPoint  - container point of the event
             * @property {Point} viewPoint       - view point of the event
             * @property {Event} domEvent                 - dom event
             */
            this.target._fireEvent('dragstart', this._startParam || e);
            delete this._startParam;
            return;
        }
        if (!this._shadow) {
            return;
        }
        const axis = this._shadow.options['dragOnAxis'],
            coord = this._correctCoord(e['coordinate']),
            point = e['containerPoint'];
        this._lastPoint = this._lastPoint || point;
        this._lastCoord = this._lastCoord || coord;
        const pointOffset = point.sub(this._lastPoint);
        const coordOffset = coord.sub(this._lastCoord);
        if (axis === 'x') {
            pointOffset.y = coordOffset.y = 0;
        } else if (axis === 'y') {
            pointOffset.x = coordOffset.x = 0;
        }
        this._lastPoint = point;
        this._lastCoord = coord;
        this._shadow.translate(coordOffset);
        if (!target.options['dragShadow']) {
            target.translate(coordOffset);
        }
        e['coordOffset'] = coordOffset;
        e['pointOffset'] = pointOffset;
        this._shadow._fireEvent('dragging', e);

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
        target._fireEvent('dragging', e);

    }

    _endDrag(param) {
        if (this._dragHandler) {
            this._dragHandler.disable();
            delete this._dragHandler;
        }
        if (this.container) {
            off(this.container, 'mouseleave', this._endDrag, this);
        }
        if (!this.target) {
            return;
        }
        const target = this.target;
        target.off('click', this._endDrag, this);

        target.off('symbolchange', this._onTargetUpdated, this);

        delete this._lastCoord;
        delete this._lastPoint;

        this._isDragging = false;

        const map = target.getMap();
        if (this.enabled() && map) {
            const e = map._parseEvent(param ? param['domEvent'] : null);
            this._updateTargetAndRemoveShadow(e);
            if (this._moved) {
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
                target._fireEvent('dragend', e);
            }
        }


    }

    isDragging() {
        if (!this._isDragging) {
            return false;
        }
        return true;
    }

    _updateTargetAndRemoveShadow(eventParam) {
        const target = this.target,
            map = target.getMap();
        if (!target.options['dragShadow']) {
            target.show();
        }
        const shadow = this._shadow;
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
        if (this._dragStageLayer) {
            this._dragStageLayer.remove();
        }
    }

    //find correct coordinate for coordOffset if geometry has altitude
    _correctCoord(coord) {
        const map = this.target.getMap();
        if (!map.getPitch()) {
            return coord;
        }
        const painter = this.target._getPainter();
        if (!painter.getMinAltitude()) {
            return coord;
        }
        const alt = (painter.getMinAltitude() + painter.getMaxAltitude()) / 2;
        return map.locateByPoint(coord, 0, -alt);
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
