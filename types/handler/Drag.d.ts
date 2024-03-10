import Handler from './Handler';
import Point from '../geo/Point';
/**
 * Drag handler
 * @category handler
 * @protected
 * @extends Handler
 */
declare class DragHandler extends Handler {
    options: object;
    _onMouseDown: any;
    moved: any;
    startPos: Point;
    interupted: boolean;
    constructor(dom: any, options?: {});
    enable(): this;
    disable(): this;
    onMouseDown(event: any): void;
    onMouseMove(event: any): void;
    onMouseUp(event: any): void;
    _offEvents(): void;
}
export default DragHandler;
