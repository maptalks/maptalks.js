import { offsetDom } from 'core/util/dom';
import Class from 'core/Class';
import { Animation } from 'core/Animation';
import Point from 'geo/Point';

/**
 * @classdesc
 * Base class for all the map renderers.
 * @class
 * @abstract
 * @protected
 * @memberOf renderer.map
 * @name Renderer
 * @extends {Class}
 */
export default class MapRenderer extends Class {

    constructor(map) {
        super();
        this.map = map;
        this._handlerQueue = {};
    }

    callInFrameLoop(fn) {
        this._handlerQueue.push(fn);
    }

    executeFrameCallbacks() {
        const running = this._handlerQueue;
        this._handlerQueue = [];
        for (let i = 0, l = running.length; i < l; i++) {
            running[i]();
        }
    }

    panAnimation(target, t, onFinish) {
        if (this._panPlayer && this._panPlayer.playState === 'running') {
            return;
        }
        const map = this.map,
            pcenter = map._getPrjCenter().copy(),
            ptarget = map.getProjection().project(target),
            distance = ptarget.sub(pcenter);
        if (map.options['panAnimation']) {
            let duration;
            if (!t) {
                duration = map.options['panAnimationDuration'];
            } else {
                duration = t;
            }
            const renderer = map._getRenderer();
            const framer = function (fn) {
                renderer.callInFrameLoop(fn);
            };

            const player = this._panPlayer = Animation.animate({
                'distance': distance
            }, {
                'easing': 'out',
                'duration': duration,
                'framer' : framer
            }, frame => {
                if (map.isRemoved()) {
                    player.finish();
                    return;
                }
                if (player.playState === 'running' && (map.isZooming() || map.isDragRotating())) {
                    player.finish();
                    return;
                }

                if (player.playState === 'running' && frame.styles['distance']) {
                    const offset = frame.styles['distance'];
                    map._setPrjCenter(pcenter.add(offset));
                    map.onMoving();
                } else if (player.playState === 'finished') {
                    if (!player._interupted) {
                        map._setPrjCenter(ptarget);
                    }
                    if (onFinish) {
                        onFinish();
                    }
                    map.onMoveEnd();
                }
            });
            player.play();
            if (!map.isMoving()) {
                map.onMoveStart();
            }
        } else {
            map.onMoveEnd();
        }
    }

    stopPanAnimation() {
        if (this._panPlayer) {
            this._panPlayer._interupted = true;
            this._panPlayer.finish();
        }
        delete this._panPlayer;
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
        const pos = this.map.offsetPlatform().add(offset)._round();
        const panels = this.map._panels;
        if (panels.backLayer.firstChild) {
            offsetDom(panels.back, pos);
        }
        if (panels.frontLayer.firstChild || panels.ui.firstChild) {
            offsetDom(this.map._panels.front, pos);
        }
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
