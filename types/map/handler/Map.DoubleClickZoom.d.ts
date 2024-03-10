import Handler from '../../handler/Handler';
import Map from '../Map';
declare class MapDoubleClickZoomHandler extends Handler {
    target: Map;
    addHooks(): void;
    removeHooks(): void;
    _onDoubleClick(param: any): void;
}
export default MapDoubleClickZoomHandler;
