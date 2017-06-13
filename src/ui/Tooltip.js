import { createEl } from 'core/util/dom';
import { isString } from 'core/util';
import { Geometry } from 'geometry';
import UIComponent from './UI';


/**
 * @property {Object} options
 * @property {Number}  [options.width=300]     - default width
 * @property {String}  [options.animation=300]     - default fade, scale | fade,scale are an alternative to set
 * @memberOf ui.ToolTip
 * @instance
 */
const options = {
    'width': 150,
    'animation': 'fade'
};
/**
 * @classdesc
 * Class for tooltip, a tooltip used for showing some useful infomation attached to geometries on the map.
 * @category ui
 * @extends ui.UIComponent
 * @param {Object} options - options defined in [ToolTip]{@link tooltip#options}
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
   * Adds the UI Component to a geometry
   * @param {Geometry} owner - geometry to add.
   * @returns {UIComponent} this
   * @fires UIComponent#add
   */
    addTo(owner) {
        if (owner instanceof Geometry) {
            owner._tooltip = this;
            owner.on('mouseover', this.onMouseOver.bind(this));
            owner.on('mouseout', this.onMouseOut.bind(this));
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
        const content = `<div class="maptalks-msgContent">${this._content}</div>`;
        dom.innerHTML = content;
        return dom;
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
   * remove the tooltip
   * @returns {UIComponent} this
   */
    remove() {
        this.onRemove = function () {
            if (this._owner) {
                this._owner.off('mouseover', this.onMouseOver);
                this._owner.off('mouseout', this.onMouseOut);
                delete this._owner._tooltip;
                delete this._owner;
            }
        };
        super.remove();
        return this;
    }
}

ToolTip.mergeOptions(options);

export default ToolTip;
