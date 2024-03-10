import Handler from '../../handler/Handler';
import Point from '../../geo/Point';
import Map from '../Map';
declare class MapTouchZoomHandler extends Handler {
    target: Map;
    preY: number;
    _startP1: Point;
    _startP2: Point;
    _startDist: number;
    _startVector: Point;
    _startZoom: number;
    _startBearing: number;
    mode: string;
    _scale: number;
    _Origin: any;
    addHooks(): void;
    removeHooks(): void;
    _onTouchStart(event: any): void;
    _onTouchMove(event: any): void;
    _startTouching(param: any): void;
    _onTouchEnd(event: any): void;
}
export default MapTouchZoomHandler;
