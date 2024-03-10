import { Geometry } from './../../../geometry';
import CanvasRenderer from '../CanvasRenderer';
/**
 * @classdesc
 * A parent renderer class for OverlayLayer to inherit by OverlayLayer's subclasses.
 * @protected
 * @memberOf renderer
 * @name OverlayLayerCanvasRenderer
 * @extends renderer.CanvasRenderer
 */
declare class OverlayLayerRenderer extends CanvasRenderer {
    _geosToCheck: Array<Geometry>;
    _resourceChecked: boolean;
    checkResources(): any[];
    render(): any;
    _addGeoToCheckRes(res: any): void;
    onGeometryAdd(geometries: any): void;
    onGeometryRemove(): void;
    onGeometrySymbolChange(e: any): void;
    onGeometryShapeChange(param: any): void;
    onGeometryPositionChange(param: any): void;
    onGeometryZIndexChange(param: any): void;
    onGeometryShow(param: any): void;
    onGeometryHide(param: any): void;
    onGeometryPropertiesChange(param: any): void;
    identifyAtPoint(point: any, options?: {}): void;
}
export default OverlayLayerRenderer;
