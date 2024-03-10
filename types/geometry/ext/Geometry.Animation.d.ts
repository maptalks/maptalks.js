import { Player } from '../../core/Animation';
type Constructor = new (...args: any[]) => {};
/**
 *
 * @mixin GeometryAnimation
 */
export default function GeometryAnimation<TBase extends Constructor>(Base: TBase): {
    new (...args: any[]): {
        _animPlayer: Player;
        _animationStarted: boolean;
        /** @lends Geometry.prototype */
        /**
         * Animate the geometry
         *
         * @param  {Object}   styles          - styles to animate
         * @param  {Object}   [options=null]  - animation options
         * @param  {NUmber}   [options.duration=1000]      - duration
         * @param  {Number}   [options.startTime=null]  - time to start animation in ms
         * @param  {String}   [options.easing=linear]   - animation easing: in, out, inAndOut, linear, upAndDown
         * @param  {Boolean}  [options.repeat=false]      - repeat animation
         * @param  {Function} [step=null]  - step function during animation, animation frame as the parameter
         * @return {animation.Player} animation player
         * @function GeometryAnimation.animate
         * @example
         * var player = marker.animate({
         *     'symbol': {
         *         'markerHeight': 82
         *      }
         * }, {
         *     'duration': 2000
         * }, function (frame) {
         *     if (frame.state.playState === 'finished') {
         *         console.log('animation finished');
         *     }
         * });
         * player.pause();
         */
        animate(styles: any, options: any, step: any): Player;
        /**
         * Prepare styles for animation
         * @return {Object} styles
         * @private
         */
        _prepareAnimationStyles(styles: any): {};
        _fireAnimateEvent(playState: any): void;
    };
} & TBase;
export {};
