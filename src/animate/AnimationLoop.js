/**
 * https://github.com/ustbhuangyi/animation/blob/master/src/animation.js
 * reference https://developer.mozilla.org/en-US/docs/Web/API/Animation
 * 参考kniteicjs的animation写法
 * 实现：https://w3c.github.io/web-animations/#the-animation-interface
 * 修改部分内容：
 * -
 * 
 */

import { requestAnimationFrame, cancelAnimationFrame } from './../utils/raf';
import TimeLine from './Timeline';
import { _KIWI_EVENT_ANIMATION_ONCANCEL, _KIWI_EVENT_ANIMATION_ONFINISH } from './../core/EventNames';
import Event from './../utils/Event';

