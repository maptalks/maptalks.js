import OverlayLayerCanvasRenderer from './OverlayLayerCanvasRenderer';
import PointExtent from '../../../geo/PointExtent';
import { Geometry } from './../../../geometry';
/**
 * @classdesc
 * Renderer class based on HTML5 Canvas2D for VectorLayers
 * @protected
 * @memberOf renderer
 * @name VectorLayerCanvasRenderer
 * @extends renderer.OverlaylayerCanvasRenderer
 * @param {VectorLayer} layer - layer to render
 */
declare class VectorLayerRenderer extends OverlayLayerCanvasRenderer {
    _lastRenderTime: number;
    _imageData: ImageData;
    _geosToDraw: Array<Geometry>;
    _drawnRes: number;
    _onlyHasPoint: boolean;
    _lastCollisionTime: number;
    _lastGeosToDraw: Array<Geometry>;
    _displayExtent: PointExtent;
    _hasPoint: boolean;
    mapStateCache: object;
    _geoIsCollision(geo: any): boolean;
    getImageData(): ImageData;
    clearImageData(): void;
    checkResources(): any;
    needToRedraw(): boolean;
    /**
     * render layer
     * @param  {Geometry[]} geometries   geometries to render
     * @param  {Boolean} ignorePromise   whether escape step of promise
     */
    draw(): void;
    isBlank(): boolean;
    drawOnInteracting(): void;
    /**
     * Show and render
     * @override
     */
    show(): void;
    forEachGeo(fn: any, context?: any): void;
    drawGeos(): void;
    prepareToDraw(): void;
    checkGeo(geo: any): void;
    _collidesGeos(): this;
    onZoomEnd(): void;
    onRemove(): void;
    onGeometryPropertiesChange(param: any): void;
    _updateDisplayExtent(): void;
    identifyAtPoint(point: any, options?: {}): any;
    _updateMapStateCache(): this;
    _batchConversionMarkers(glRes: any): any[];
    _sortByDistanceToCamera(cameraPosition: any): void;
    _constructorIsThis(): boolean;
}
export default VectorLayerRenderer;
