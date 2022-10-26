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
        this._handlerQueue = [];
        this._thisDocVisibilitychange = this._onDocVisibilitychange.bind(this);
        this._thisDocDragStart = this._onDocDragStart.bind(this);
        this._thisDocDragEnd = this._onDocDragEnd.bind(this);
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
    offsetPlatform(offset, force) {
        if (!this.map._panels.front) {
            return this;
        }
        if (!force && offset.x === 0 && offset.y === 0) {
            return this;
        }
        const panels = this.map._panels;
        const hasFront = this._frontCount = panels.back.layerDOM.childElementCount;
        const hasBack = this._backCount = panels.front.layerDOM.childElementCount;
        const hasUI = this._uiCount = panels.front.uiDOM.childElementCount;
        if (hasFront || hasBack || hasUI) {
            let pos = this.map.offsetPlatform();
            if (offset) {
                pos = pos.add(offset)._round();
            } else {
                pos = pos.round();
            }
            if (hasBack) {
                offsetDom(panels.back, pos);
            }
            if (hasFront || hasUI) {
                offsetDom(panels.front, pos);
            }
        }
        return this;
    }

    domChanged() {
        const panels = this.map._panels;
        if (!panels.front) {
            return false;
        }
        const frontCount = panels.back.layerDOM.childElementCount;
        if (this._frontCount === undefined || this._frontCount !== frontCount) {
            return true;
        }
        const backCount = panels.front.layerDOM.childElementCount;
        if (this._backCount === undefined || this._backCount !== backCount) {
            return true;
        }
        const uiCount = panels.front.uiDOM.childElementCount;
        if (this._uiCount === undefined || this._uiCount !== uiCount) {
            return true;
        }
        return false;
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

    _onDocVisibilitychange() {
        if (document.visibilityState !== 'visible') {
            return;
        }
        this.setToRedraw();
    }

    _getWrapPanel() {
        if (!this.map) {
            return null;
        }
        const panels = this.map.getPanels();
        return panels && panels.mapWrapper;
    }
    _onDocDragStart() {
        const wrapPanel = this._getWrapPanel();
        if (wrapPanel) {
            wrapPanel.style.overflow = 'visible';
        }
        return;
    }

    _onDocDragEnd() {
        const wrapPanel = this._getWrapPanel();
        if (wrapPanel) {
            wrapPanel.style.overflow = 'hidden';
        }
        return;
    }

    _containerIsOffscreen() {
        const container = this.map.getContainer();
        if (!container || !container.style || container.style.display === 'none') {
            return true;
        }
        const minSize = Math.min(container.clientWidth, container.clientHeight);
        return minSize <= 0;
    }
}

export default MapRenderer;
