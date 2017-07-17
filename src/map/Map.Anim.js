import { Animation } from 'core/Animation';
import Coordinate from 'geo/Coordinate';
import Point from 'geo/Point';
import Map from './Map';
import { isNil, isFunction, hasOwn } from 'core/util';

Map.include({
    animateTo(view, options = {}) {
        const projection = this.getProjection(),
            currView = this.getView(),
            props = {};
        let empty = true, ptarget;
        for (const p in view) {
            if (hasOwn(view, p) && !isNil(currView[p])) {
                empty = false;
                if (p === 'center') {
                    ptarget = projection.project(new Coordinate(view[p]));
                    props[p] = [projection.project(new Coordinate(currView[p])), ptarget];
                } else if (currView[p] !== view[p] && p !== 'around') {
                    props[p] = [currView[p], view[p]];
                }
            }
        }
        if (empty) {
            return this;
        }
        const zoomOrigin = view['around'] || new Point(this.width / 2, this.height / 2);
        const renderer = this._getRenderer(),
            framer = function (fn) {
                renderer.callInNextFrame(fn);
            };

        const player = this._animPlayer = Animation.animate(props, {
            'easing': 'out',
            'duration': options['duration'] || this.options['zoomAnimationDuration'],
            'framer' : framer
        }, frame => {
            if (this.isRemoved()) {
                player.finish();
                return;
            }
            if (player.playState === 'running') {
                if (frame.styles['center']) {
                    const center = frame.styles['center'];
                    this._setPrjCenter(center);
                    this.onMoving();
                }
                if (!isNil(frame.styles['zoom'])) {
                    this.onZooming(frame.styles['zoom'], zoomOrigin);
                }
                if (!isNil(frame.styles['pitch'])) {
                    this.setPitch(frame.styles['pitch']);
                }
                if (!isNil(frame.styles['bearing'])) {
                    this.setBearing(frame.styles['bearing']);
                }
            } else if (player.playState === 'finished') {
                if (!player._interupted) {
                    if (ptarget) {
                        this._setPrjCenter(ptarget);
                    }
                    if (!isNil(props['zoom'])) {
                        this.onZoomEnd(props['zoom'][1], zoomOrigin);
                    }
                    if (!isNil(props['pitch'])) {
                        this.setPitch(props['pitch'][1]);
                    }
                    if (!isNil(props['bearing'])) {
                        this.setBearing(props['bearing'][1]);
                    }
                }
                this.onMoveEnd();
                if (isFunction(options['onFinish'])) {
                    options['onFinish']();
                }
            }
        });
        this._startAnim(props, zoomOrigin);
        player.play();
        return this;
    },

    _startAnim(props, zoomOrigin) {
        if (props['center']) {
            this.onMoveStart();
        }
        if (props['zoom']) {
            this.onZoomStart(props['zoom'][1], zoomOrigin);
        }
    },

    _stopAnim() {
        if (this._animPlayer) {
            this._animPlayer._interupted = true;
            this._animPlayer.finish();
        }
        delete this._animPlayer;
    }
});
