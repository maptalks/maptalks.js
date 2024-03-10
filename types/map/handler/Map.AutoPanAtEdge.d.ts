import Handler from '../../handler/Handler';
import Map from '../Map';
declare class MapAutoPanAtEdgeHandler extends Handler {
    target: Map;
    addHooks(): void;
    removeHooks(): void;
    _onMouseMove(event: any): void;
}
export default MapAutoPanAtEdgeHandler;
