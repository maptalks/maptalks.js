/**
 * 面板控件
 * @class maptalks.Panel
 * @extends maptalks.Control
 * @mixins maptalks.Eventable
 * @author Maptalks Team
 */
Z.control.Panel = Z.Control.extend({
    /**
     * @cfg {Object} options 面板属性
     */
    options:{
        'position' : {
            'top'       : '0',
            'right'     : '0'
        },
        'draggable'     : true,
        'custom'        : false,
        'content'       : '',
        'closeButton'   : true
    },

    buildOn: function (map) {
        var dom;
        if (this.options['custom']) {
            if (Z.Util.isString(this.options['content'])) {
                dom = Z.DomUtil.createEl('div');
                dom.innerHTML = this.options['content'];
            } else {
                dom = this.options['content'];
            }
        } else {
            dom = Z.DomUtil.createEl('div', 'maptalks-panel');
            if (this.options['closeButton']) {
                var closeButton = Z.DomUtil.createEl('a','maptalks-close');
                closeButton.href = 'javascript:;';
                closeButton.onclick = function() {
                    dom.style.display = "none";
                };
                dom.appendChild(closeButton);
            }

            var panelContent = Z.DomUtil.createEl('div', 'maptalks-panel-content');
            panelContent.innerHTML = this.options['content'];
            dom.appendChild(panelContent);
        }

        this.draggable = new Z.Handler.Drag(dom);

        this.draggable.on("dragstart", this._onDragStart, this);
        this.draggable.on("dragging", this._onDragging, this);
        this.draggable.on("dragend", this._onDragEnd, this);

        if (this.options['draggable']) {
            this.draggable.enable();
        }

        return dom;
    },

    _onDragStart:function(param) {
        console.log('drag');
        this._startPos = param['mousePos'];
        this._startPosition = Z.Util.extend({},this.options['position']);
    },

    _onDragging:function(param) {
        var pos = param['mousePos'];
        var offset = pos.substract(this._startPos);

        var startPosition = this._startPosition;
        var position = this.options['position'];
        if (!Z.Util.isNil(position['top'])) {
            position['top'] = startPosition['top'] + offset.y;
        }
        if (!Z.Util.isNil(position['bottom'])) {
            position['bottom'] = startPosition['bottom'] - offset.y;
        }
        if (!Z.Util.isNil(position['left'])) {
            position['left'] = startPosition['left'] + offset.x;
        }
        if (!Z.Util.isNil(position['right'])) {
            position['right'] = startPosition['right'] - offset.x;
        }

        this._updatePosition();
    },

    _onDragEnd:function(param) {
        delete this._startPos;
        delete this._startPosition;
    },

    /**
     * 获取panel端点数组
     */
    getConnectPoints: function() {
        var map = this._map;
        var containerPoint = this.getContainerPoint();
        var controlContainer = this.getContainer(),
            width = controlContainer.clientWidth,
            height = controlContainer.clientHeight;

        var anchors = [
            //top center
            map.containerPointToCoordinate(
                containerPoint.add(new Z.Point(Math.round(width/2),0))
            ),
            //middle right
            map.containerPointToCoordinate(
                containerPoint.add(new Z.Point(width, Math.round(height/2)))
            ),
            //bottom center
            map.containerPointToCoordinate(
                containerPoint.add(new Z.Point(Math.round(width/2), height))
            ),
            //middle left
            map.containerPointToCoordinate(
                containerPoint.add(new Z.Point(0,Math.round(height/2)))
            )

        ];
        return anchors;
    }

});
