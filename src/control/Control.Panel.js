/**
 * @classdesc
 * Class for panel controls.
 * @class
 * @category control
 * @extends maptalks.Control
 * @memberOf maptalks.control
 * @name Panel
 * @param {Object} options - construct options
 * @param {Boolean} [options.draggable=true]            - whether the panel can be dragged
 * @param {Boolean} [options.custom=false]              - whether the panel's content is customized .
 * @param {String|HTMLElement} options.content          - panel's content, can be a dom element or a string.
 * @param {Boolean} [options.closeButton=true]          - whether to display the close button on the panel.
 */
Z.control.Panel = Z.Control.extend(/** @lends maptalks.control.Panel.prototype */{

    /**
     * @property {Object} options - options
     * @property {Boolean} [options.draggable=true]            - whether the panel can be dragged
     * @property {Boolean} [options.custom=false]              - whether the panel's content is customized .
     * @property {String|HTMLElement} options.content          - panel's content, can be a dom element or a string.
     * @property {Boolean} [options.closeButton=true]          - whether to display the close button on the panel.
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

    buildOn: function () {
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
                var closeButton = Z.DomUtil.createEl('a', 'maptalks-close');
                closeButton.href = 'javascript:;';
                closeButton.onclick = function () {
                    dom.style.display = 'none';
                };
                dom.appendChild(closeButton);
            }

            var panelContent = Z.DomUtil.createEl('div', 'maptalks-panel-content');
            panelContent.innerHTML = this.options['content'];
            dom.appendChild(panelContent);
        }

        this.draggable = new Z.Handler.Drag(dom);

        this.draggable.on('mousedown', this._onMouseDown, this)
            .on('dragstart', this._onDragStart, this)
            .on('dragging', this._onDragging, this)
            .on('dragend', this._onDragEnd, this);

        if (this.options['draggable']) {
            this.draggable.enable();
        }

        return dom;
    },

    _onMouseDown: function (param) {
        Z.DomUtil.stopPropagation(param['domEvent']);
    },

    _onDragStart:function (param) {
        this._startPos = param['mousePos'];
        this._startPosition = Z.Util.extend({}, this.getPosition());
    },

    _onDragging:function (param) {
        var pos = param['mousePos'];
        var offset = pos.substract(this._startPos);

        var startPosition = this._startPosition;
        var position = this.getPosition();
        if (!Z.Util.isNil(position['top'])) {
            position['top'] = +startPosition['top'] + offset.y;
        }
        if (!Z.Util.isNil(position['bottom'])) {
            position['bottom'] = +startPosition['bottom'] - offset.y;
        }
        if (!Z.Util.isNil(position['left'])) {
            position['left'] = +startPosition['left'] + offset.x;
        }
        if (!Z.Util.isNil(position['right'])) {
            position['right'] = +startPosition['right'] - offset.x;
        }
        this.setPosition(position);
    },

    _onDragEnd:function () {
        delete this._startPos;
        delete this._startPosition;
    },

    /**
     * 获取panel端点数组
     */
    _getConnectPoints: function () {
        var map = this._map;
        var containerPoint = this.getContainerPoint();
        var controlContainer = this.getContainer(),
            width = controlContainer.clientWidth,
            height = controlContainer.clientHeight;

        var anchors = [
            //top center
            map.containerPointToCoordinate(
                containerPoint.add(new Z.Point(Math.round(width / 2), 0))
            ),
            //middle right
            map.containerPointToCoordinate(
                containerPoint.add(new Z.Point(width, Math.round(height / 2)))
            ),
            //bottom center
            map.containerPointToCoordinate(
                containerPoint.add(new Z.Point(Math.round(width / 2), height))
            ),
            //middle left
            map.containerPointToCoordinate(
                containerPoint.add(new Z.Point(0, Math.round(height / 2)))
            )

        ];
        return anchors;
    }

});
