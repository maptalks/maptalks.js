/**
 * DOM utilities used internally.
 * Learned a lot from Leaflet.DomUtil
 * @class
 * @category core
 * @name DomUtil
 */
import Point from '../../geo/Point';
import Size from '../../geo/Size';
/**
 * Vendor-prefixed fransform style name (e.g. `'webkitTransform'` for WebKit).
 * @property {String} TRANSFORM
 * @memberOf DomUtil
 * @type {String}
 */
export declare const TRANSFORM: any;
/**
 * Vendor-prefixed tfransform-origin name (e.g. `'webkitTransformOrigin'` for WebKit).
 * @property {String} TRANSFORMORIGIN
 * @memberOf DomUtil
 * @type {String}
 */
export declare const TRANSFORMORIGIN: any;
/**
 * Vendor-prefixed transition name (e.g. `'WebkitTransition'` for WebKit).
 * @property {String} TRANSITION
 * @memberOf DomUtil
 * @type {String}
 */
export declare const TRANSITION: any;
/**
 * Vendor-prefixed filter name (e.g. `'WebkitFilter'` for WebKit).
 * @property {String} FILTER
 * @memberOf DomUtil
 * @type {String}
 */
export declare const CSSFILTER: any;
/**
 * Create a html element.
 * @param {String} tagName
 * @returns {HTMLElement}
 * @memberOf DomUtil
 */
export declare function createEl(tagName: string, className?: string): HTMLElement;
/**
 * Create a html element on the specified container
 * @param {String} tagName
 * @param {String} style - css styles
 * @param {HTMLElement} container
 * @return {HTMLElement}
 * @memberOf DomUtil
 */
export declare function createElOn(tagName: string, style?: string, container?: HTMLElement): HTMLElement;
/**
 * Removes a html element.
 * @param {HTMLElement} node
 * @memberOf DomUtil
 */
export declare function removeDomNode(node: HTMLElement): any;
/**
 * Adds a event listener to the dom element.
 * @param {HTMLElement} obj     - dom element to listen on
 * @param {String} typeArr      - event types, seperated by space
 * @param {Function} handler    - listener function
 * @param {Object} context      - function context
 * @memberOf DomUtil
 */
export declare function addDomEvent(obj: HTMLElement | Document, typeArr: string, handler: Function, context?: any): any;
/**
 * Removes event listener from a dom element
 * @param {HTMLElement} obj         - dom element
 * @param {String} typeArr          - event types, separated by space
 * @param {Function} handler        - listening function
 * @memberOf DomUtil
 */
export declare function removeDomEvent(obj: HTMLElement | Document, typeArr: string, handler: Function): any;
/**
 * Check if event type of the dom is listened by the handler
 * @param {HTMLElement} obj     - dom element to check
 * @param {String} typeArr      - event
 * @param {Function} handler    - the listening function
 * @return {Number} - the handler's index in the listener chain, returns -1 if not.
 * @memberOf DomUtil
 */
export declare function listensDomEvent(obj: HTMLElement | Document, type: string, handler: Function): number;
/**
 * Prevent default behavior of the browser. <br/>
 * preventDefault Cancels the event if it is cancelable, without stopping further propagation of the event.
 * @param {Event} event - browser event
 * @memberOf DomUtil
 */
export declare function preventDefault(event: MouseEvent): any;
/**
 * Stop browser event propagation
 * @param  {Event} e - browser event.
 * @memberOf DomUtil
 */
export declare function stopPropagation(e: MouseEvent): any;
export declare function preventSelection(dom: HTMLElement): any;
/**
 * Get the dom element's current position or offset its position by offset
 * @param  {HTMLElement} dom - HTMLElement
 * @param  {Point} [offset=null] - position to set.
 * @return {Point} - dom element's current position if offset is null.
 * @memberOf DomUtil
 */
export declare function offsetDom(dom: HTMLElement, offset: Point): Point;
/**
 * Compute dom's position
 * @param  {HTMLElement} dom
 * @return {Number[]}
 * @memberOf DomUtil
 */
export declare function computeDomPosition(dom: HTMLElement): any;
/**
 * Get event's position from the top-left corner of the dom container
 * @param {Event} ev    event
 * @return {Point}
 * @memberOf DomUtil
 */
export declare function getEventContainerPoint(ev: any, dom: HTMLElement): Point;
/**
 * set css style to the dom element
 * @param {HTMLElement} dom dom element
 * @param {String} strCss css text
 * @memberOf DomUtil
 */
export declare function setStyle(dom: HTMLElement, strCss: string): any;
/**
 * Whether the dom has the given css class.
 * @param {HTMLElement} el HTML Element
 * @param {String} name css class
 * @memberOf DomUtil
 */
export declare function hasClass(el: HTMLElement, name: string): boolean;
/**
 * add css class to dom element
 * @param {HTMLElement} el HTML Element
 * @param {String} name css class
 * @memberOf DomUtil
 */
export declare function addClass(el: HTMLElement, name: string): any;
/**
 * Set dom's css class
 * @param {HTMLElement} el HTML Element
 * @param {String} name css class
 * @memberOf DomUtil
 */
export declare function setClass(el: HTMLElement, name: string): any;
/**
 * Get dom's css class
 * @param {String} name css class
 * @retrun {String} class字符串
 * @memberOf DomUtil
 */
export declare function getClass(el: HTMLElement): any;
export declare function setOpacity(el: HTMLElement, value: string | number): any;
/**
 * Resets the 3D CSS transform of `el` so it is translated by `offset` pixels
 * @param {HTMLElement} el
 * @param {Point} offset
 * @memberOf DomUtil
 */
export declare function setTransform(el: HTMLElement, offset: Point): any;
export declare function setTransformMatrix(el: HTMLElement, m: any): any;
export declare function removeTransform(el: HTMLElement): any;
export declare function isHTML(str: string): boolean;
export declare function measureDom(parentTag: any, dom: HTMLElement): Size;
export declare function getDomRuler(tag: any): any;
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
export declare const on: typeof addDomEvent;
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
export declare const off: typeof removeDomEvent;
