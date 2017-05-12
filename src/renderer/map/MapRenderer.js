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

    addEventHandler(fn) {
        this._handlerQueue.push(fn);
    }

    executeEventHandlers() {
        const running = this._handlerQueue;
        this._handlerQueue = [];
        for (let i = 0, l = running.length; i < l; i++) {
            running[i]();
        }
    }

    panAnimation(distance, t, onFinish) {
        distance = new Point(distance);
        const map = this.map;
        if (map.options['panAnimation']) {
            let duration;
            if (!t) {
                duration = map.options['panAnimationDuration'];
            } else {
                duration = t;
            }
            const renderer = map._getRenderer();
            const framer = function (fn) {
                renderer.addEventHandler(fn);
            };
            let preDist = null;
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
                    const dist = frame.styles['distance'];
                    if (!preDist) {
                        preDist = dist;
                    }
                    const offset = dist.sub(preDist);
                    map._offsetCenterByPixel(offset);
                    preDist = dist;
                    map.onMoving();
                } else if (player.playState === 'finished') {
                    if (onFinish) {
                        onFinish();
                    }
                    map.onMoveEnd();
                }
            });
            player.play();
        } else {
            map.onMoveEnd();
        }
    }

    stopPanAnimation() {
        if (this._panPlayer) {
            this._panPlayer.finish();
        }
        delete this._panPlayer;
    }

    /**
     * 获取地图容器偏移量或更新地图容器偏移量
     * @param  {Point} offset 偏移量
     * @return {this | Point}
     */
    offsetPlatform(offset) {
        if (!this.map._panels.front) {
            return this;
        }
        const pos = this.map.offsetPlatform().add(offset)._round();
        offsetDom(this.map._panels.back, pos);
        offsetDom(this.map._panels.front, pos);
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
