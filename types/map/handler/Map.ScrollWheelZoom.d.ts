import Handler from '../../handler/Handler';
import Map from '../Map';
declare class MapScrollWheelZoomHandler extends Handler {
    target: Map;
    _thisScrollZoom: Function;
    _wheelZoomRate: number;
    _defaultZoomRate: number;
    _delta: number;
    _zooming: boolean;
    _trackPadSuspect: number;
    _ensureTrackpad: boolean;
    _lastWheelEvent: MouseEvent;
    _zoomOrigin: any;
    _active: boolean;
    _timeout: number;
    _requesting: number;
    _origin: any;
    _startZoom: number;
    constructor(target: any);
    addHooks(): void;
    removeHooks(): void;
    _onWheelScroll(evt: any): boolean | void;
    _seamless(evt: any, origin: any): void;
    _start(): void;
    _scrollZoom(): void;
    _interval(evt: any, origin: any): boolean;
}
export default MapScrollWheelZoomHandler;
