/**
 * 
 * 兼容不同的写法
 * 提供 requestAnimationFrame 和 cancelAnimationFrame
 * @author yellow date 2017/6/29
 */

const vendors = ['webkit', 'moz', 'o', 'ms'];

let _raf = window.requestAnimationFrame,
    _craf = window.cancelAnimationFrame;

let raf = (() => {
    for (let i = 0, len = vendors.length; i < len && _raf && _craf; i++) {
        let reqKey = `${vendors[i]}RequestAnimationFrame`,
            celKeyO = `${vendors[i]}CancelAnimationFrame`,
            celKeyN = `${vendors[i]}CancelRequestAnimationFrame`;
        _raf = window[reqKey];
        _craf = window[celKeyO] || window[celKeyN];
    };

    if (!_raf) {
        _raf = (callback, element) => {
            let currTime = new Date().getTime();
            let timeToCall = Math.max(0, 16.7 - (currTime - lastTime));
            let id = window.setTimeout(function () {
                callback(currTime + timeToCall);
            }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!_craf) {
        _craf = (id) => {
            clearTimeout(id);
        };
    }
    
})();

export {
    _raf as requestAnimationFrame,
    _craf as cancelAnimationFrame
}