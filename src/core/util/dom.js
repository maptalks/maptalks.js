/**
 * DOM utilities used internally.
 * Learned a lot from Leaflet.DomUtil
 * @class
 * @category core
 * @name DomUtil
 */

import Browser from  '../Browser';
import { IS_NODE } from './env';
import { isString, isNil } from './common';
import { splitWords } from './strings';
import Point from '../../geo/Point';
import Size from '../../geo/Size';

const first = (props) => {
    return props[0];
};

/**
 * From Leaflet.DomUtil
 * Goes through the array of style names and returns the first name
 * that is a valid style name for an element. If no such name is found,
 * it returns false. Useful for vendor-prefixed styles like `transform`.
 * @param  {String[]} props
 * @return {Boolean}
 * @memberOf DomUtil
 * @private
 */
const testProp = IS_NODE ? first : (props) => {

    const style = document.documentElement.style;

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
 * @memberOf DomUtil
 * @type {String}
 */
export const TRANSFORM = testProp(
    ['transform', 'WebkitTransform', 'OTransform', 'MozTransform', 'msTransform']);

/**
 * Vendor-prefixed tfransform-origin name (e.g. `'webkitTransformOrigin'` for WebKit).
 * @property {String} TRANSFORMORIGIN
 * @memberOf DomUtil
 * @type {String}
 */
export const TRANSFORMORIGIN = testProp(
    ['transformOrigin', 'WebkitTransformOrigin', 'OTransformOrigin', 'MozTransformOrigin', 'msTransformOrigin']);

/**
 * Vendor-prefixed transition name (e.g. `'WebkitTransition'` for WebKit).
 * @property {String} TRANSITION
 * @memberOf DomUtil
 * @type {String}
 */
export const TRANSITION = testProp(
    ['transition', 'WebkitTransition', 'OTransition', 'MozTransition', 'msTransition']);

/**
 * Vendor-prefixed filter name (e.g. `'WebkitFilter'` for WebKit).
 * @property {String} FILTER
 * @memberOf DomUtil
 * @type {String}
 */
export const CSSFILTER = testProp(
    ['filter', 'WebkitFilter', 'OFilter', 'MozFilter', 'msFilter']);

/**
 * Create a html element.
 * @param {String} tagName
 * @returns {HTMLElement}
 * @memberOf DomUtil
 */
export function createEl(tagName, className) {
    const el = document.createElement(tagName);
    if (className) {
        setClass(el, className);
    }
    return el;
}

/**
 * Create a html element on the specified container
 * @param {String} tagName
 * @param {String} style - css styles
 * @param {HTMLElement} container
 * @return {HTMLElement}
 * @memberOf DomUtil
 */
export function createElOn(tagName, style, container) {
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
 * @param {HTMLElement} node
 * @memberOf DomUtil
 */
/* istanbul ignore next */
export function removeDomNode(node) {
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
 * @param {HTMLElement} obj     - dom element to listen on
 * @param {String} typeArr      - event types, seperated by space
 * @param {Function} handler    - listener function
 * @param {Object} context      - function context
 * @memberOf DomUtil
 */
export function addDomEvent(obj, typeArr, handler, context) {
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
        let type = types[i];
        if (!type) {
            continue;
        }

        if (!obj['Z__' + type]) {
            obj['Z__' + type] = [];

        }
        const hit = listensDomEvent(obj, type, handler);
        if (hit >= 0) {
            removeDomEvent(obj, type, handler);
        }
        obj['Z__' + type].push({
            callback: eventHandler,
            src: handler
        });
        //firefox
        if (type === 'mousewheel' && Browser.gecko) {
            type = 'DOMMouseScroll';
        }
        obj.addEventListener(type, eventHandler, false);
    }
    return this;
}

/**
 * Removes event listener from a dom element
 * @param {HTMLElement} obj         - dom element
 * @param {String} typeArr          - event types, separated by space
 * @param {Function} handler        - listening function
 * @memberOf DomUtil
 */
export function removeDomEvent(obj, typeArr, handler) {
    function doRemove(type, callback) {
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
 * @param {HTMLElement} obj     - dom element to check
 * @param {String} typeArr      - event
 * @param {Function} handler    - the listening function
 * @return {Number} - the handler's index in the listener chain, returns -1 if not.
 * @memberOf DomUtil
 */
export function listensDomEvent(obj, type, handler) {
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
 * @memberOf DomUtil
 */
export function preventDefault(event) {
    if (event.preventDefault) {
        event.preventDefault();
    } else {
        event.returnValue = false;
    }
    return this;
}

/**
 * Stop browser event propagation
 * @param  {Event} e - browser event.
 * @memberOf DomUtil
 */
export function stopPropagation(e) {
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
 * @param  {HTMLElement} dom - HTMLElement
 * @param  {Point} [offset=null] - position to set.
 * @return {Point} - dom element's current position if offset is null.
 * @memberOf DomUtil
 */
export function offsetDom(dom, offset) {
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
 * @param  {HTMLElement} dom
 * @return {Number[]}
 * @memberOf DomUtil
 */
export function computeDomPosition(dom) {
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
    dom.__position = [rect.left + padding[0], rect.top + padding[1], scaleX, scaleY];
    return dom.__position;
}

/**
 * Get event's position from the top-left corner of the dom container
 * @param {Event} ev    event
 * @return {Point}
 * @memberOf DomUtil
 */
export function getEventContainerPoint(ev, dom) {
    if (!ev) {
        ev = window.event;
    }
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

function endsWith(str, suffix) {
    const l = str.length - suffix.length;
    return l >= 0 && str.indexOf(suffix, l) === l;
}

/**
 * set css style to the dom element
 * @param {HTMLElement} dom dom element
 * @param {String} strCss css text
 * @memberOf DomUtil
 */
export function setStyle(dom, strCss) {
    let cssText = dom.style.cssText;
    if (!endsWith(cssText, ';')) {
        cssText += ';';
    }
    dom.style.cssText = cssText + strCss;
    return this;
}

/**
 * Whether the dom has the given css class.
 * @param {HTMLElement} el HTML Element
 * @param {String} name css class
 * @memberOf DomUtil
 */
export function hasClass(el, name) {
    if (el.classList !== undefined) {
        return el.classList.contains(name);
    }
    const className = getClass(el);
    return className.length > 0 && new RegExp('(^|\\s)' + name + '(\\s|$)').test(className);
}

/**
 * add css class to dom element
 * @param {HTMLElement} el HTML Element
 * @param {String} name css class
 * @memberOf DomUtil
 */
export function addClass(el, name) {
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
 * @param {HTMLElement} el HTML Element
 * @param {String} name css class
 * @memberOf DomUtil
 */
export function setClass(el, name) {
    if (isNil(el.className.baseVal)) {
        el.className = name;
    } else {
        el.className.baseVal = name;
    }
    return this;
}

/**
 * Get dom's css class
 * @param {String} name css class
 * @retrun {String} class字符串
 * @memberOf DomUtil
 */
export function getClass(el) {
    return isNil(el.className.baseVal) ? el.className : el.className.baseVal;
}


export function setOpacity(el, value) {
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
 * @param {HTMLElement} el
 * @param {Point} offset
 * @memberOf DomUtil
 */
export function setTransform(el, offset) {
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

export function isHTML(str) {
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

export function getDomRuler(tag) {
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
 * @memberOf DomUtil
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
 * @memberOf DomUtil
 */
export const off = removeDomEvent;
