/**
 * 拖动
 * @class maptalks.Handler.Drag
 * @extends maptalks.Handler
 * @author Maptalks Team
 */
Z.Handler.Drag = Z.Handler.extend({

    START: Z.Browser.touch ? ['touchstart', 'mousedown'] : ['mousedown'],
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

    /**
     * @constructor
     * @param {HTMLElement} dom
     */
    initialize:function(dom){
        this.dom = dom;
    },

    /**
     * 激活
     */
    enable:function(){
        if (!this.dom) {return;}
        Z.DomUtil.on(this.dom, this.START.join(' '), this.onMouseDown, this);
    },

    /**
     * 停止
     */
    disable:function(){
        if (!this.dom) {return;}
        Z.DomUtil.off(this.dom, this.START.join(' '), this.onMouseDown);
    },

    onMouseDown:function(event) {
        if (Z.Util.isNumber(event.button) && event.button === 2) {
            //不响应右键事件
            return;
        }
        var dom = this.dom;
        if(dom.setCapture) {
            dom.setCapture();
        } else if(window.captureEvents) {
            window.captureEvents(window['Event'].MOUSEMOVE|window['Event'].MOUSEUP);
        }
        Z.DomUtil.preventDefault(event);
        dom['ondragstart'] = function() { return false; };
        this.moved = false;
        var actual = event.touches ? event.touches[0] : event;
        // if (this.moving) { return; }
        this.startPos = new Z.Point(actual.clientX, actual.clientY);
        //2015-10-26 fuzhen 改为document, 解决鼠标移出地图容器后的不可控现象
        Z.DomUtil.on(document,this.MOVE[event.type],this.onMouseMove,this);
        Z.DomUtil.on(document,this.END[event.type],this.onMouseUp,this);
    },

    onMouseMove:function(event) {
        if ( event.touches && event.touches.length > 1) {
            return;
        }
        var dom = this.dom;
        Z.DomUtil.preventDefault(event);
        var actual = event.touches ? event.touches[0] : event;
        Z.Util.requestAnimFrame(Z.Util.bind(function() {
            var newPos = new Z.Point(actual.clientX, actual.clientY),
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
                this.fire('dragstart',{
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
                this.fire('dragging',{
                        'domEvent' : event,
                        'mousePos': new Z.Point(actual.clientX, actual.clientY)
                    });
                /*try {

                } catch (error) {
                    Z.DomUtil.off(document,'mousemove',this.onMouseMove);
                    Z.DomUtil.off(document,'mouseup',this.onMouseUp);
                }*/

            }
            // this.moving = true;
        },this));



    },

    onMouseUp:function(event){
        var dom = this.dom;
        Z.DomUtil.preventDefault(event);
        var actual = event.changedTouches ? event.changedTouches[0] : event;
        for (var i in this.MOVE) {
            Z.DomUtil
                .off(document, this.MOVE[i], this.onMouseMove, this)
                .off(document, this.END[i], this.onMouseUp, this);
        }
        if(dom['releaseCapture']) {
            dom['releaseCapture']();
        } else if(window.captureEvents) {
            window.captureEvents(window['Event'].MOUSEMOVE|window['Event'].MOUSEUP);
        }
        if (this.moved/* && this.moving*/) {
            /**
             * 触发dragend事件
             * @event dragend
             * @return {Object} mousePos: {'left': 0px, 'top': 0px}
             */
            this.fire('dragend',{
                'domEvent' : event,
                'mousePos': new Z.Point(parseInt(actual.clientX,0),parseInt(actual.clientY,0))
            });
        }
        // this.moving = false;
    }
});
