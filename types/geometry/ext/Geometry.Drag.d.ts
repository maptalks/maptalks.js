import Handler from '../../handler/Handler';
import Geometry from '../Geometry';
import DragHandler from '../../handler/Drag';
import Coordinate from './../../geo/Coordinate';
import Point from './../../geo/Point';
/**
 * Drag handler for geometries.
 * @category handler
 * @extends Handler
 * @ignore
 */
declare class GeometryDragHandler extends Handler {
    container: HTMLDivElement;
    _dragHandler: DragHandler;
    _shadow: Geometry;
    _dragStageLayer: any;
    _shadowConnectors: any;
    _lastCoord: Coordinate;
    _lastPoint: Point;
    _startParam: any;
    _moved: boolean;
    _isDragging: boolean;
    /**
     * @param  {Geometry} target geometry target to drag
     */
    constructor(target: any);
    addHooks(): void;
    removeHooks(): void;
    _prepareDragHandler(): void;
    _prepareShadow(): void;
    _updateShadowSymbol(shadow: any, target: any): void;
    _prepareShadowConnectors(): void;
    _onTargetUpdated(): void;
    _prepareDragStageLayer(): void;
    _startDrag(param: any): void;
    _dragging(param: any): void;
    _endDrag(param?: any): void;
    isDragging(): boolean;
    _updateTargetAndRemoveShadow(eventParam: any): void;
    _correctCoord(coord: any): any;
}
export default GeometryDragHandler;
