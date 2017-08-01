// /**
//  * reference https://developer.mozilla.org/en-US/docs/Web/API/AnimationTimeline
//  * an implement of AnimationTimeline:
//  * https://w3c.github.io/web-animations/#the-animationtimeline-interface
//  * the process description:
//  * https://w3c.github.io/web-animations/#set-the-timeline-of-an-animation
//  * 实现基本AnimationTimeline接口
//  * 扩展实现 time计时，停止，重播
//  * 
//  */

// import { requestAnimationFrame, cancelAnimationFrame } from './../utils/raf';

// /**
//  * @class TimeLine
//  */
// class TimeLine {
//     /**
//      * 创建记录播放起始
//      * @type {Date}
//      */
//     _originTime;
//     /**
//      * 播放起始
//      * @type {Date}
//      */
//     _startTime;
//     /**
//      * 暂停时间点
//      * @type {Date}
//      */
//     _stopTime;
//     /**
//      * 播放速率
//      * @type {number}
//      */
//     _rate = 1;
//     /**
//      * 设置播放速率,需大于1
//      */
//     set rate(number) {
//         this._rate = number > 1.0 ? number : 1;
//     }
//     /**
//      * 获取播放速率
//      */
//     get rate() {
//         return this._rate;
//     }
//     /**
//      * see also https://w3c.github.io/web-animations/#the-animationtimeline-interface
//      * typedef double DOMHighResTimeStamp;
//      * 返回timeline当前时间
//      * @member
//      * @type {number} ?double
//      */
//     get currentTime() {
//         return (+new Date() - this._startTime) * this._rate;
//     }
//     /**
//      * 创建一个timeline对象，用于计时
//      * @param {} options 
//      */
//     constructor() {
//         const date = +new Date();
//         this._originTime = date;
//         this._startTime = date;
//         this._stopTime = date;
//     }
//     /**
//      * 重新计时
//      */
//     reStart() {
//         this._startTime = +new Date();
//         this._stopTime = 0;
//     }
//     /**
//      * 开始计时
//      */
//     start() {
//         this._startTime += new Date() - this._stopTime;
//     }
//     /**
//      * 停止计时
//      */
//     stop() {
//         this._stopTime = +new Date();
//     }

// }

// export default TimeLine;