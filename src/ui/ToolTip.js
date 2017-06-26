import { createEl } from 'core/util/dom';
import { isString } from 'core/util';
import { Geometry } from 'geometry';
import UIComponent from './UI';


/**
 * @property {Object} options
 * @property {Number}  [options.width=150]     - default width
 * @property {Number}  [options.height=30]     - default height
 * @property {String}  [options.animation='fade']     - default fade, scale | fade,scale are an alternative to set
 * @property {String}  [options.cssName=null]    - content's css class name, default null
 * @memberOf ui.ToolTip
 * @instance
 */
const options = {
    'width': 150,
    'height': 30,
    'animation': 'fade',
    'cssName': null
};
/**
 * @classdesc
 * Class for tooltip, a tooltip used for showing some useful infomation attached to geometries on the map.
 * @category ui
 * @extends ui.UIComponent
 * @param {Object} options - options defined in [ToolTip]{@link tooltip#options}
 * @member of ui
 */
class ToolTip extends UIComponent {
    // TODO:obtain class in super
    _getClassName() {
        return 'ToolTip';
    }
    constructor(info, options = {}) {
        super(options);
        if (options.cssName) {
            this.setStyle(options.cssName);
        }
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
            owner.on('mouseover', this.onMouseOver, this);
            owner.on('mouseout', this.onMouseOut, this);
            return super.addTo(owner);
        } else {
            throw new Error('Invalid Geometry when add a tooltip.');
        }
    }

    /*
    * set ToolTip's content's css class name.
    * @param {String} css class name - set for ToolTip's content.
    */
    setStyle(cssName) {
        this._cssName = cssName;
    }

    /**
   * get ToolTip's  content's css class name
   * @returns {String} css class name - set for ToolTip's content.
   */
    getStyle() {
        return this._cssName;
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
        dom.style.height = options.height + 'px';
        dom.style.width = options.width + 'px';
        let cssName = '';
        if (!this._cssName) {
            //default css class name is 'maptalks-msgContent',and the container's css class name is 'maptalks-msgBox'
            cssName = 'maptalks-msgContent';
            dom.className = 'maptalks-msgBox';
        } else {
            cssName = this._cssName;
        }
        const content = `<div class="${cssName}">${this._content}</div>`;
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
        if (this.isVisible()) {
            this.hide();
        }
    }

    /**
    * remove the tooltip, this method will be called by 'this.remove()'
    */
    onRemove() {
        if (this._owner) {
            this._owner.off('mouseover', this.onMouseOver, this);
            this._owner.off('mouseout', this.onMouseOut, this);
        }
    }
}

ToolTip.mergeOptions(options);

export default ToolTip;
