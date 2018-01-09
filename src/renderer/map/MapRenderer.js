import { offsetDom } from '../../core/util/dom';
import Class from '../../core/Class';
import Point from '../../geo/Point';

/**
 * @classdesc
 * Base class for all the map renderers.
 * @class
 * @abstract
 * @protected
 * @memberOf renderer
 * @extends {Class}
 */
class MapRenderer extends Class {

    constructor(map) {
        super();
        this.map = map;
        this._handlerQueue = {};
    }

    callInNextFrame(fn) {
        this._handlerQueue.push(fn);
    }

    executeFrameCallbacks() {
        const running = this._handlerQueue;
        this._handlerQueue = [];
        for (let i = 0, l = running.length; i < l; i++) {
            running[i]();
        }
    }

    /**
     * Move map platform with offset
     * @param  {Point} offset
     * @return {this}
     */
    offsetPlatform(offset) {
        if (!this.map._panels.front) {
            return this;
        }
        if (offset.x === 0 && offset.y === 0) {
            return this;
        }
        const pos = this.map.offsetPlatform().add(offset)._round();
        const panels = this.map._panels;
        offsetDom(panels.back, pos);
        offsetDom(panels.front, pos);
        return this;
    }

    resetContainer() {
        if (!this.map) {
            return;
        }
        this.map._resetMapViewPoint();
        if (this.map._panels.front) {
            const pos = new Point(0, 0);
            offsetDom(this.map._panels.back, pos);
            offsetDom(this.map._panels.front, pos);
        }
    }

    onZoomEnd() {
        this.resetContainer();
    }

    onLoad() {
        this._frameLoop();
    }
}

export default MapRenderer;
