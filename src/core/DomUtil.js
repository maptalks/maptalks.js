
/**
 * DOM utilities used internally.
 * Learned a lot from Leaflet.DomUtil
 * @class
 * @category core
 * @protected
 * @memberOf maptalks
 * @name DomUtil
 */
maptalks.DomUtil = {

    /**
     * Create a html element.
     * @param {String} tagName
     * @returns {HTMLElement}
     */
    createEl:function (tagName, className) {
        var el = document.createElement(tagName);
        if (className) {
            maptalks.DomUtil.setClass(el, className);
        }
        return el;
    },

    /**
     * Create a html element on the specified container
     * @param {String} tagName
     * @param {String} style - css styles
     * @param {HTMLElement} container
     * @return {HTMLElement}
     */
    createElOn:function (tagName, style, container) {
        var el = this.createEl(tagName);
        if (style) {
            this.setStyle(el, style);
        }
        if (container) {
            container.appendChild(el);
        }
        return el;
    },

    /**
     * Removes a html element.
     * @param {HTMLElement} node
     */
    removeDomNode:function (node) {
        if (!node) { return; }
        if (maptalks.Browser.ielt9 || maptalks.Browser.ie9) {
            //fix memory leak in IE9-
            //http://com.hemiola.com/2009/11/23/memory-leaks-in-ie8/
            var d = maptalks.DomUtil.createEl('div');
            d.appendChild(node);
            d.innerHTML = '';
            d = null;
        } else if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    },

    /**
     * Adds a event listener to the dom element.
     * @param {HTMLElement} obj     - dom element to listen on
     * @param {String} typeArr      - event types, seperated by space
     * @param {Function} handler    - listener function
     * @param {Object} context      - function context
     * @return {maptalks.DomUtil}
     */
    addDomEvent:function (obj, typeArr, handler, context) {
        if (!obj || !typeArr || !handler) { return maptalks.DomUtil; }
        var eventHandler = function (e) {
            if (!e) {
                e = window.event;
            }
            return handler.call(context || obj, e);
        };
        var types = typeArr.split(' ');
        for (var i = types.length - 1; i >= 0; i--) {
            var type = types[i];
            if (!type) {
                continue;
            }

            if (!obj['Z__' + type]) {
                obj['Z__' + type] = [];

            }
            var hit = maptalks.DomUtil.listensDomEvent(obj, type, handler);
            if (hit >= 0) {
                maptalks.DomUtil.removeDomEvent(obj, type, handler);
            }
            obj['Z__' + type].push({callback:eventHandler, src:handler});
            if ('addEventListener' in obj) {
                //滚轮事件的特殊处理
                if (type === 'mousewheel' && document['mozHidden'] !== undefined) {
                    type = 'DOMMouseScroll';
                }
                obj.addEventListener(type, eventHandler, false);
            } else if ('attachEvent' in obj) {
                obj.attachEvent('on' + type, eventHandler);
            }
        }
        return maptalks.DomUtil;
    },

    /**
     * Removes event listener from a dom element
     * @param {HTMLElement} obj         - dom element
     * @param {String} typeArr          - event types, separated by space
     * @param {Function} handler        - listening function
     * @return {maptalks.DomUtil}
     */
    removeDomEvent:function (obj, typeArr, handler) {
        function doRemove(type, callback) {
            if ('removeEventListener' in obj) {
                //mouse wheel in firefox
                if (type === 'mousewheel' && document['mozHidden'] !== undefined) {
                    type = 'DOMMouseScroll';
                }
                obj.removeEventListener(type, callback, false);
            } else if ('detachEvent' in obj) {
                obj.detachEvent('on' + type, callback);
            }
        }
        if (!obj || !typeArr) { return this; }
        var types = typeArr.split(' ');
        for (var i = types.length - 1; i >= 0; i--) {
            var type = types[i];
            if (!type) {
                continue;
            }
            //remove all the listeners if handler is not given.
            if (!handler && obj['Z__' + type]) {
                var handlers = obj['Z__' + type];
                for (var j = 0, jlen = handlers.length; j < jlen; j++) {
                    doRemove(handlers[j].callback);
                }
                delete obj['Z__' + type];
                return this;
            }
            var hit = this.listensDomEvent(obj, type, handler);
            if (hit < 0) {
                return this;
            }
            var hitHandler = obj['Z__' + type][hit];
            doRemove(type, hitHandler.callback);
            obj['Z__' + type].splice(hit, 1);
        }
        return this;
    },

    /**
     * Check if event type of the dom is listened by the handler
     * @param {HTMLElement} obj     - dom element to check
     * @param {String} typeArr      - event
     * @param {Function} handler    - the listening function
     * @return {Number} - the handler's index in the listener chain, returns -1 if not.
     */
    listensDomEvent:function (obj, type, handler) {
        if (!obj || !obj['Z__' + type] || !handler) {
            return -1;
        }
        var handlers = obj['Z__' + type];
        for (var i = 0, len = handlers.length; i < len; i++) {
            if (handlers[i].src === handler) {
                return i;
            }
        }
        return -1;
    },

    /**
     * Prevent default behavior of the browser. <br/>
     * preventDefault Cancels the event if it is cancelable, without stopping further propagation of the event.
     * @param {Event} event - browser event
     */
    preventDefault: function (event) {
        if (event.preventDefault) {
            event.preventDefault();
        } else {
            event.returnValue = false;
        }
    },

    /**
     * Stop browser event propagation
     * @param  {Event} e - browser event.
     */
    stopPropagation: function (e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        } else {
            e.cancelBubble = true;
        }
        return this;
    },

    preventSelection: function (dom) {
        dom.onselectstart = function () {
            return false;
        };
        dom.ondragstart = function () { return false; };
        dom.setAttribute('unselectable', 'on');
        return this;
    },

    /**
     * Get the dom element's current position or offset its position by offset
     * @param  {HTMLElement} dom - HTMLElement
     * @param  {maptalks.Point} [offset=null] - position to set.
     * @return {maptalks.Point} - dom element's current position if offset is null.
     */
    offsetDom: function (dom, offset) {
        if (!dom) { return null; }

        if (maptalks.Browser.any3d) {
            maptalks.DomUtil.setTransform(dom, offset);
        } else {
            dom.style.left = offset.x + 'px';
            dom.style.top = offset.y + 'px';
        }
        return offset;
    },

    /**
     * 获取dom对象在页面上的屏幕坐标
     * @param  {HTMLElement} obj Dom对象
     * @return {Object}     屏幕坐标
     */
    getPagePosition:function (obj) {
        var docEl = document.documentElement;
        var rect = obj.getBoundingClientRect();
        return new maptalks.Point(rect['left'] + docEl['scrollLeft'], rect['top'] + docEl['scrollTop']);
    },


    /**
     * 获取鼠标在容器上相对容器左上角的坐标值
     * @param {Event} ev  触发的事件
     * @return {maptalks.Point} left:鼠标在页面上的横向位置, top:鼠标在页面上的纵向位置
     */
    getEventContainerPoint:function (ev, dom) {
        if (!ev) {
            ev = window.event;
        }
        var rect = dom.getBoundingClientRect();

        return new maptalks.Point(
            ev.clientX - rect.left - dom.clientLeft,
            ev.clientY - rect.top - dom.clientTop);
    },

    /**
     * 为dom设置样式
     * @param {HTMLElement} dom dom节点
     * @param {String} strCss 样式字符串
     */
    setStyle : function (dom, strCss) {
        function endsWith(str, suffix) {
            var l = str.length - suffix.length;
            return l >= 0 && str.indexOf(suffix, l) === l;
        }
        var style = dom.style,
            cssText = style.cssText;
        if (!endsWith(cssText, ';')) {
            cssText += ';';
        }
        dom.style.cssText = cssText + strCss;
    },

    /**
     * 清空dom样式
     * @param {HTMLElement} dom dom节点
     */
    removeStyle: function (dom) {
        dom.style.cssText = '';
    },

    /**
     * 为dom添加样式
     * @param {HTMLElement} dom dom节点
     * @param {String} attr 样式标签
     * @param {String} value 样式值
     */
    addStyle: function (dom, attr, value) {
        var css = dom.style.cssText;
        if (attr && value) {
            var newStyle = attr + ':' + value + ';';
            dom.style.cssText = css + newStyle;
        }
    },

    /**
     * 判断元素是否包含class
     * @param {HTMLElement} el html元素
     * @param {String} name class名称
     */
    hasClass: function (el, name) {
        if (el.classList !== undefined) {
            return el.classList.contains(name);
        }
        var className = maptalks.DomUtil.getClass(el);
        return className.length > 0 && new RegExp('(^|\\s)' + name + '(\\s|$)').test(className);
    },

    /**
     * 为dom添加class
     * @param {HTMLElement} el html元素
     * @param {String} name class名称
     */
    addClass: function (el, name) {
        if (el.classList !== undefined) {
            var classes = maptalks.StringUtil.splitWords(name);
            for (var i = 0, len = classes.length; i < len; i++) {
                el.classList.add(classes[i]);
            }
        } else if (!maptalks.DomUtil.hasClass(el, name)) {
            var className = maptalks.DomUtil.getClass(el);
            maptalks.DomUtil.setClass(el, (className ? className + ' ' : '') + name);
        }
    },

    /**
     * 移除dom class
     * @param {HTMLElement} el html元素
     * @param {String} name class名称
     */
    removeClass: function (el, name) {
        if (el.classList !== undefined) {
            el.classList.remove(name);
        } else {
            maptalks.DomUtil.setClass(el, maptalks.StringUtil.trim((' ' + maptalks.DomUtil.getClass(el) + ' ').replace(' ' + name + ' ', ' ')));
        }
    },

    /**
     * 设置dom class
     * @param {HTMLElement} el html元素
     * @param {String} name class名称
     */
    setClass: function (el, name) {
        if (maptalks.Util.isNil(el.className.baseVal)) {
            el.className = name;
        } else {
            el.className.baseVal = name;
        }
    },

    /**
     * 获取dom class
     * @param {String} name class名称
     * @retrun {String} class字符串
     */
    getClass: function (el) {
        return maptalks.Util.isNil(el.className.baseVal) ? el.className : el.className.baseVal;
    },

    // Borrowed from Leaflet
    // @function setOpacity(el: HTMLElement, opacity: Number)
    // Set the opacity of an element (including old IE support).
    // `opacity` must be a number from `0` to `1`.
    setOpacity: function (el, value) {

        if ('opacity' in el.style) {
            el.style.opacity = value;

        } else if ('filter' in el.style) {
            maptalks.DomUtil._setOpacityIE(el, value);
        }
    },

    _setOpacityIE: function (el, value) {
        var filter = false,
            filterName = 'DXImageTransform.Microsoft.Alpha';

        // filters collection throws an error if we try to retrieve a filter that doesn't exist
        try {
            filter = el.filters.item(filterName);
        } catch (e) {
            // don't set opacity to 1 if we haven't already set an opacity,
            // it isn't needed and breaks transparent pngs.
            if (value === 1) { return; }
        }

        value = Math.round(value * 100);

        if (filter) {
            filter.Enabled = (value !== 100);
            filter.Opacity = value;
        } else {
            el.style.filter += ' progid:' + filterName + '(opacity=' + value + ')';
        }
    },

    /**
     * Copy the source canvas
     * @param  {Element|Canvas} src - source canvas
     * @return {Element|Canvas}     target canvas
     */
    copyCanvas:function (src) {
        if (maptalks.node) {
            return null;
        }
        var target = maptalks.DomUtil.createEl('canvas');
        target.width = src.width;
        target.height = src.height;
        target.getContext('2d').drawImage(src, 0, 0);
        return target;
    },

    /**
     * Test if the size of canvas is valid.
     * @function
     * @param  {maptalks.Size} - size
     * @return {Boolean}
     */
    testCanvasSize: (function () {
        if (maptalks.node) {
            return function () { return true; };
        }
          /**
           * @type {CanvasRenderingContext2D}
           */
        var context = null;

          /**
           * @type {ImageData}
           */
        var imageData = null;

        return function (size) {
            if (!context) {
                var _canvas = maptalks.DomUtil.createEl('canvas');
                _canvas.width = 1;
                _canvas.height = 1;
                context = _canvas.getContext('2d');
                imageData = context.createImageData(1, 1);
                var data = imageData.data;
                data[0] = 42;
                data[1] = 84;
                data[2] = 126;
                data[3] = 255;
            }
            var canvas = context.canvas;
            var good = size['width'] <= canvas.width && size['height'] <= canvas.height;
            if (!good) {
                canvas.width = size['width'];
                canvas.height = size['height'];
                var x = size['width'] - 1;
                var y = size['height'] - 1;
                context.putImageData(imageData, x, y);
                var result = context.getImageData(x, y, 1, 1);
                var arrEqual = true;
                for (var i = result.data.length - 1; i >= 0; i--) {
                    if (result.data[i] !== imageData.data[i]) {
                        arrEqual = false;
                        break;
                    }
                }
                good = arrEqual;
            }
            return good;
        };
    })(),


    /**
     * From Leaflet.DomUtil
     * Goes through the array of style names and returns the first name
     * that is a valid style name for an element. If no such name is found,
     * it returns false. Useful for vendor-prefixed styles like `transform`.
     * @param  {String[]} props
     * @return {Boolean}
     */
    testProp: function (props) {

        var style = document.documentElement.style;

        for (var i = 0; i < props.length; i++) {
            if (props[i] in style) {
                return props[i];
            }
        }
        return false;
    },


    /**
     * Resets the 3D CSS transform of `el` so it is translated by `offset` pixels
     * @param {HTMLElement} el
     * @param {maptalks.Point} offset
     */
    setTransform: function (el, offset) {
        var pos = offset || new maptalks.Point(0, 0);
        el.style[maptalks.DomUtil.TRANSFORM] =
            (maptalks.Browser.ie3d ?
                'translate(' + pos.x + 'px,' + pos.y + 'px)' :
                'translate3d(' + pos.x + 'px,' + pos.y + 'px,0)');

        return this;
    },

    setTransformMatrix: function (el, m) {
        el.style[maptalks.DomUtil.TRANSFORM] =  'matrix(' + m.join() + ')';
        return this;
    },

    removeTransform: function (el) {
        el.style[maptalks.DomUtil.TRANSFORM] =  null;
        return this;
    },

    isHTML: function (str) {
        return /<[a-z\][\s\S]*>/i.test(str);
    },

    measureDom: function (parentTag, dom) {
        var ruler = maptalks.DomUtil._getDomRuler(parentTag);
        if (maptalks.Util.isString(dom)) {
            ruler.innerHTML = dom;
        } else {
            ruler.appendChild(dom);
        }
        var result = new maptalks.Size(ruler.clientWidth, ruler.clientHeight);
        maptalks.DomUtil.removeDomNode(ruler);
        return result;
    },

    _getDomRuler:function (tag) {
        var span = document.createElement(tag);
        span.style.cssText = 'position:absolute;left:-10000px;top:-10000px;';
        document.body.appendChild(span);
        return span;
    }

};

/**
 * Alias for [addDomEvent]{@link maptalks.DomUtil.addDomEvent}
 * @param {HTMLElement} obj     - dom element to listen on
 * @param {String} typeArr      - event types, seperated by space
 * @param {Function} handler    - listener function
 * @param {Object} context      - function context
 * @static
 * @function
 * @return {maptalks.DomUtil}
 */
maptalks.DomUtil.on = maptalks.DomUtil.addDomEvent;

/**
* Alias for [removeDomEvent]{@link maptalks.DomUtil.removeDomEvent}
* @param {HTMLElement} obj         - dom element
* @param {String} typeArr          - event types, separated by space
* @param {Function} handler        - listening function
* @static
* @function
* @return {maptalks.DomUtil}
*/
maptalks.DomUtil.off = maptalks.DomUtil.removeDomEvent;

(function () {
    if (maptalks.node) {
        return;
    }
    // Borrowed from Leaflet.DomUtil

    // prefix style property names

    /**
     * Vendor-prefixed fransform style name (e.g. `'webkitTransform'` for WebKit).
     * @property {String} TRANSFORM
     * @memberOf maptalks.DomUtil
     * @type {String}
     */
    maptalks.DomUtil.TRANSFORM = maptalks.DomUtil.testProp(
            ['transform', 'WebkitTransform', 'OTransform', 'MozTransform', 'msTransform']);

    /**
     * Vendor-prefixed tfransform-origin name (e.g. `'webkitTransformOrigin'` for WebKit).
     * @property {String} TRANSFORMORIGIN
     * @memberOf maptalks.DomUtil
     * @type {String}
     */
    maptalks.DomUtil.TRANSFORMORIGIN = maptalks.DomUtil.testProp(
            ['transformOrigin', 'WebkitTransformOrigin', 'OTransformOrigin', 'MozTransformOrigin', 'msTransformOrigin']);

    /**
     * Vendor-prefixed transition name (e.g. `'WebkitTransition'` for WebKit).
     * @property {String} TRANSITION
     * @memberOf maptalks.DomUtil
     * @type {String}
     */
    maptalks.DomUtil.TRANSITION = maptalks.DomUtil.testProp(
            ['transition', 'WebkitTransition', 'OTransition', 'MozTransition', 'msTransition']);

    /**
     * Vendor-prefixed filter name (e.g. `'WebkitFilter'` for WebKit).
     * @property {String} FILTER
     * @memberOf maptalks.DomUtil
     * @type {String}
     */
    maptalks.DomUtil.CSSFILTER = maptalks.DomUtil.testProp(
            ['filter', 'WebkitFilter', 'OFilter', 'MozFilter', 'msFilter']);

})();


