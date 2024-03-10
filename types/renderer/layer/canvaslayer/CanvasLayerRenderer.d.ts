import CanvasRenderer from '../CanvasRenderer';
import Layer from '../../../layer/Layer'
import Point from '../../../geo/Point'
import PointExtent from '../../../geo/PointExtent'
export default class CanvasLayerRenderer extends CanvasRenderer {
    buffer: any;
    _predrawed: boolean;
    _drawContext: any;
    getPrepareParams(): any[];
    getDrawParams(): any[];
    onCanvasCreate(): void;
    needToRedraw(): boolean;
    draw(...args: any[]): void;
    drawOnInteracting(...args: any[]): void;
    getCanvasImage(): {
        image: any;
        layer: Layer;
        point: Point;
    };
    remove(): void;
    onZoomStart(param: any): void;
    onZooming(param: any): void;
    onZoomEnd(param: any): void;
    onMoveStart(param: any): void;
    onMoving(param: any): void;
    onMoveEnd(param: any): void;
    onResize(param: any): void;
    prepareDrawContext(): void;
    _prepareDrawParams(): (CanvasRenderingContext2D | {
        extent: PointExtent;
        maskExtent: any;
        zoom: number;
        southWest: any;
    })[];
    _drawLayer(...args: any[]): void;
    _drawLayerOnInteracting(...args: any[]): void;
}
