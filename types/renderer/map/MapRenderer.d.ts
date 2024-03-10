import Class from '../../core/Class';
/**
 * @classdesc
 * Base class for all the map renderers.
 * @class
 * @abstract
 * @protected
 * @memberOf renderer
 * @extends {Class}
 */
declare class MapRenderer extends Class {
    map: any;
    _handlerQueue: Array<Function>;
    _thisDocVisibilitychange: Function;
    _thisDocDragStart: Function;
    _thisDocDragEnd: Function;
    _frontCount: number;
    _backCount: number;
    _uiCount: number;
    constructor(map: any);
    callInNextFrame(fn: any): void;
    executeFrameCallbacks(): void;
    /**
     * Move map platform with offset
     * @param  {Point} offset
     * @return {this}
     */
    offsetPlatform(offset: any, force?: any): this;
    domChanged(): boolean;
    resetContainer(): void;
    onZoomEnd(): void;
    onLoad(): void;
    _onDocVisibilitychange(): void;
    _getWrapPanel(): any;
    _onDocDragStart(): void;
    _onDocDragEnd(): void;
    _containerIsOffscreen(): boolean;
}
export default MapRenderer;
