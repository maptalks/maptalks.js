import UIComponent from './UIComponent';
/**
 * @classdesc
 * Class for tooltip, a tooltip used for showing some useful infomation attached to geometries on the map.
 * @category ui
 * @extends ui.UIComponent
 * @memberOf ui
 */
declare class ToolTip extends UIComponent {
    _content: string | HTMLElement;
    _timeout: number;
    _getClassName(): string;
    /**
     * @param {String} content         - content of tooltip
     * @param {Object} [options=null]  - options defined in [ToolTip]{@link ToolTip#options}
     */
    constructor(content: any, options?: {});
    /**
     * Adds the UI Component to a geometry UIMarker Other graphic elements
     * @param {Geometry} owner - geometry to add.
     * @returns {UIComponent} this
     * @fires UIComponent#add
     */
    addTo(owner: any): this;
    /**
     * set ToolTip's content's css class name.
     * @param {String} css class name - set for ToolTip's content.
     */
    setStyle(cssName: any): this;
    /**
     * get ToolTip's  content's css class name
     * @returns {String} css class name - set for ToolTip's content.
     */
    getStyle(): any;
    /**
     * get the UI Component's content
     * @returns {String} tooltip's content
     */
    getContent(): string | HTMLElement;
    buildOn(): HTMLElement;
    onMouseOut(): void;
    onMouseMove(e: any): void;
    /**
     * remove the tooltip, this method will be called by 'this.remove()'
     */
    onRemove(): void;
    hideDom(): this;
    onEvent(): this;
    /**
     * override UIComponent method
     * ignore altitude calculation
     */
    _getViewPoint(): any;
}
export default ToolTip;
