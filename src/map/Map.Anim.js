import { Animation } from 'core/Animation';
import Coordinate from 'geo/Coordinate';
import Point from 'geo/Point';
import Map from './Map';
import { isNil, isFunction, hasOwn } from 'core/util';

function equalView(view1, view2) {
    for (const p in view1) {
        if (hasOwn(view1, p)) {
            if (p === 'center') {
                if (view1[p][0] !== view2[p][0] || view1[p][1] !== view2[p][1]) {
                    return false;
                }
            } else if (view1[p] !== view2[p]) {
                return false;
            }
        }
    }
    return true;
}

Map.include({
    animateTo(view, options = {}) {
        const projection = this.getProjection(),
            currView = this.getView(),
            props = {};
        let empty = true;
        for (const p in view) {
            if (hasOwn(view, p) && !isNil(currView[p])) {
                empty = false;
                if (p === 'center') {
                    props[p] = [projection.project(new Coordinate(currView[p])), projection.project(new Coordinate(view[p]))];
                } else if (currView[p] !== view[p] && p !== 'around') {
                    props[p] = [currView[p], view[p]];
                }
            }
        }
        if (empty) {
            return this;
        }
        const zoomOrigin = view['around'] || new Point(this.width / 2, this.height / 2);
        let preView = this.getView();
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
                const view = this.getView();
                if (!equalView(view, preView)) {
                    // map's view is updated and stop animation
                    this._stopAnim();
                    return;
                }
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
                preView = this.getView();
                this._fireEvent('animating');
            } else if (player.playState === 'finished') {
                if (!player._interupted) {
                    if (props['center']) {
                        this._setPrjCenter(props['center'][1]);
                    }
                    if (!isNil(props['pitch'])) {
                        this.setPitch(props['pitch'][1]);
                    }
                    if (!isNil(props['bearing'])) {
                        this.setBearing(props['bearing'][1]);
                    }
                }
                this._endAnim(props, zoomOrigin);
                if (isFunction(options['onFinish'])) {
                    options['onFinish']();
                }
            }
        });
        if (!this.isTransforming() && (props['pitch'] || props['bearing'])) {
            // force tilelayer render with pitch and bearing, to fix the incorrect offset of tiles if animation starts without pitch and bearing.
            if (props['pitch']) {
                this.setPitch(1);
            } else {
                this.setBearing(1);
            }
            renderer.callInNextFrame(() => {
                preView = this.getView();
                this._startAnim(props, zoomOrigin);
            });
        } else {
            this._startAnim(props, zoomOrigin);
        }

        return this;
    },

    _endAnim(props, zoomOrigin) {
        if (props['center']) {
            this.onMoveEnd();
        }
        if (!isNil(props['zoom'])) {
            this.onZoomEnd(props['zoom'][1], zoomOrigin);
        }
        if (this._animPlayer) {
            this._fireEvent(this._animPlayer._interupted ? 'animateinterupted' : 'animateend');
            delete this._animPlayer;
        }
    },

    _startAnim(props, zoomOrigin) {
        if (!this._animPlayer) {
            return;
        }
        if (props['center']) {
            this.onMoveStart();
        }
        if (props['zoom']) {
            this.onZoomStart(props['zoom'][1], zoomOrigin);
        }
        this._animPlayer.play();
        this._fireEvent('animatestart');
    },

    _stopAnim() {
        if (this._animPlayer) {
            this._animPlayer._interupted = true;
            this._animPlayer.finish();
        }
    }
});
