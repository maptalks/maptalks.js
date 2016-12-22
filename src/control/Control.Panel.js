import { extend, bind, isNil, isString } from 'core/util';
import { createEl } from 'core/util/dom';
import Point from 'geo/Point';
import DragHandler from 'handler/Drag';
import Control from './Control';

/**
 * @classdesc
 * Class for panel controls.
 * @class
 * @category control
 * @extends Control
 * @memberOf control
 * @name Panel
 * @param {Object} [options=null] - options defined in [Panel]{@link Panel#options}
 * @example
 * var panel = new Panel({
 *     position : {'bottom': '0', 'right': '0'},
 *     draggable : true,
 *     custom : false,
 *     content : '<div class="map-panel">hello </div>',
 *     closeButton : true
 * }).addTo(map);
 */
export const Panel = Control.extend(/** @lends Panel.prototype */ {

    /**
     * @property {Object} options - options
     * @property {Object} [options.position='top-right']       - position of the control
     * @property {Boolean} [options.draggable=true]            - whether the panel can be dragged
     * @property {Boolean} [options.custom=false]              - whether the panel's content is customized .
     * @property {String|HTMLElement} options.content          - panel's content, can be a dom element or a string.
     * @property {Boolean} [options.closeButton=true]          - whether to display the close button on the panel.
     */
    options: {
        'position': 'top-right',
        'draggable': true,
        'custom': false,
        'content': '',
        'closeButton': true
    },

    buildOn: function () {
        var dom;
        if (this.options['custom']) {
            if (isString(this.options['content'])) {
                dom = createEl('div');
                dom.innerHTML = this.options['content'];
            } else {
                dom = this.options['content'];
            }
        } else {
            dom = createEl('div', 'maptalks-panel');
            if (this.options['closeButton']) {
                var closeButton = createEl('a', 'maptalks-close');
                closeButton.href = 'javascript:;';
                closeButton.onclick = function () {
                    dom.style.display = 'none';
                };
                dom.appendChild(closeButton);
            }

            var panelContent = createEl('div', 'maptalks-panel-content');
            panelContent.innerHTML = this.options['content'];
            dom.appendChild(panelContent);
        }

        this.draggable = new DragHandler(dom, {
            'cancelOn': bind(this._cancelOn, this)
        });

        this.draggable.on('dragstart', this._onDragStart, this)
            .on('dragging', this._onDragging, this)
            .on('dragend', this._onDragEnd, this);

        if (this.options['draggable']) {
            this.draggable.enable();
        }

        return dom;
    },

    /**
     * update control container
     * @return {Panel} this
     */
    update: function () {
        if (this.draggable) {
            this.draggable.disable();
            delete this.draggable;
        }
        return Control.prototype.update.call(this);
    },

    /**
     * Set the content of the Panel.
     * @param {String|HTMLElement} content - content of the infowindow.
     * return {Panel} this
     * @fires Panel#contentchange
     */
    setContent: function (content) {
        var old = this.options['content'];
        this.options['content'] = content;
        /**
         * contentchange event.
         *
         * @event Panel#contentchange
         * @type {Object}
         * @property {String} type - contentchange
         * @property {Panel} target - Panel
         * @property {String|HTMLElement} old      - old content
         * @property {String|HTMLElement} new      - new content
         */
        this.fire('contentchange', {
            'old': old,
            'new': content
        });
        if (this.isVisible()) {
            this.update();
        }
        return this;
    },

    /**
     * Get content of  the infowindow.
     * @return {String|HTMLElement} - content of the infowindow
     */
    getContent: function () {
        return this.options['content'];
    },

    _cancelOn: function (domEvent) {
        var target = domEvent.srcElement || domEvent.target,
            tagName = target.tagName.toLowerCase();
        if (tagName === 'button' ||
            tagName === 'input' ||
            tagName === 'select' ||
            tagName === 'option' ||
            tagName === 'textarea') {
            return true;
        }
        return false;
    },

    _onDragStart: function (param) {
        this._startPos = param['mousePos'];
        this._startPosition = extend({}, this.getPosition());
    },

    _onDragging: function (param) {
        var pos = param['mousePos'];
        var offset = pos.substract(this._startPos);

        var startPosition = this._startPosition;
        var position = this.getPosition();
        if (!isNil(position['top'])) {
            position['top'] = +startPosition['top'] + offset.y;
        }
        if (!isNil(position['bottom'])) {
            position['bottom'] = +startPosition['bottom'] - offset.y;
        }
        if (!isNil(position['left'])) {
            position['left'] = +startPosition['left'] + offset.x;
        }
        if (!isNil(position['right'])) {
            position['right'] = +startPosition['right'] - offset.x;
        }
        this.setPosition(position);
    },

    _onDragEnd: function () {
        delete this._startPos;
        delete this._startPosition;
    },

    /**
     * Get the connect points of panel for connector lines.
     * @private
     */
    _getConnectPoints: function () {
        var map = this._map;
        var containerPoint = this.getContainerPoint();
        var dom = this.getDOM(),
            width = dom.clientWidth,
            height = dom.clientHeight;

        var anchors = [
            //top center
            map.containerPointToCoordinate(
                containerPoint.add(new Point(Math.round(width / 2), 0))
            ),
            //middle right
            map.containerPointToCoordinate(
                containerPoint.add(new Point(width, Math.round(height / 2)))
            ),
            //bottom center
            map.containerPointToCoordinate(
                containerPoint.add(new Point(Math.round(width / 2), height))
            ),
            //middle left
            map.containerPointToCoordinate(
                containerPoint.add(new Point(0, Math.round(height / 2)))
            )

        ];
        return anchors;
    }

});
