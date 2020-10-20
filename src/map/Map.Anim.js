import { Animation } from '../core/Animation';
import Coordinate from '../geo/Coordinate';
import Point from '../geo/Point';
import Map from './Map';
import { isNil, isFunction, hasOwn, extend, clamp } from '../core/util';

// function equalView(view1, view2) {
//     for (const p in view1) {
//         if (hasOwn(view1, p)) {
//             if (p === 'center') {
//                 if (view1[p][0] !== view2[p][0] || view1[p][1] !== view2[p][1]) {
//                     return false;
//                 }
//             } else if (view1[p] !== view2[p]) {
//                 return false;
//             }
//         }
//     }
//     return true;
// }

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
        // this._stopAnim(this._animPlayer);
        if (isFunction(options)) {
            step = options;
            options = {};
        }
        const projection = this.getProjection(),
            currView = this.getView(),
            props = {};
        let empty = true;
        for (const p in view) {
            if (hasOwn(view, p) && !isNil(view[p]) && (p === 'prjCenter' || !isNil(currView[p]))) {
                empty = false;
                if (p === 'center') {
                    const from = new Coordinate(currView[p]).toFixed(7),
                        to = new Coordinate(view[p]).toFixed(7);
                    if (!from.equals(to)) {
                        props['center'] = [from, to];
                    }
                } else if (p === 'prjCenter') {
                    const from = new Coordinate(this._getPrjCenter());
                    const to = new Coordinate(view[p]);
                    if (!from.equals(to)) {
                        props['prjCenter'] = [from, to];
                    }
                } else if (currView[p] !== view[p] && p !== 'around') {
                    props[p] = [currView[p], view[p]];
                }
            }
        }
        if (empty) {
            return null;
        }
        if (this._animPlayer) {
            if (this._isInternalAnimation) {
                if (this._animPlayer.playState === 'running') {
                    this._animPlayer.pause();
                    this._prevAnimPlayer = this._animPlayer;
                }
            } else {
                delete this._prevAnimPlayer;
                this._stopAnim(this._animPlayer);
            }
        }
        const zoomOrigin = view['around'] || new Point(this.width / 2, this.height / 2);
        // let preView = this.getView();
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
                // const view = this.getView();
                // if (!options['continueOnViewChanged'] && !equalView(view, preView)) {
                //     // map's view is updated by another operation, animation should stop
                //     this._stopAnim(player);
                //     return;
                // }
                if (frame.styles['center']) {
                    const center = frame.styles['center'];
                    this._setPrjCenter(projection.project(center));
                    this.onMoving(this._parseEventFromCoord(this.getCenter()));
                } else if (frame.styles['prjCenter']) {
                    const center = frame.styles['prjCenter'];
                    this._setPrjCenter(center);
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
                // preView = this.getView();
                /**
                 * fired when map is animating.  (panning, zooming, rotating)
                 *
                 * @event Map#animating
                 * @type {Object}
                 * @property {String} type - animating
                 * @property {Map} target - the map fires the event
                 */
                this._fireEvent('animating');
            } else if (player.playState !== 'paused' || player === this._mapAnimPlayer) {
                if (!player._interupted) {
                    if (props['center']) {
                        this._setPrjCenter(projection.project(props['center'][1]));
                    } else if (props['prjCenter']) {
                        this._setPrjCenter(props['prjCenter'][1]);
                    }
                    if (!isNil(props['pitch'])) {
                        this.setPitch(props['pitch'][1]);
                    }
                    if (!isNil(props['bearing'])) {
                        this.setBearing(props['bearing'][1]);
                    }
                }
                this._endAnim(player, props, zoomOrigin, options);
                // preView = this.getView();
            }
            if (step) {
                step(frame);
            }
        }, this);

        this._startAnim(props, zoomOrigin);

        return player;
    },

    _animateTo(view, options = {}, step) {
        if (this._mapAnimPlayer) {
            this._stopAnim(this._mapAnimPlayer);
        }
        this._isInternalAnimation = true;
        this._mapAnimPlayer = this.animateTo(view, options, step);
        delete this._isInternalAnimation;
        return this._mapAnimPlayer;
    },

    /**
     * Fly to given view in a smooth pan-zoom animation.
     * @example
     * map.flyTo({
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
     * @param  {Number} [options.duration=8]
     * @param  {Function} [step=null]  - step function during animation, animation frame as the parameter
     * @return {Map}         this
    */
    flyTo(view, options = {}, step) {
        // based on implementation of flyTo of mapbox-gl-js
        // Van Wijk, Jarke J.; Nuij, Wim A. A. “Smooth and efficient zooming and panning.” INFOVIS
        //   ’03. pp. 15–22. <https://www.win.tue.nl/~vanwijk/zoompan.pdf#page=5>.
        //
        // Where applicable, local variable documentation begins with the associated variable or
        // function in van Wijk (2003).

        if (this._animPlayer) {
            if (this._isInternalAnimation) {
                if (this._animPlayer.playState === 'running') {
                    this._animPlayer.pause();
                    this._prevAnimPlayer = this._animPlayer;
                }
            } else {
                delete this._prevAnimPlayer;
                this._stopAnim(this._animPlayer);
            }
        }

        if (isFunction(options)) {
            step = options;
            options = {};
        }
        options = extend({
            // offset: [0, 0],
            // speed: 1.2,
            curve: 1.42
        }, options);

        const map = this;
        function zoomScale(z0, z1) {
            return map.getResolution(z1) / map.getResolution(z0);
        }

        const zoomOrigin = view['around'] || new Point(this.width / 2, this.height / 2);

        const minZoom = this.getMinZoom();
        const maxZoom = this.getMaxZoom();
        const projection = this.getProjection();
        const currView = this.getView();
        const startZoom = currView.zoom;
        const startBearing = currView.bearing;
        const startPitch = currView.pitch;

        const zoom = 'zoom' in view ? clamp(+view.zoom, minZoom, maxZoom) : startZoom;
        const bearing = 'bearing' in view ? +view.bearing : startBearing;
        const pitch = 'pitch' in view ? +view.pitch : startPitch;

        const center = projection.project(view.center && new Coordinate(view.center) || this.getCenter());
        const scale = zoomScale(zoom, startZoom);
        const from = projection.project(this.getCenter());
        const delta = center.sub(from);

        let rho = options.curve;
        // w₀: Initial visible span, measured in pixels at the initial scale.
        const w0 = Math.max(this.width, this.height),
            // w₁: Final visible span, measured in pixels with respect to the initial scale.
            w1 = w0 / scale,
            // Length of the flight path as projected onto the ground plane, measured in pixels from
            // the world image origin at the initial scale.
            u1 = delta.mag();

        if ('minZoom' in options) {
            const animMinZoom = clamp(Math.min(options.minZoom, startZoom, zoom), minZoom, maxZoom);
            // w<sub>m</sub>: Maximum visible span, measured in pixels with respect to the initial
            // scale.
            const wMax = w0 / zoomScale(animMinZoom, startZoom);
            rho = Math.sqrt(wMax / u1 * 2);
        }

        // ρ²
        const rho2 = rho * rho;

        function r(i) {
            const b = (w1 * w1 - w0 * w0 + (i ? -1 : 1) * rho2 * rho2 * u1 * u1) / (2 * (i ? w1 : w0) * rho2 * u1);
            return Math.log(Math.sqrt(b * b + 1) - b);
        }

        function sinh(n) { return (Math.exp(n) - Math.exp(-n)) / 2; }
        function cosh(n) { return (Math.exp(n) + Math.exp(-n)) / 2; }
        function tanh(n) { return sinh(n) / cosh(n); }

        // r₀: Zoom-out factor during ascent.
        const r0 = r(0);

        // w(s): Returns the visible span on the ground, measured in pixels with respect to the
        // initial scale. Assumes an angular field of view of 2 arctan ½ ≈ 53°.
        let w = function (s) {
            return (cosh(r0) / cosh(r0 + rho * s));
        };

        // u(s): Returns the distance along the flight path as projected onto the ground plane,
        // measured in pixels from the world image origin at the initial scale.
        let u = function (s) {
            return w0 * ((cosh(r0) * tanh(r0 + rho * s) - sinh(r0)) / rho2) / u1;
        };

        // S: Total length of the flight path, measured in ρ-screenfuls.
        let S = (r(1) - r0) / rho;

        // When u₀ = u₁, the optimal path doesn’t require both ascent and descent.
        if (Math.abs(u1) < 0.000001 || !isFinite(S)) {
            // Perform a more or less instantaneous transition if the path is too short.
            if (Math.abs(w0 - w1) < 0.000001) return this.animateTo(view, options, step);

            const k = w1 < w0 ? -1 : 1;
            S = Math.abs(Math.log(w1 / w0)) / rho;

            u = function () { return 0; };
            w = function (s) { return Math.exp(k * rho * s); };
        }

        // let preView = this.getView();
        const renderer = this._getRenderer();
        const framer = function (fn) {
            renderer.callInNextFrame(fn);
        };
        const player = this._animPlayer = Animation.animate({ k: [0, 1] }, {
            'easing': options['easing'] || 'out',
            'duration': options['duration'] || 8,
            'framer' : framer
        }, frame => {
            if (this.isRemoved()) {
                player.finish();
                return;
            }
            const k = frame.styles.k;
            // s: The distance traveled along the flight path, measured in ρ-screenfuls.
            const s = k * S;
            const scale = 1 / w(s);
            const props = {};
            if (view.center) {
                const newCenter = k === 1 ? center : from.add(delta.multi(u(s)));
                props.prjCenter = [center, newCenter];
            }
            if (startZoom !== zoom) {
                const newZoom = k === 1 ? zoom : this.getZoomForScale(scale, startZoom, true);
                props.zoom = [startZoom, newZoom];
            }
            if (startPitch !== pitch) {
                const newPitch = interpolate(startPitch, pitch, k);
                props.pitch = [pitch, newPitch];
            }
            if (startBearing !== bearing) {
                const newBearing = interpolate(startBearing, bearing, k);
                props.bearing = [bearing, newBearing];
            }
            if (player.playState === 'running') {
                if (props['prjCenter']) {
                    const center = props['prjCenter'];
                    this._setPrjCenter(center[1]);
                    this.onMoving(this._parseEventFromCoord(this.getCenter()));
                }
                if (props['zoom']) {
                    this.onZooming(props['zoom'][1], zoomOrigin);
                }
                if (props['pitch']) {
                    this.setPitch(props['pitch'][1]);
                }
                if (props['bearing']) {
                    this.setBearing(props['bearing'][1]);
                }
                this._fireEvent('animating');
            } else if (player.playState !== 'paused' || player === this._mapAnimPlayer) {
                if (!player._interupted) {
                    if (props['prjCenter']) {
                        this._setPrjCenter(props['prjCenter'][1]);
                    }
                    if (props['pitch']) {
                        this.setPitch(props['pitch'][1]);
                    }
                    if (props['bearing']) {
                        this.setBearing(props['bearing'][1]);
                    }
                }
                this._endAnim(player, props, zoomOrigin, options);
            }
            if (step) {
                step(frame);
            }
        });

        this._startAnim({
            center: view.center,
            zoom: view.zoom !== startZoom,
            pitch: pitch !== startPitch,
            bearing: bearing !== startBearing
        }, zoomOrigin);
        return this;
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
        if (player === this._mapAnimPlayer) {
            delete this._mapAnimPlayer;
        }
        if (props['center']) {
            let endCoord;
            if (player._interupted) {
                endCoord = this.getCenter();
            } else {
                endCoord = props['center'][1];
            }
            this.onMoveEnd(this._parseEventFromCoord(endCoord));
        } else if (props['prjCenter']) {
            let endCoord;
            if (player._interupted) {
                endCoord = this._getPrjCenter();
            } else {
                endCoord = props['prjCenter'][1];
            }
            const event = this._parseEventFromCoord(this.getProjection().unproject(endCoord));
            event['point2d'] = this._prjToPoint(endCoord);
            this.onMoveEnd(event);
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
        this._resumePrev(player);
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
        if (!player) {
            return;
        }
        delete this._animRotating;
        if (player.playState !== 'finished') {
            player._interupted = true;
            player.cancel();
        }
        if (player === this._animPlayer) {
            delete this._animPlayer;
        }
        if (player === this._mapAnimPlayer) {
            delete this._mapAnimPlayer;
        }
        // this._resumePrev(player);
    },

    _resumePrev(player) {
        if (!this._prevAnimPlayer) {
            return;
        }
        const prevPlayer = this._prevAnimPlayer;
        if (prevPlayer.playState !== 'paused') {
            delete this._prevAnimPlayer;
        }
        if (player !== prevPlayer) {
            this._animPlayer = prevPlayer;
            prevPlayer.play();
        }
    }
});

function interpolate(a, b, t) {
    return (a * (1 - t)) + (b * t);
}
