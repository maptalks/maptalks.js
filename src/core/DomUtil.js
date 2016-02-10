/**
 * Dom基础工具类
 * @class maptalks.DomUtil
 * @author Maptalks Team
 */
Z.DomUtil = {

    /**
     * 创建Html Element
     * @param {String} tagName 标签名
     * @return {HTMLElement} element
     */
    createEl:function(tagName, className) {
        var el = document.createElement(tagName);
        if (className) {
            Z.DomUtil.setClass(el, className);
        }
        return el;
    },

    /**
     * 在指定的Html节点上创建Element
     * @param {String} tagName 标签名
     * @param {String} style 样式
     * @param {HTMLElement} container html节点
     * @return {HTMLElement} element
     */
    createElOn:function(tagName, style, container) {
        var el = this.createEl(tagName);
        if(style) {
            this.setStyle(el, style);
        }
        if (container) {
            container.appendChild(el);
        }
        return el;
    },

    /**
     * 删除dom节点
     * @param {HTMLElement} node 待删除的节点
     */
    removeDomNode:function(node){
        if (!node) {return;}
        if (Z.Browser.ie) {
            var d = Z.DomUtil.createEl('div');
           d.appendChild(node);
            d.innerHTML = '';
            d = null;
        } else {
            if (node.parentNode) {
                node.parentNode.removeChild(node);
            }
        }
    },

    /**
     * 向dom添加事件
     * @param {HTMLElement} obj 添加事件的dom对象
     * @param {String} typeArr 事件名字符串，多个事件名用空格分开
     * @param {Function} handler 事件触发后的回调函数
     * @param {Object} context 上下文对象
     * @return {Object} 上下文对象
     */
    addDomEvent:function(obj, typeArr, handler, context) {
        if (!obj || !typeArr || !handler) {return Z.DomUtil;}
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

            if (!obj['Z__'+type]) {
                obj['Z__'+type]=[];

            }
            var hit = Z.DomUtil.hasDomEvent(obj,type,handler);
            if (hit >= 0) {
                Z.DomUtil.removeDomEvent(obj,type,handler);
            }
            obj['Z__'+type].push({callback:eventHandler,src:handler});
            if ('addEventListener' in obj) {
                //滚轮事件的特殊处理
                if (type === "mousewheel" && document['mozHidden'] !== undefined) {
                    type = "DOMMouseScroll";
                }
                obj.addEventListener(type, eventHandler, false);
            } else if ('attachEvent' in obj) {
                obj.attachEvent('on' + type, eventHandler);
            }
        }
        return Z.DomUtil;
    },

    /**
     * 从dom上移除事件
     * @param {HTMLElement} obj 添加事件的dom对象
     * @param {String} typeArr 事件名字符串，多个事件名用空格分开
     * @param {Function} handler 事件触发后的回调函数
     * @return {Object} 上下文对象
     */
    removeDomEvent:function(obj, typeArr, handler) {
        function doRemove(type,callback) {
            if ('removeEventListener' in obj) {
                //滚轮事件的特殊处理
                if (type === "mousewheel" && document['mozHidden'] !== undefined) {
                    type = "DOMMouseScroll";
                }
                obj.removeEventListener(type, callback, false);
            } else if ('detachEvent' in obj) {
                obj.detachEvent('on' + type, callback);
            }
        }
        if (!obj || !typeArr) {return this;}
         var types = typeArr.split(' ');
        for (var i = types.length - 1; i >= 0; i--) {
            var type = types[i];
            if (!type) {
                continue;
            }
            //如果handler为空,则删除所有的注册事件
            if (!handler && obj['Z__'+type]) {
                var handlers = obj['Z__'+type];
                for (var j=0,jlen=handlers.length;j<jlen;j++) {
                    doRemove(handlers[j].callback);
                }
                delete obj['Z__'+type];
                return this;
            }
            //删除注册的handler事件
            var hit = this.hasDomEvent(obj,type,handler);
            if (hit < 0) {
                return this;
            }
            var hitHandler = obj['Z__'+type][hit];
            doRemove(type,hitHandler.callback);
            obj['Z__'+type].splice(hit,1);
        }
        return this;
    },

    /**
     * 检查dom是存在某事件
     * @param {HTMLElement} obj 添加事件的dom对象
     * @param {String} typeArr 事件名字符串，多个事件名用空格分开
     * @param {Function} handler 事件触发后的回调函数
     * @return {Number}  大于0，存在；反之，不存在
     */
    hasDomEvent:function(obj, type, handler) {
        if (!obj || !obj['Z__'+type] || !handler) {
            return -1;
        }
        var handlers = obj['Z__'+type];
        for (var i=0,len=handlers.length;i<len;i++) {
            if (handlers[i].src == handler) {
                return i;
            }
        }
        return -1;
    },

    /**
     * 阻止默认事件
     * preventDefault Cancels the event if it is cancelable, without stopping further propagation of the event.
     * @param {Event} event dom事件
     */
    preventDefault: function(event) {
        if (event.preventDefault) {
            event.preventDefault();
        } else {
            event.returnValue = false;
        }
    },

    /**
     * 阻止事件冒泡
     * @param  {Event} e dom事件
     * @return {HTMLElement} dom元素
     */
    stopPropagation: function (e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        } else {
            e.cancelBubble = true;
        }
        return this;
    },

    /**
     * 让dom位置偏移offset
     * @param  {HTMLElement} dom HTMLElement
     * @param {Object} [offset] 偏移量
     * @return {Object} dom位置偏移后的位置
     */
    offsetDom: function(dom, offset) {
        if (!dom) {return null;}
        if (!offset) {
            return new Z.Point(parseInt(dom.style.left,0),parseInt(dom.style.top,0));
        } else {
            dom.style.left= offset.x+'px';
            dom.style.top = offset.y +'px';
            return offset;
        }
    },

    /**
     * 让dom位置变换偏移offset
     * @param  {HTMLElement} dom HTMLElement
     * @param {Object} [offset] 偏移量
     * @return {Object} dom位置偏移后的位置
     */
    offsetDomTranslate:function(dom, offset) {
        var useTranslate = (Z.Browser.translateDom);
        if (!useTranslate) {
            return null;
        }
        if (!offset) {
            return this.parseCssTranslate(dom);
        } else {
            dom.style[this.TRANSFORM]='translate3d('+offset.x+'px,'+offset.y+'px,0px)';
            return offset;
        }
    },

    /**
     * 解析css translate3d值
     * @param  {HTMLElement} dom dom对象
     * @return {maptalk.Point} 点
     */
    parseCssTranslate:function(dom) {
        var transValue = dom.style[this.TRANSFORM];
        if (!transValue) {
            return new Z.Point(0,0);
        }
        var splitted = transValue.split(',');
        var left = parseInt(splitted[0].split('(')[1],0),
            top = parseInt(splitted[1],0);
        return new Z.Point(left,top);
    },

    /**
     * 获取dom对象在页面上的屏幕坐标
     * @param  {HTMLElement} obj Dom对象
     * @return {Object}     屏幕坐标
     */
    getPageCoordinate:function(obj) {
        if (obj.getBoundingClientRect) {
            var docEl = document.documentElement;
            var rect = obj.getBoundingClientRect();
            return new Z.Point(rect['left']+docEl['scrollLeft'], rect['top']+docEl['scrollTop']);
        }
        var topValue= 0,leftValue= 0;
        if (!obj) {
            console.error('obj is null');
        }
        leftValue+= parseInt(obj.offsetLeft,0);
        topValue+= parseInt(obj.offsetTop,0);
        obj= obj.offsetParent;
        while(obj){
            leftValue+= parseInt(obj.offsetLeft,0);
            topValue+= parseInt(obj.offsetTop,0);
            obj= obj.offsetParent;
        }
       return new Z.Point(leftValue, topValue);
    },

    /**
     * 获取事件触发页面的屏幕坐标
     * @param  {Event} ev 事件
     * @return {Object} 屏幕坐标
     */
    getEventPagePoint:function(ev) {
        ev = ev || window.event;
        if(ev.pageX || ev.pageY){
            return {x:ev.pageX, y:ev.pageY};
        }else{
            //解决是否定义DOCTYPE W3C DTD标准取值滚动条参数
            var dBody = document.body;//无标准这有效
            var dElement = document.documentElement;//有标准这有效
            var scrollLeft = dElement.scrollLeft?dElement.scrollLeft:dBody.scrollLeft;
            var clientLeft = dElement.clientLeft?dElement.clientLeft:dBody.clientLeft;
            var scrollTop = dElement.scrollTop?dElement.scrollTop:dBody.scrollTop;
            var clientTop = dElement.clientTop?dElement.clientTop:dBody.clientTop;
            return new Z.Point(
                ev.clientX + scrollLeft - clientLeft,
                ev.clientY + scrollTop  - clientTop
            );
        }
    },

    /**
     * 获取鼠标在容器上相对容器左上角的坐标值
     * @param {Event} ev  触发的事件
     * @return {maptalks.Point} left:鼠标在页面上的横向位置, top:鼠标在页面上的纵向位置
     */
    getEventContainerPoint:function(ev, dom) {
        if (!ev) {
            ev = window.event;
        }
        var domScreenPos = Z.DomUtil.getPageCoordinate(dom);
        var mousePagePos = Z.DomUtil.getEventPagePoint(ev);
        return new Z.Point(mousePagePos.x-domScreenPos.x,mousePagePos.y-domScreenPos.y);
    },

    /**
     * 判断是否支持样式
     * @param {Array} style数组
     * @return {Boolean} true，支持；false，不支持
     */
    testCssProp: function (props) {
        if (typeof(document) === 'undefined') {
            return true;
        }
        var style = document.documentElement.style;
        for (var i = 0; i < props.length; i++) {
            if (props[i] in style) {
                return props[i];
            }
        }
        return false;
    },

    /**
     * 为dom设置transform
     * @param {HTMLElement} dom节点
     * @param {String} transformStr
     */
    setDomTransform:function(node,transformStr){
        node.style[this.TRANSFORM] = transformStr;
    },

    /**
     * 获取dom transform
     * @param {HTMLElement} node dom节点
     * @param {String} transformStr
     */
    getDomTransformOrigin:function(node) {
        return node.style[this.TRANSFORM_ORIGIN];
    },

    /**
     * 为dom设置transform
     * @param {HTMLElement} node dom节点
     * @param {String} transformOriginStr
     */
    setDomTransformOrigin:function(node, transformOriginStr){
        node.style[this.TRANSFORM_ORIGIN] = transformOriginStr;
    },

    /**
     * 为dom设置透明度
     * @param {HTMLElement} dom dom节点
     * @param {Number} opacity 透明度值
     */
    setOpacity:function(dom, opacity) {
        if (Z.Browser.ielt9) {
            dom.style.filter="progid:DXImageTransform.Microsoft.Alpha(Opacity="+opacity*100+")";
        } else {
            dom.style.opacity = opacity;
        }
    },

    /**
     * 为dom设置样式
     * @param {HTMLElement} dom dom节点
     * @param {String} strCss 样式字符串
     */
    setStyle : function(dom, strCss) {
        function endsWith(str, suffix) {
            var l = str.length - suffix.length;
            return l >= 0 && str.indexOf(suffix, l) == l;
        }
        var style = dom.style,
            cssText = style.cssText;
        if(!endsWith(cssText, ';')){
            cssText += ';';
        }
        dom.style.cssText = cssText + strCss;
    },

    /**
     * 清空dom样式
     * @param {HTMLElement} dom dom节点
     */
    removeStyle: function(dom) {
        dom.style.cssText = '';
    },

    /**
     * 为dom添加样式
     * @param {HTMLElement} dom dom节点
     * @param {String} attr 样式标签
     * @param {String} value 样式值
     */
    addStyle: function(dom, attr, value) {
         var css = dom.style.cssText;
         if(attr && value) {
             var newStyle = attr+':'+value+';';
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
        var className = Z.DomUtil.getClass(el);
        return className.length > 0 && new RegExp('(^|\\s)' + name + '(\\s|$)').test(className);
    },

    /**
     * 为dom添加class
     * @param {HTMLElement} el html元素
     * @param {String} name class名称
     */
    addClass: function (el, name) {
        if (el.classList !== undefined) {
            var classes = Z.StringUtil.splitWords(name);
            for (var i = 0, len = classes.length; i < len; i++) {
                el.classList.add(classes[i]);
            }
        } else if (!Z.DomUtil.hasClass(el, name)) {
            var className = Z.DomUtil.getClass(el);
            Z.DomUtil.setClass(el, (className ? className + ' ' : '') + name);
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
            Z.DomUtil.setClass(el, Z.StringUtil.trim((' ' + Z.DomUtil.getClass(el) + ' ').replace(' ' + name + ' ', ' ')));
        }
    },

    /**
     * 设置dom class
     * @param {HTMLElement} el html元素
     * @param {String} name class名称
     */
    setClass: function (el, name) {
        if (Z.Util.isNil(el.className.baseVal)) {
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
        return Z.Util.isNil(el.className.baseVal) ? el.className : el.className.baseVal;
    },

    /**
     * 获取像素的数值
     * @param {String} pixelStr 带单位的像素字符串，例如：100px
     * @return {Number} pixel
     */
    getPixelValue: function(pixelStr) {
        if(pixelStr&&pixelStr.length>2) {
            var str = pixelStr.substring(0,pixelStr.length-2);
            return parseInt(str);
        }
        return 0;
    },

    copyCanvas:function(src) {
        var target = Z.Canvas.createCanvas(src.width, src.height);
        target.getContext('2d').drawImage(src,0,0);
        return target;
    },

    /**
     * 测试Canvas大小是否合法
     * @param  {size}   canvas大小
     * @return {[type]}   [description]
     */
    testCanvasSize: (function() {
        //usually in node
        if (Z.runningInNode) {
            return function(){return true;};
        }
          /**
           * @type {CanvasRenderingContext2D}
           */
          var context = null;

          /**
           * @type {ImageData}
           */
          var imageData = null;

          return function(size) {
            if (!context) {
              var _canvas = Z.DomUtil.createEl('canvas');
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
                  if (result.data[i] != imageData.data[i]) {
                    arrEqual = false;
                    break;
                  }
              };
              good = arrEqual;
            }
            return good;
          };
        })()

};

/**
 * @cfg TRANSFORM
 * @member maptalks.DomUtil
 */
Z.DomUtil.TRANSFORM = Z.DomUtil.testCssProp(['transform', 'WebkitTransform', 'OTransform', 'MozTransform', 'msTransform']);

/**
 * @cfg TRANSFORM_ORIGIN
 * @member maptalks.DomUtil
 */
Z.DomUtil.TRANSFORM_ORIGIN= Z.DomUtil.testCssProp(['transformOrigin', 'WebkitTransformOrigin', 'OTransformOrigin', 'MozTransformOrigin', 'msTransformOrigin']);

/**
 * 停止拖动
 * @member maptalks.DomUtil
 */
Z.DomUtil.disableImageDrag = function () {
    Z.DomUtil.on(window, 'dragstart', Z.DomUtil.preventDefault);
};

/**
 * 启用拖动
 * @member maptalks.DomUtil
 */
Z.DomUtil.enableImageDrag = function () {
    Z.DomUtil.off(window, 'dragstart', Z.DomUtil.preventDefault);
};

/**
 * 阻止outline
 * @param {HTMLElement} element
 * @member maptalks.DomUtil
 */
Z.DomUtil.preventOutline = function (element) {
    Z.DomUtil.restoreOutline();
    this._outlineElement = element;
    this._outlineStyle = element.style.outline;
    element.style.outline = 'none';
    Z.DomUtil.on(window, 'keydown', Z.DomUtil.restoreOutline, this);
};

/**
 * 恢复outline
 * @member maptalks.DomUtil
 */
Z.DomUtil.restoreOutline = function () {
    if (!this._outlineElement) { return; }
    this._outlineElement.style.outline = this._outlineStyle;
    delete this._outlineElement;
    delete this._outlineStyle;
    Z.DomUtil.off(window, 'keydown', Z.DomUtil.restoreOutline, this);
};

/**
 * 向dom添加事件
 * @param {HTMLElement} obj 添加事件的dom对象
 * @param {String} typeArr 事件名字符串，多个事件名用空格分开
 * @param {Function} handler 事件触发后的回调函数
 * @param {Object} context 上下文对象
 * @member maptalks.DomUtil
 * @return {Object} 上下文对象
 */
Z.DomUtil.on = Z.DomUtil.addDomEvent;

/**
 * 从dom上移除事件
 * @param {HTMLElement} obj 添加事件的dom对象
 * @param {String} typeArr 事件名字符串，多个事件名用空格分开
 * @param {Function} handler 事件触发后的回调函数
 * @member maptalks.DomUtil
 * @return {Object} 上下文对象
 */
Z.DomUtil.off = Z.DomUtil.removeDomEvent;
