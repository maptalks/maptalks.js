import { extend } from '../../core/util';
import Geometry from '../Geometry';
import ToolTip from '../../ui/ToolTip';

const OPTIONS = {
    showTimeout: 0
};

Geometry.include(/** @lends Geometry.prototype */ {
    /**
     * Set an ToolTip to the geometry
     * @param {String} content - content of tooltip
     * @param {Object} options - construct [options]{@link ui.ToolTip#options} for the ToolTip
     * @return {Geometry} this
     * @example
     * geometry.setToolTip('hello');
     */
    setToolTip(content, options) {
        this.removeToolTip();
        if (content instanceof ToolTip) {
            this._toolTip = content;
            this._toolTipOptions = extend({}, OPTIONS, this._toolTip.options);
            this._toolTip.addTo(this);
            return this;
        }
        this._toolTipOptions = extend({}, OPTIONS, options);
        if (this._toolTip) {
            this._toolTip.setOptions(options);
        } else if (this.getMap()) {
            this._bindToolTip(content, this._toolTipOptions);
        }

        return this;
    },

    /**
     * Get the ToolTip instance.
     * @return {ui.ToolTip}
     */
    getToolTip() {
        if (!this._toolTip) {
            return null;
        }
        return this._toolTip;
    },

    /**
     * Open the ToolTip, default on the center of the geometry.
     * @param  {Coordinate} [coordinate=null] - coordinate to open the ToolTip
     * @return {Geometry} this
     */
    openToolTip(coordinate) {
        if (!this.getMap()) {
            return this;
        }
        if (!coordinate) {
            coordinate = this.getCenter();
        }
        if (!this._toolTip) {
            if (this._toolTipOptions && this.getMap()) {
                this._bindToolTip(this._toolTipOptions);
                this._toolTip.show(coordinate);
            }
        } else {
            this._toolTip.show(coordinate);
        }
        return this;
    },

    /**
     * Close the ToolTip
     * @return {Geometry} this
     */
    closeToolTip() {
        if (this._toolTip) {
            this._toolTip.hide();
        }
        return this;
    },

    /**
     * Remove the ToolTip
     * @return {Geometry} this
     */
    removeToolTip() {
        this._unbindToolTip();
        delete this._toolTipOptions;
        delete this._toolTip;
        return this;
    },

    _bindToolTip(content, options) {
        this._toolTip = new ToolTip(content, options);
        this._toolTip.addTo(this);

        return this;
    },

    _unbindToolTip() {
        if (this._toolTip) {
            this.closeToolTip();
            this._toolTip.remove();
            delete this._toolTip;
        }
        return this;
    }
});
