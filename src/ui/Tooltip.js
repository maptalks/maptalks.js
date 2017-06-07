import { createEl } from 'core/util/dom';
import { isString } from 'core/util';
import { Geometry } from 'geometry';
import UIComponent from './UI';


/**
 * @property {Object} options
 * @property {Number}  [options.width=300]     - default width
 * @memberOf ui.Tooltip
 * @instance
 */
const options = {
    'width': 150
};
/**
 * @classdesc
 * Class for tooltip, a tooltip used for showing some useful infomation attached to geometries on the map.
 * @category ui
 * @extends ui.UIComponent
 * @param {Object} options - options defined in [tooltip]{@link tooltip#options}
 * @memberOf ui
 */
class ToolTip extends UIComponent {
    // TODO:obtain class in super
    _getClassName() {
        return 'ToolTip';
    }
    constructor(info) {
        super(options);
        if (isString(info)) {
            this._content = info;
        }
    }

    /**
   * Adds the UI Component to a geometry or a map
   * @param {Geometry} owner - geometry to addto.
   * @returns {UIComponent} this
   * @fires UIComponent#add
   */
    addTo(owner) {
        if (owner instanceof Geometry) {
            owner._tooltip = this;
            return super.addTo(owner);
        } else {
            throw new Error('Invalid Geometry when add a tooltip.');
        }
    }

    /**
    * get the UI Component's content
    * @returns {String} tooltip's content
    */
    getContent() {
        return this._content;
    }

    buildOn() {
        const dom = createEl('div');
        dom.className = 'maptalks-msgBox';
        dom.id = 'tipDiv';
        dom.style.width = options.width + 'px';
        const content = '<div class="maptalks-msgContent">${this. _content}</div>';
        dom.innerHTML = content;
        return dom;
    }

    getEvents() {
        return {
            'mouseover' : this.onMouseOver,
            'mouseout' : this.onMouseOut
        };
    }

    onMouseOver(e) {
        if (!this.isVisible()) {
            const map = e.target.getMap();
            const zoom = map.getZoom();
            const mousescreen = map.coordinateToPoint(e.coordinate, zoom);
            const tipPosition = new maptalks.Point(mousescreen.x + 25, mousescreen.y - 45);
            this.show(map.pointToCoordinate(tipPosition, zoom));
        }
    }

    onMouseOut() {
        this.hide();
    }
    /**
   * remove the tooltip effect
   * @returns {UIComponent} this
   */
    remove() {
        this.onRemove = function () {
            if (this._owner) {
                delete this._owner._tooltip;
                delete this._owner;
                //delete this._mouseHandler;
            }
        };
        super.remove();
        return this;
    }
}

ToolTip.mergeOptions(options);

export default ToolTip;
