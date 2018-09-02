import { Animation } from '../core/Animation';
import Coordinate from '../geo/Coordinate';
import Point from '../geo/Point';
import Map from './Map';
import { isNil, isFunction, hasOwn } from '../core/util';

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

Map.include(/** @lends Map.prototype */{

    /**
     * Update map's view with animation.
     * @example
     * map.animateTo({
     *     zoom : 13,
     *     center : [0, 0],
     *     pitch : 30,
     *     bearing : 60
     * }, {
     *     duration : 6000,
     *     easing : 'out'
     * }, function(frame) {
     *     if (frame.state.playState === 'finished') {
     *         console.log('animation finished');
     *     }
     * });
     * @param  {Object} view    view object
     * @param  {Object} [options=null]
     * @param  {String} [options.easing=out]
     * @param  {Number} [options.duration=map.options.zoomAnimationDuration]
     * @param  {Function} [step=null]  - step function during animation, animation frame as the parameter
     * @return {Map}         this
     */
    animateTo(view, options = {}, step) {
        this._stopAnim(this._animPlayer);
        if (isFunction(options)) {
            step = options;
            options = {};
        }
        const projection = this.getProjection(),
            currView = this.getView(),
            props = {};
        let empty = true;
        for (const p in view) {
            if (hasOwn(view, p) && !isNil(currView[p])) {
                empty = false;
                if (p === 'center') {
                    const from = new Coordinate(currView[p]).toFixed(7),
                        to = new Coordinate(view[p]).toFixed(7);
                    if (!from.equals(to)) {
                        props['center'] = [from, to];
                    }
                } else if (currView[p] !== view[p] && p !== 'around') {
                    props[p] = [currView[p], view[p]];
                }
            }
        }
        if (empty) {
            return null;
        }
        const zoomOrigin = view['around'] || new Point(this.width / 2, this.height / 2);
        let preView = this.getView();
        const renderer = this._getRenderer(),
            framer = function (fn) {
                renderer.callInNextFrame(fn);
            };

        const player = this._animPlayer = Animation.animate(props, {
            'easing': options['easing'] || 'out',
            'duration': options['duration'] || this.options['zoomAnimationDuration'],
            'framer' : framer
        }, frame => {
            if (this.isRemoved()) {
                player.finish();
                return;
            }
            if (player.playState === 'running') {
                const view = this.getView();
                if (!options['continueOnViewChanged'] && !equalView(view, preView)) {
                    // map's view is updated by another operation, animation should stop
                    this._stopAnim(player);
                    return;
                }
                if (frame.styles['center']) {
                    const center = frame.styles['center'];
                    this._setPrjCenter(projection.project(center));
                    this.onMoving(this._parseEventFromCoord(this.getCenter()));
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
                /**
                 * fired when map is animating.  (panning, zooming, rotating)
                 *
                 * @event Map#animating
                 * @type {Object}
                 * @property {String} type - animating
                 * @property {Map} target - the map fires the event
                 */
                this._fireEvent('animating');
            } else if (player.playState === 'finished') {
                if (!player._interupted) {
                    if (props['center']) {
                        this._setPrjCenter(projection.project(props['center'][1]));
                    }
                    if (!isNil(props['pitch'])) {
                        this.setPitch(props['pitch'][1]);
                    }
                    if (!isNil(props['bearing'])) {
                        this.setBearing(props['bearing'][1]);
                    }
                }
                this._endAnim(player, props, zoomOrigin, options);
                preView = this.getView();
            }
            if (step) {
                step(frame);
            }
        });

        this._startAnim(props, zoomOrigin);

        return player;
    },

    /**
     * Whether the map is animating with .animateTo
     * @return {Boolean}
     */
    isAnimating() {
        return !!(this._animPlayer);
    },

    isRotating() {
        return this.isDragRotating() || !!this._animRotating;
    },

    _endAnim(player, props, zoomOrigin, options) {
        delete this._animRotating;
        /**
         * fired when map's animation is interrupted by mouse event or else.
         *
         * @event Map#animateinterrupted
         * @type {Object}
         * @property {String} type - animateinterrupted
         * @property {Map} target - the map fires the event
         */
        /**
         * fired when map's animation ended (panning, zooming, rotating).
         *
         * @event Map#animateend
         * @type {Object}
         * @property {String} type - animateend
         * @property {Map} target - the map fires the event
         */
        const evtType = player._interupted ? 'animateinterrupted' : 'animateend';
        if (player === this._animPlayer) {
            delete this._animPlayer;
        }
        if (props['center']) {
            let endCoord;
            if (player._interupted) {
                endCoord = this.getCenter();
            } else {
                endCoord = props['center'][1];
            }
            this.onMoveEnd(this._parseEventFromCoord(endCoord));
        }
        if (!isNil(props['zoom'])) {
            if (player._interupted) {
                this.onZoomEnd(this.getZoom(), zoomOrigin);
            } else if (!options['wheelZoom']) {
                this.onZoomEnd(props['zoom'][1], zoomOrigin);
            } else {
                this.onZooming(props['zoom'][1], zoomOrigin);
            }
        }
        if (evtType) {
            this._fireEvent(evtType);
        }
        if (!isNil(props['pitch']) && !this.getPitch()) {
            //https://github.com/maptalks/maptalks.js/issues/732
            //fix blank map when pitch changes to 0
            this.getRenderer().setToRedraw();
        }
    },

    _startAnim(props, zoomOrigin) {
        if (!this._animPlayer) {
            return;
        }
        if (props['center']) {
            this.onMoveStart();
        }
        if (props['zoom'] && !this.isZooming()) {
            this.onZoomStart(props['zoom'][1], zoomOrigin);
        }
        if (props['pitch'] || props['bearing']) {
            this._animRotating = true;
        }
        /**
         * fired when map starts to animate (panning, zooming, rotating).
         *
         * @event Map#animatestart
         * @type {Object}
         * @property {String} type - animatestart
         * @property {Map} target - the map fires the event
         */
        this._fireEvent('animatestart');
        this._animPlayer.play();
    },

    _stopAnim(player) {
        if (player && player.playState !== 'finished') {
            player._interupted = true;
            player.finish();
        }
    }
});
