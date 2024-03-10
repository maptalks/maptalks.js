import Handler from '../../handler/Handler';
import Map from '../Map';
declare class MapBoxZoomHander extends Handler {
    target: Map;
    drawTool: any;
    constructor(target: any);
    addHooks(): void;
    removeHooks(): void;
    _onMouseDown(param: any): void;
    _boxZoom(param: any): void;
}
export default MapBoxZoomHander;
