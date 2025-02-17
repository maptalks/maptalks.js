import { INTERNAL_LAYER_PREFIX } from '../../core/Constants';
import { lowerSymbolOpacity } from '../../core/util/style';
import { on, off } from '../../core/util/dom';
import Browser from '../../core/Browser';
import Handler from '../../handler/Handler';
import Geometry from '../Geometry';
import DragHandler from '../../handler/Drag';
import { ConnectorLine } from '../ConnectorLine';
import { ResourceCache } from '../../renderer/layer/CanvasRenderer';
import Point from '../../geo/Point';
import Coordinate from '../../geo/Coordinate';

const DRAG_STAGE_LAYER_ID = INTERNAL_LAYER_PREFIX + '_drag_stage';

const EVENTS = Browser.touch ? 'touchstart mousedown' : 'mousedown';


export function fixDragPointCoordinates(geometry: Geometry, dragContainerPoint: Point, dragCoordinates: Coordinate) {
    const editCenter = geometry._getEditCenter();
    const map = geometry.getMap();
    if (!editCenter || editCenter.z === 0) {
        return dragCoordinates || map.containerPointToCoord(dragContainerPoint);
    }
    const altitude = editCenter.z;
    const glRes = map.getGLRes();
    //coordinates to glpoint
    const renderPoints = map.coordToPointAtRes(editCenter, glRes);
    //没有海拔下的屏幕坐标
    const point1 = map._pointAtResToContainerPoint(renderPoints, glRes, 0);
    //有海拔下的屏幕坐标
    const point2 = map._pointAtResToContainerPoint(renderPoints, glRes, altitude);
    //屏幕坐标的偏移量
    const offset = point2.sub(point1);
    const containerPoint = dragContainerPoint.sub(offset);
    const coordiantes = map.containerPointToCoord(containerPoint);
    coordiantes.z = 0;
    const isPoint = !geometry.getGeometries && geometry.isPoint;
    if (isPoint) {
        coordiantes.z = altitude;
    }
    return coordiantes;


}
/**
 * 几何图形的拖动处理程序
 * @english
 * Drag handler for geometries.
 * @category handler
 * @extends Handler
 * @ignore
 */
class GeometryDragHandler extends Handler {

    container: any

    //@internal
    _dragHandler: any
    //@internal
    _shadow: any
    //@internal
    _dragStageLayer: any
    //@internal
    _shadowConnectors: any
    //@internal
    _lastCoord: any
    //@internal
    _lastPoint: any
    //@internal
    _startParam: any
    //@internal
    _moved: boolean
    //@internal
    _isDragging: boolean


    /**
     * @param  {Geometry} target geometry target to drag
     */
    constructor(target) {
        super(target);
    }

    addHooks(): void {
        this.target.on(EVENTS, this._startDrag, this);
    }

    removeHooks(): void {
        this._endDrag();
        this.target.off(EVENTS, this._startDrag, this);
        delete this.container;
    }

    //@internal
    _prepareDragHandler(): void {
        this._dragHandler = new DragHandler(this.container);
        this._dragHandler.on('dragging', this._dragging, this)
            .on('mouseup', this._endDrag, this)
            .enable();
    }

    //@internal
    _prepareShadow(): void {
        const target = this.target;
        const needShadow = target.getLayer().options['renderer'] === 'canvas';
        if (!needShadow) {
            return;
        }
        if (!target.options.dragShadow) {
            return;
        }
        this._prepareDragStageLayer();
        if (this._shadow) {
            this._shadow.remove();
        }
        const shadow = this._shadow = target.copy();
        if (shadow.getGeometries) {
            const shadows = shadow.getGeometries();
            const geos = target.getGeometries();
            shadows.forEach((g, i) => {
                this._updateShadowSymbol(g, geos[i]);
            });
        } else {
            this._updateShadowSymbol(shadow, target);
        }

        shadow.setId(null);
        this._prepareShadowConnectors();
    }

    //@internal
    _updateShadowSymbol(shadow: any, target: any): void {
        shadow.setSymbol(target._getInternalSymbol());
        if (target.options['dragShadow']) {
            const symbol = lowerSymbolOpacity(shadow._getInternalSymbol(), 0.5);
            shadow.setSymbol(symbol);
        }
    }

    //@internal
    _prepareShadowConnectors(): void {
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

    //@internal
    _onTargetUpdated(): void {
        if (this._shadow) {
            this._shadow.setSymbol(this.target._getSymbol());
        }
    }

    //@internal
    _prepareDragStageLayer(): void {
        const map = this.target.getMap(),
            layer = this.target.getLayer();
        const prevLayer = map.getLayer(DRAG_STAGE_LAYER_ID);
        if (prevLayer) {
            prevLayer.remove();
        }

        const layerClazz = layer.constructor;
        this._dragStageLayer = new layerClazz(DRAG_STAGE_LAYER_ID, {
            enableAltitude: layer.options['enableAltitude'],
            altitudeProperty: layer.options['altitudeProperty']
        });
        map.addLayer(this._dragStageLayer);
        //copy resources to avoid repeat resource loading.
        const resources = new ResourceCache();
        resources.merge(layer._getRenderer().resources);
        this._dragStageLayer._getRenderer().resources = resources;
    }

    //@internal
    _startDrag(param: any): void {
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
        this.container = map.getPanels().mapWrapper || map.getContainer();
        this.target.on('click', this._endDrag, this);
        // this._lastCoord = this._correctCoord(param['coordinate']);
        const coordinates = this._correctCoord(param['coordinate']);
        this._lastCoord = fixDragPointCoordinates(this.target, param['containerPoint'], coordinates);
        this._lastPoint = param['containerPoint'];
        this._prepareDragHandler();
        this._dragHandler.onMouseDown(param['domEvent']);

        on(this.container, 'mouseleave', this._endDrag, this);
        this._startParam = param;
        this._moved = false;

        return;
    }

    //@internal
    _dragging(param: any): void {
        const target = this.target;
        const map = target.getMap();
        if (map._isEventOutMap(param['domEvent'])) {
            return;
        }
        const e = map._parseEvent(param['domEvent']);

        const domEvent = e['domEvent'];
        if (domEvent.touches && domEvent.touches.length > 1) {
            return;
        }
        if (map._isContainerPointOutOfMap(e.containerPoint)) {
            return;
        }
        if (!this._moved) {
            this._moved = true;
            target.on('symbolchange', this._onTargetUpdated, this);
            this._isDragging = true;
            this._prepareShadow();
            if (this._shadow) {
                if (!target.options['dragShadow']) {
                    target.hide();
                }
                this._shadow._fireEvent('dragstart', e);
            }
            /**
             * 拖拽开始事件
             * @english
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
        const geo = this._shadow || target;
        const axis = geo.options['dragOnAxis'],
            dragOnScreenAxis = geo.options['dragOnScreenAxis'],
            point = e['containerPoint'];
        let coord = e['coordinate'];

        this._lastPoint = this._lastPoint || point;
        this._lastCoord = this._lastCoord || coord;
        // drag direction is ScreenCoordinates,The direction of the drag has nothing to do with the map rotation(bearing)
        if (dragOnScreenAxis) {
            if (axis === 'x') {
                point.y = this._lastPoint.y;
            } else if (axis === 'y') {
                point.x = this._lastPoint.x;
            }
            coord = map.containerPointToCoord(point);
        } else {
            coord = this._correctCoord(coord);
        }
        coord = fixDragPointCoordinates(target, e['containerPoint'], coord);
        const pointOffset = point.sub(this._lastPoint);
        const coordOffset = coord.sub(this._lastCoord);
        if (!dragOnScreenAxis) {
            if (axis === 'x') {
                pointOffset.y = coordOffset.y = 0;
            } else if (axis === 'y') {
                pointOffset.x = coordOffset.x = 0;
            }
        }
        this._lastPoint = point;
        this._lastCoord = coord;
        const isPoint = !geo.getGeometries && geo.isPoint;
        isPoint ? geo.setCoordinates(coord) : geo.translate(coordOffset);
        if (geo !== target && !target.options['dragShadow']) {
            isPoint ? target.setCoordinates(coord) : target.translate(coordOffset);
        }
        e['coordOffset'] = coordOffset;
        e['pointOffset'] = pointOffset;
        geo._fireEvent('dragging', e);

        /**
         * 正在拖拽事件
         * @english
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
        if (geo !== target) {
            target._fireEvent('dragging', e);
        }
    }

    //@internal
    _endDrag(param?: any): void {
        if (this._dragHandler) {
            this._dragHandler.disable();
            delete this._dragHandler;
        }
        if (this.container) {
            // @ts-expect-error todo 待补充off参数类型
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
                 * 拖拽结束事件
                 * @english
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

    isDragging(): boolean {
        if (!this._isDragging) {
            return false;
        }
        return true;
    }

    //@internal
    _updateTargetAndRemoveShadow(eventParam: any): void {
        if (!this._shadow) {
            return;
        }
        const target = this.target,
            map = target.getMap();
        if (!target.options['dragShadow']) {
            target.show();
        }
        const shadow = this._shadow;
        if (shadow) {
            if (target.options['dragShadow']) {
                const shadowFirst = shadow.getFirstCoordinate();
                const first = target.getFirstCoordinate();
                const offset = shadowFirst.sub(first);
                target.translate(offset);
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
            this._dragStageLayer._getRenderer().resources = new ResourceCache();
            this._dragStageLayer.remove();
        }
    }

    //find correct coordinate for coordOffset if geometry has altitude
    //@internal
    _correctCoord(coord: any): any {
        const map = this.target.getMap();
        if (!map.getPitch()) {
            return coord;
        }
        const target = this.target;
        if (!target.getMinAltitude()) {
            return coord;
        }
        const alt = (target.getMinAltitude() + target.getMaxAltitude()) / 2;
        return map.locateByPoint(coord, 0, -alt);
    }
}

Geometry.mergeOptions({
    'draggable': false,
    'dragShadow': true,
    'dragOnAxis': null,
    'dragOnScreenAxis': false
});

Geometry.addInitHook('addHandler', 'draggable', GeometryDragHandler);


declare module "../Geometry" {

    interface Geometry {
        isDragging(): boolean;
    }
}


Geometry.include(/** @lends Geometry.prototype */ {
    /**
     * 是否正在拖到几何体
     * @english
     * Whether the geometry is being dragged.
     * @reutrn {Boolean}
     */
    isDragging(): boolean {
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
