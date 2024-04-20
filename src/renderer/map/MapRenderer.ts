import { offsetDom } from '../../core/util/dom';
import Class from '../../core/Class';
import Point from '../../geo/Point';
import type { WithUndef } from '../../types/typings';

import type Map from '../../map/Map';

type handlerQueueFn = () => void

/**
 * 所有地图渲染器的基类。
 * @english
 * Base class for all the map renderers.
 * @abstract
 * @protected
 * @memberOf renderer
 * @extends {Class}
 */
abstract class MapRenderer extends Class {
    map: Map;

    _handlerQueue: handlerQueueFn[];
    _frontCount: WithUndef<number>;
    _backCount: WithUndef<number>;
    _uiCount: WithUndef<number>;

    _thisDocVisibilitychange: () => void;
    _thisDocDragStart: () => void;
    _thisDocDragEnd: () => void;
    _thisDocDPRChange: () => void;

    constructor(map: Map) {
        super();
        this.map = map;
        this._handlerQueue = [];
        this._thisDocVisibilitychange = this._onDocVisibilitychange.bind(this);
        this._thisDocDragStart = this._onDocDragStart.bind(this);
        this._thisDocDragEnd = this._onDocDragEnd.bind(this);
        this._thisDocDPRChange = this._onDocDPRChange.bind(this);
    }

    abstract _frameLoop(f?: number): void;
    abstract setToRedraw(): void;

    callInNextFrame(fn: handlerQueueFn) {
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
     * @param offset
     * @param force
     */
    offsetPlatform(offset: Point, force?: boolean) {
        if (!this.map.getPanels().front) {
            return this;
        }
        if (!force && offset.x === 0 && offset.y === 0) {
            return this;
        }
        const panels = this.map.getPanels();
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
        const panels = this.map.getPanels();
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
        if (this.map.getPanels().front) {
            const pos = new Point(0, 0);
            offsetDom(this.map.getPanels().back, pos);
            offsetDom(this.map.getPanels().front, pos);
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

    _onDocDPRChange() {
        const map = this.map;
        if (!map || !map.options || map.options['devicePixelRatio'] || !map.checkSize || !map.getRenderer) {
            return;
        }
        const renderer = map.getRenderer();
        if (renderer) {
            map.checkSize(true);
        }
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
