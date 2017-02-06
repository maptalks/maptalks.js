import { isNumber } from 'core/util';
import Handler from 'handler/Handler';
import Browser from 'core/Browser';
import { on, off } from 'core/util/dom';
import Point from 'geo/Point';

const START_EVENTS = Browser.touch ? 'touchstart mousedown' : 'mousedown';
const MOVE_EVENTS = {
    mousedown: 'mousemove',
    touchstart: 'touchmove',
    pointerdown: 'touchmove',
    MSPointerDown: 'touchmove'
};
const END_EVENTS = {
    mousedown: 'mouseup',
    touchstart: 'touchend',
    pointerdown: 'touchend',
    MSPointerDown: 'touchend'
};

/**
 * Drag handler
 * @category handler
 * @protected
 * @extends Handler
 */
class DragHandler extends Handler {

    constructor(dom, options) {
        super(null);
        this.dom = dom;
        this.options = options;
    }

    enable() {
        if (!this.dom) {
            return;
        }
        on(this.dom, START_EVENTS, this.onMouseDown, this);
    }


    disable() {
        if (!this.dom) {
            return;
        }
        off(this.dom, START_EVENTS, this.onMouseDown);
    }

    onMouseDown(event) {
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
        on(document, MOVE_EVENTS[event.type], this.onMouseMove, this);
        on(document, END_EVENTS[event.type], this.onMouseUp, this);
        this.fire('mousedown', {
            'domEvent': event,
            'mousePos': new Point(actual.clientX, actual.clientY)
        });
    }

    onMouseMove(event) {
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
    }

    onMouseUp(event) {
        var dom = this.dom;
        var actual = event.changedTouches ? event.changedTouches[0] : event;
        for (var i in MOVE_EVENTS) {
            off(document, MOVE_EVENTS[i], this.onMouseMove, this);
            off(document, END_EVENTS[i], this.onMouseUp, this);
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
};

export default DragHandler;
