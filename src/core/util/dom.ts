/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/**
 * DOM utilities used internally.
 * Learned a lot from Leaflet.DomUtil
 * @class
 * @category core
 */

import Browser from '../Browser';
import { IS_NODE } from './env';
import { isString, isNil, now } from './common';
import { splitWords } from './strings';
import Point from '../../geo/Point';
import Size from '../../geo/Size';

const first = <T>(props: T[]) => {
    return props[0];
};

/**
 * From Leaflet.DomUtil
 * Goes through the array of style names and returns the first name
 * that is a valid style name for an element. If no such name is found,
 * it returns false. Useful for vendor-prefixed styles like `transform`.
 * @param  {String[]} props
 * @return {Boolean}
 * @private
 */
const testProp = IS_NODE ? first : <T extends string | number | symbol>(props: T[]) => {

    const style = (document.documentElement && document.documentElement.style) || {};

    for (let i = 0; i < props.length; i++) {
        if (props[i] in style) {
            return props[i];
        }
    }
    return false;
};

// prefix style property names

/**
 * Vendor-prefixed fransform style name (e.g. `'webkitTransform'` for WebKit).
 * @property {String} TRANSFORM
 */
export const TRANSFORM = testProp(
    ['transform', 'WebkitTransform', 'OTransform', 'MozTransform', 'msTransform']
) as string;

/**
 * Vendor-prefixed tfransform-origin name (e.g. `'webkitTransformOrigin'` for WebKit).
 * @property {String} TRANSFORMORIGIN
 */
export const TRANSFORMORIGIN = testProp(
    ['transformOrigin', 'WebkitTransformOrigin', 'OTransformOrigin', 'MozTransformOrigin', 'msTransformOrigin']
) as string;

/**
 * Vendor-prefixed transition name (e.g. `'WebkitTransition'` for WebKit).
 * @property {String} TRANSITION
 */
export const TRANSITION = testProp(
    ['transition', 'WebkitTransition', 'OTransition', 'MozTransition', 'msTransition']
) as string;

/**
 * Vendor-prefixed filter name (e.g. `'WebkitFilter'` for WebKit).
 * @property {String} FILTER
 */
export const CSSFILTER = testProp(
    ['filter', 'WebkitFilter', 'OFilter', 'MozFilter', 'msFilter']
) as string;

/**
 * Create a html element.
 * @param tagName
 * @param className
 * @returns
 */
export function createEl(tagName: string, className?: string) {
    const el = document.createElement(tagName);
    if (className) {
        setClass(el, className);
    }
    return el;
}

/**
 * Create a html element on the specified container
 * @param tagName
 * @param style - css styles
 * @param container
 * @return
 */
export function createElOn(tagName: string, style: string, container: HTMLElement) {
    const el = createEl(tagName);
    if (style) {
        setStyle(el, style);
    }
    if (container) {
        container.appendChild(el);
    }
    return el;
}

/**
 * Removes a html element.
 * @param node
 */
/* istanbul ignore next */
export function removeDomNode(node?: HTMLElement) {
    if (!node) {
        return this;
    }
    if (Browser.ielt9 || Browser.ie9) {
        //fix memory leak in IE9-
        //http://com.hemiola.com/2009/11/23/memory-leaks-in-ie8/
        let d = createEl('div');
        d.appendChild(node);
        d.innerHTML = '';
        d = null;
    } else if (node.parentNode) {
        node.parentNode.removeChild(node);
    }
    return this;
}

/**
 * Adds a event listener to the dom element.
 * @param  obj     - dom element to listen on
 * @param  typeArr      - event types, seperated by space
 * @param  handler    - listener function
 * @param  context      - function context
 */
export function addDomEvent(obj: HTMLElement | Document, typeArr: string, handler: Function, context?: Object) {
    if (!obj || !obj.addEventListener || !typeArr || !handler) {
        return this;
    }
    const eventHandler = function (e) {
        if (!e) {
            e = window.event;
        }
        handler.call(context || obj, e);
        return;
    };
    const types = typeArr.split(' ');
    for (let i = types.length - 1; i >= 0; i--) {
        const type = types[i];
        if (!type) {
            continue;
        }

        if (!obj['Z__' + type]) {
            obj['Z__' + type] = [];

        }
        const hit = listensDomEvent(obj, type, handler);
        if (hit >= 0) {
            console.warn(obj, `find '${type}' handler:`, handler, ' The old listener function will be removed');
            removeDomEvent(obj, type, handler);
        }
        obj['Z__' + type].push({
            callback: eventHandler,
            src: handler
        });
        // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
        obj.addEventListener(type, eventHandler, Browser.supportsPassive ? { capture: false, passive: false } : false);
    }
    return this;
}

/**
 * Removes event listener from a dom element
 * @param  obj         - dom element
 * @param  typeArr          - event types, separated by space
 * @param  handler        - listening function
 */
export function removeDomEvent(obj: HTMLElement | Document, typeArr: string, handler: Function) {
    function doRemove(type, callback?) {
        //mouse wheel in firefox
        if (type === 'mousewheel' && Browser.gecko) {
            type = 'DOMMouseScroll';
        }
        obj.removeEventListener(type, callback, false);
    }
    if (!obj || !obj.removeEventListener || !typeArr) {
        return this;
    }
    const types = typeArr.split(' ');
    for (let i = types.length - 1; i >= 0; i--) {
        const type = types[i];
        if (!type) {
            continue;
        }
        //remove all the listeners if handler is not given.
        if (!handler && obj['Z__' + type]) {
            const handlers = obj['Z__' + type];
            for (let j = 0, jlen = handlers.length; j < jlen; j++) {
                doRemove(handlers[j].callback);
            }
            delete obj['Z__' + type];
            return this;
        }
        const hit = listensDomEvent(obj, type, handler);
        if (hit < 0) {
            return this;
        }
        const hitHandler = obj['Z__' + type][hit];
        doRemove(type, hitHandler.callback);
        obj['Z__' + type].splice(hit, 1);
    }
    return this;
}

/**
 * Check if event type of the dom is listened by the handler
 * @param  obj     - dom element to check
 * @param  typeArr      - event
 * @param  handler    - the listening function
 * @return {Number} - the handler's index in the listener chain, returns -1 if not.
 */
export function listensDomEvent(obj: HTMLElement | Document, type: string, handler: Function) {
    if (!obj || !obj['Z__' + type] || !handler) {
        return -1;
    }
    const handlers = obj['Z__' + type];
    for (let i = 0, len = handlers.length; i < len; i++) {
        if (handlers[i].src === handler) {
            return i;
        }
    }
    return -1;
}

/**
 * Prevent default behavior of the browser. <br/>
 * preventDefault Cancels the event if it is cancelable, without stopping further propagation of the event.
 * @param {Event} event - browser event
 */
export function preventDefault(event: Event) {
    if (event.preventDefault) {
        event.preventDefault();
    } else {
        event.returnValue = false;
    }
    return this;
}

/**
 * Stop browser event propagation
 * @param   e - browser event.
 */
export function stopPropagation(e: Event) {
    // @ts-expect-error
    e._cancelBubble = true;
    if (e.stopPropagation) {
        e.stopPropagation();
    } else {
        e.cancelBubble = true;
    }
    return this;
}

export function preventSelection(dom) {
    dom.onselectstart = function () {
        return false;
    };
    dom.ondragstart = function () {
        return false;
    };
    dom.setAttribute('unselectable', 'on');
    return this;
}

/**
 * Get the dom element's current position or offset its position by offset
 * @param  dom - HTMLElement
 * @param  offset - position to set.
 * @return  dom element's current position if offset is null.
 */
export function offsetDom(dom: HTMLElement, offset?: Point) {
    if (!dom) {
        return null;
    }

    if (Browser.any3d) {
        setTransform(dom, offset);
    } else {
        dom.style.left = offset.x + 'px';
        dom.style.top = offset.y + 'px';
    }
    return offset;
}

/**
 * Compute dom's position
 * @param  dom
 * @return
 */
export function computeDomPosition(dom: HTMLElement): number[] {
    const style = window.getComputedStyle(dom);
    const padding = [
        parseInt(style['padding-left']),
        parseInt(style['padding-top'])
    ];
    const rect = dom.getBoundingClientRect();
    //fix #450, inspired by https://github.com/Leaflet/Leaflet/pull/5794/files
    const offsetWidth = dom.offsetWidth,
        offsetHeight = dom.offsetHeight;
    const scaleX = offsetWidth ? rect.width / offsetWidth : 1,
        scaleY = offsetHeight ? rect.height / offsetHeight : 1;
    // @ts-expect-error
    dom.__position = [rect.left + padding[0], rect.top + padding[1], scaleX, scaleY];
    // @ts-expect-error
    return dom.__position;
}

/**
 * Get event's position from the top-left corner of the dom container
 * @param ev    event
 * @return
 */
export function getEventContainerPoint(ev: MouseEvent, dom: HTMLElement) {
    if (!ev) {
        // @ts-expect-error
        ev = window.event;
    }
    // @ts-expect-error
    let domPos = dom.__position;
    if (!domPos) {
        domPos = computeDomPosition(dom);
    }
    // div by scaleX, scaleY to fix #450
    return new Point(
        (ev.clientX - domPos[0] - dom.clientLeft) / domPos[2],
        (ev.clientY - domPos[1] - dom.clientTop) / domPos[3]
    );
}

function endsWith(str: string, suffix: string) {
    const l = str.length - suffix.length;
    return l >= 0 && str.indexOf(suffix, l) === l;
}

/**
 * set css style to the dom element
 * @param dom dom element
 * @param strCss css text
 */
export function setStyle(dom: HTMLElement, strCss: string) {
    let cssText = dom.style.cssText;
    if (!endsWith(cssText, ';')) {
        cssText += ';';
    }
    dom.style.cssText = cssText + strCss;
    return this;
}

/**
 * Whether the dom has the given css class.
 * @param el HTML Element
 * @param name css class
 */
export function hasClass(el: HTMLElement, name: string) {
    if (el.classList !== undefined) {
        return el.classList.contains(name);
    }
    const className = getClass(el);
    return className.length > 0 && new RegExp('(^|\\s)' + name + '(\\s|$)').test(className);
}

/**
 * add css class to dom element
 * @param el HTML Element
 * @param name css class
 */
export function addClass(el: HTMLElement, name: string) {
    if (el.classList !== undefined && !hasClass(el, name)) {
        const classes = splitWords(name);
        for (let i = 0, len = classes.length; i < len; i++) {
            el.classList.add(classes[i]);
        }
    } else {
        const className = getClass(el);
        setClass(el, (className ? className + ' ' : '') + name);
    }
    return this;
}

/**
 * Set dom's css class
 * @param el HTML Element
 * @param name css class
 */
export function setClass(el: HTMLElement, name: string) {
    // @ts-expect-error
    if (isNil(el.className.baseVal)) {
        el.className = name;
    } else {
        // @ts-expect-error
        el.className.baseVal = name;
    }
    return this;
}

/**
 * Get dom's css class
 * @param name css class
 * @retrun class字符串
 */
export function getClass(el: HTMLElement): string {
    // @ts-expect-error
    return isNil(el.className.baseVal) ? el.className : el.className.baseVal;
}


export function setOpacity(el: HTMLElement, value: string) {
    el.style.opacity = value;
    return this;
}

// export function copyCanvas(src) {
//     if (IS_NODE) {
//         return null;
//     }
//     const target = createEl('canvas');
//     target.width = src.width;
//     target.height = src.height;
//     target.getContext('2d').drawImage(src, 0, 0);
//     return target;
// }

/**
 * Resets the 3D CSS transform of `el` so it is translated by `offset` pixels
 * @param el
 * @param offset
 */
export function setTransform(el: HTMLElement, offset: Point) {
    const pos = offset || new Point(0, 0);
    el.style[TRANSFORM] =
        Browser.any3d ?
            'translate3d(' + pos.x + 'px,' + pos.y + 'px,0px)' :
            'translate(' + pos.x + 'px,' + pos.y + 'px)';

    return this;
}

export function setTransformMatrix(el, m) {
    const text = 'matrix(' + (isString(m) ? m : m.join()) + ')';
    if (el.style[TRANSFORM] !== text) {
        el.style[TRANSFORM] = text;
    }
    return this;
}

export function removeTransform(el) {
    if (el.style[TRANSFORM]) {
        el.style[TRANSFORM] = '';
    }
    return this;
}

export function isHTML(str: string) {
    return /<[a-z\][\s\S]*>/i.test(str);
}

export function measureDom(parentTag, dom) {
    const ruler = getDomRuler(parentTag);
    if (isString(dom)) {
        ruler.innerHTML = dom;
    } else {
        ruler.appendChild(dom);
    }
    const result = new Size(ruler.clientWidth, ruler.clientHeight);
    removeDomNode(ruler);
    return result;
}

export function getDomRuler(tag: any) {
    const span = document.createElement(tag);
    span.style.cssText = 'position:absolute;left:-10000px;top:-10000px;';
    document.body.appendChild(span);
    return span;
}

/**
 * Alias for [addDomEvent]{@link DomUtil.addDomEvent}
 * @param {HTMLElement} obj     - dom element to listen on
 * @param {String} typeArr      - event types, seperated by space
 * @param {Function} handler    - listener function
 * @param {Object} context      - function context
 * @static
 * @function
 * @return {DomUtil}
 */
export const on = addDomEvent;

/**
 * Alias for [removeDomEvent]{@link DomUtil.removeDomEvent}
 * @param {HTMLElement} obj         - dom element
 * @param {String} typeArr          - event types, separated by space
 * @param {Function} handler        - listening function
 * @static
 * @function
 * @return {DomUtil}
 */
export const off = removeDomEvent;

export function isMoveEvent(type?: string) {
    return type && (type === 'mousemove' || type === 'touchmove');
}

export const MOUSEMOVE_THROTTLE_TIME = 48;

export function isMousemoveEventBlocked(target: HTMLElement | any, mousemoveThrottleTime: number) {
    const currentTime = now();
    const TIME = mousemoveThrottleTime || MOUSEMOVE_THROTTLE_TIME;
    if (target._mousemoveTime && currentTime - target._mousemoveTime < TIME) {
        return true;
    }
    target._mousemoveTime = currentTime;
    return false;
}
