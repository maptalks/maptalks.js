import { isNumber } from 'core/util';
import Handler from 'core/Handler';
import Browser from 'core/Browser';
import { on, off } from 'core/util/dom';
import Point from 'geo/Point';

/**
 * Drag handler
 * @class
 * @category handler
 * @protected
 * @extends Handler
 */
export const DragHandler = Handler.extend(/** @lends Handler.Drag.prototype */ {

    START: Browser.touch ? ['touchstart', 'mousedown'] : ['mousedown'],
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

    initialize: function (dom, options) {
        this.dom = dom;
        this.options = options;
    },

    enable: function () {
        if (!this.dom) {
            return;
        }
        on(this.dom, this.START.join(' '), this.onMouseDown, this);
    },


    disable: function () {
        if (!this.dom) {
            return;
        }
        off(this.dom, this.START.join(' '), this.onMouseDown);
    },

    onMouseDown: function (event) {
        if (isNumber(event.button) && event.button === 2) {
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
        dom['ondragstart'] = function () {
            return false;
        };
        this.moved = false;
        var actual = event.touches ? event.touches[0] : event;
        this.startPos = new Point(actual.clientX, actual.clientY);
        //2015-10-26 fuzhen 改为document, 解决鼠标移出地图容器后的不可控现象
        on(document, this.MOVE[event.type], this.onMouseMove, this)
            .on(document, this.END[event.type], this.onMouseUp, this);
        this.fire('mousedown', {
            'domEvent': event,
            'mousePos': new Point(actual.clientX, actual.clientY)
        });
    },

    onMouseMove: function (event) {
        if (event.touches && event.touches.length > 1) {
            return;
        }
        var actual = event.touches ? event.touches[0] : event;

        var newPos = new Point(actual.clientX, actual.clientY),
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
                'domEvent': event,
                'mousePos': this.startPos.copy()
            });
            this.moved = true;
        } else {
            /**
             * 触发dragging事件
             * @event dragging
             * @return {Object} mousePos: {'left': 0px, 'top': 0px}
             */
            this.fire('dragging', {
                'domEvent': event,
                'mousePos': new Point(actual.clientX, actual.clientY)
            });
        }
    },

    onMouseUp: function (event) {
        var dom = this.dom;
        var actual = event.changedTouches ? event.changedTouches[0] : event;
        for (var i in this.MOVE) {
            off(document, this.MOVE[i], this.onMouseMove, this);
            off(document, this.END[i], this.onMouseUp, this);
        }
        if (dom['releaseCapture']) {
            dom['releaseCapture']();
        } else if (window.captureEvents) {
            window.captureEvents(window['Event'].MOUSEMOVE | window['Event'].MOUSEUP);
        }
        var param = {
            'domEvent': event
        };
        if (isNumber(actual.clientX)) {
            param['mousePos'] = new Point(parseInt(actual.clientX, 0), parseInt(actual.clientY, 0));
        }
        if (this.moved /* && this.moving*/ ) {
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

export default DragHandler;
