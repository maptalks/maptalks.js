import Handler from '../../handler/Handler';
import Map from '../Map';
declare class MapGeometryEventsHandler extends Handler {
    target: Map;
    _mouseDownTime: number;
    _queryIdentifyTimeout: number;
    addHooks(): void;
    removeHooks(): void;
    _identifyGeometryEvents(domEvent: any, type: any): void;
}
export default MapGeometryEventsHandler;
