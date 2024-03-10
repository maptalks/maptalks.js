/**
 * @classdesc
 * Easing functions for anmation, from openlayers 3
 * @class
 * @category animation
 * @memberof animation
 * @protected
 */
declare const Easing: {
    outExpo(x: number): number;
    outQuint(x: number): number;
    /**
     * Start slow and speed up.
     * @param {number} t Input between 0 and 1.
     * @return {number} Output between 0 and 1.
     */
    in(t: number): number;
    /**
     * Start fast and slow down.
     * @param {number} t Input between 0 and 1.
     * @return {number} Output between 0 and 1.
     */
    out(t: number): number;
    /**
     * Start slow, speed up, and then slow down again.
     * @param {number} t Input between 0 and 1.
     * @return {number} Output between 0 and 1.
     */
    inAndOut(t: number): number;
    /**
     * Maintain a constant speed over time.
     * @param {number} t Input between 0 and 1.
     * @return {number} Output between 0 and 1.
     */
    linear(t: number): number;
    /**
     * Start slow, speed up, and at the very end slow down again.  This has the
     * same general behavior as {@link inAndOut}, but the final slowdown
     * is delayed.
     * @param {number} t Input between 0 and 1.
     * @return {number} Output between 0 and 1.
     */
    upAndDown(t: number): number;
};
/**
 * Animation Frame used internally in animation player.
 * @category animation
 * @memberof animation
 * @protected
 */
declare class Frame {
    state: any;
    styles: any;
    /**
     * Create an animation frame.
     * @param {Object} state  - animation state
     * @param {Object} styles - styles to animate
     */
    constructor(state: any, styles: any);
    get playState(): any;
    get symbol(): any;
}
/**
 * An [Web Animation API]{@link https://developer.mozilla.org/zh-CN/docs/Web/API/Animation} style animation player
 * @category animation
 * @memberof animation
 */
declare class Player {
    _animation: Function;
    options: any;
    _onFrame: Function;
    playState: string;
    ready: boolean;
    finished: boolean;
    target: any;
    duration: number;
    _framer: any;
    currentTime: number;
    startTime: number;
    _playStartTime: number;
    /**
     * Create an animation player
     * @param {Function} animation - animation [framing]{@link framing} function
     * @param {Object} options     - animation options
     * @param {Function} onFrame  - callback function for animation steps
     */
    constructor(animation: any, options: any, onFrame: any, target: any);
    _prepare(): void;
    /**
     * Start or resume the animation
     * @return {Player} this
     */
    play(): this;
    /**
     * Pause the animation
     * @return {Player} this
     */
    pause(): this;
    /**
     * Cancel the animation play and ready to play again
     * @return {Player} this
     */
    cancel(): this;
    /**
     * Finish the animation play, and can't be played any more.
     * @return {Player} this
     */
    finish(): this;
    reverse(): void;
    _run(): void;
}
/**
 * @classdesc
 * Utilities for animation
 * @class
 * @category animation
 * @memberof animation
 */
declare const Animation: {
    _frameFn: FunctionConstructor;
    /**
     * @property {Object} speed         - predefined animation speed
     * @property {Number} speed.slow    - 2000ms
     * @property {Number} speed.normal  - 1000ms
     * @property {Number} speed.fast    - 500ms
     */
    speed: {
        slow: number;
        normal: number;
        fast: number;
    };
    /**
     * resolve styles for animation, get a style group of start style, styles to animate and end styles.
     * @param  {Object} styles - styles to resolve
     * @return {Object[]}  styles resolved
     * @private
     */
    _resolveStyles(styles: any): {}[];
    /**
     * Generate a framing function
     * @param  {Object[]} styles        - animation style group
     * @param  {Object} [options=null]  - options
     * @param  {Object} [options.easing=null]  - animation easing
     * @return {Function} framing function helps to generate animation frames.
     */
    framing(styles: any, options: any): (elapsed: any, duration: any) => Frame;
    _requestAnimFrame(fn: any): void;
    _a(): void;
    _run(): void;
    /**
     * Create an animation player
     * @param  {Object} styles  - styles to animate
     * @param  {Object} options - animation options
     * @param  {Function} step  - callback function for animation steps
     * @return {Player} player
     */
    animate(styles: any, options: any, step: any, target?: any): Player;
};
declare const animate: (styles: any, options: any, step: any, target?: any) => Player;
export { Animation, Easing, Player, Frame, animate };
