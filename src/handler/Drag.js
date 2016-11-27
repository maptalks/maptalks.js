/**
 * Drag handler
 * @class
 * @category handler
 * @protected
 * @extends maptalks.Handler
 */
maptalks.Handler.Drag = maptalks.Handler.extend(/** @lends maptalks.Handler.Drag.prototype */{

    START: maptalks.Browser.touch ? ['touchstart', 'mousedown'] : ['mousedown'],
    END: {
        mousedown: 'mouseup',
        touchstart: 'touchend',
        pointerdown: 'touchend',
        MSPointerDown: 'touchend'
    },
    MOVE: {
        mousedown: 'mousemove',
        touchstart: 'touchmove',
        pointerdown: 'touchmove',
        MSPointerDown: 'touchmove'
    },

    initialize:function (dom, options) {
        this.dom = dom;
        this.options = options;
    },

    enable:function () {
        if (!this.dom) { return; }
        maptalks.DomUtil.on(this.dom, this.START.join(' '), this.onMouseDown, this);
    },


    disable:function () {
        if (!this.dom) { return; }
        maptalks.DomUtil.off(this.dom, this.START.join(' '), this.onMouseDown);
    },

    onMouseDown:function (event) {
        if (maptalks.Util.isNumber(event.button) && event.button === 2) {
            //不响应右键事件
            return;
        }
        if (this.options && this.options['cancelOn'] && this.options['cancelOn'](event) === true) {
            return;
        }
        var dom = this.dom;
        if (dom.setCapture) {
            dom.setCapture();
        } else if (window.captureEvents) {
            window.captureEvents(window['Event'].MOUSEMOVE | window['Event'].MOUSEUP);
        }
        dom['ondragstart'] = function () { return false; };
        this.moved = false;
        var actual = event.touches ? event.touches[0] : event;
        this.startPos = new maptalks.Point(actual.clientX, actual.clientY);
        //2015-10-26 fuzhen 改为document, 解决鼠标移出地图容器后的不可控现象
        maptalks.DomUtil.on(document, this.MOVE[event.type], this.onMouseMove, this)
            .on(document, this.END[event.type], this.onMouseUp, this);
        this.fire('mousedown', {
            'domEvent' : event,
            'mousePos': new maptalks.Point(actual.clientX, actual.clientY)
        });
    },

    onMouseMove:function (event) {
        if (event.touches && event.touches.length > 1) {
            return;
        }
        var actual = event.touches ? event.touches[0] : event;

        var newPos = new maptalks.Point(actual.clientX, actual.clientY),
            offset = newPos.substract(this.startPos);
        if (!offset.x && !offset.y) {
            return;
        }
        if (!this.moved) {
            /**
             * 触发dragstart事件
             * @event dragstart
             * @return {Object} mousePos: {'left': 0px, 'top': 0px}
             */
            this.fire('dragstart', {
                'domEvent' : event,
                'mousePos':this.startPos.copy()
            });
            this.moved = true;
        } else {
             /**
             * 触发dragging事件
             * @event dragging
             * @return {Object} mousePos: {'left': 0px, 'top': 0px}
             */
            this.fire('dragging', {
                'domEvent' : event,
                'mousePos': new maptalks.Point(actual.clientX, actual.clientY)
            });
        }
    },

    onMouseUp:function (event) {
        var dom = this.dom;
        var actual = event.changedTouches ? event.changedTouches[0] : event;
        for (var i in this.MOVE) {
            maptalks.DomUtil
                .off(document, this.MOVE[i], this.onMouseMove, this)
                .off(document, this.END[i], this.onMouseUp, this);
        }
        if (dom['releaseCapture']) {
            dom['releaseCapture']();
        } else if (window.captureEvents) {
            window.captureEvents(window['Event'].MOUSEMOVE | window['Event'].MOUSEUP);
        }
        var param = {
            'domEvent' : event
        };
        if (maptalks.Util.isNumber(actual.clientX)) {
            param['mousePos'] = new maptalks.Point(parseInt(actual.clientX, 0), parseInt(actual.clientY, 0));
        }
        if (this.moved/* && this.moving*/) {
            /**
             * 触发dragend事件
             * @event dragend
             * @return {Object} mousePos: {'left': 0px, 'top': 0px}
             */
            this.fire('dragend', param);
        }

        this.fire('mouseup', param);
    }
});
