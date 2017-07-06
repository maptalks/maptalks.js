/**
 * https://github.com/ustbhuangyi/animation/blob/master/src/animation.js
 * reference https://developer.mozilla.org/en-US/docs/Web/API/Animation
 * reference https://github.com/Nazariglez/pixi-animationloop
 * 参考kniteicjs的animation写法
 * 实现：https://w3c.github.io/web-animations/#the-animation-interface
 * 为style变换提供animation实现
 * 
 * 修改部分内容：
 * -
 * 
 */

import { requestAnimationFrame, cancelAnimationFrame } from './../utils/raf';
import TimeLine from './Timeline';
import { _KIWI_EVENT_ANIMATION_ONCANCEL, _KIWI_EVENT_ANIMATION_ONFINISH } from './../core/EventNames';
import Event from './../utils/Event';

class AnimationLoop extends Event{
    /**
     * @type {TimeLine}
     */
    _timeline;

    constructor(renderer,timeLine = new TimeLine()){
        super();
        this._timeline = timeLine;
    }

    stopped(){
        this._timeline.stop();
    }

    


}