import Point from '../geo/Point';
import UIComponent from './UIComponent';
/**
 * @classdesc
 * Class for info window, a popup on the map to display any useful infomation you wanted.
 * @category ui
 * @extends ui.UIComponent
 * @param {Object} options - options defined in [InfoWindow]{@link InfoWindow#options}
 * @memberOf ui
 */
declare class InfoWindow extends UIComponent {
    _onCloseBtnClick: Function;
    _getClassName(): string;
    /**
     * Adds the UI Component to a geometry or a map
     * @param {Geometry|Map} owner - geometry or map to addto.
     * @returns {UIComponent} this
     * @fires UIComponent#add
     */
    addTo(owner: any): this;
    /**
     * Set the content of the infowindow.
     * @param {String|HTMLElement} content - content of the infowindow.
     * return {InfoWindow} this
     * @fires InfoWindow#contentchange
     */
    setContent(content: any): this;
    /**
     * Get content of  the infowindow.
     * @return {String|HTMLElement} - content of the infowindow
     */
    getContent(): any;
    /**
     * Set the title of the infowindow.
     * @param {String|HTMLElement} title - title of the infowindow.
     * return {InfoWindow} this
     * @fires InfoWindow#titlechange
     */
    setTitle(title: any): this;
    /**
     * Get title of  the infowindow.
     * @return {String|HTMLElement} - content of the infowindow
     */
    getTitle(): any;
    buildOn(): any;
    _replaceTemplate(dom: any): this;
    /**
     * Gets InfoWindow's transform origin for animation transform
     * @protected
     * @return {Point} transform origin
     */
    getTransformOrigin(): string;
    getOffset(): Point;
    show(coordinate: any): this;
    getEvents(): {};
    getOwnerEvents(): {};
    onRemove(): void;
    onDomRemove(): void;
    _onAutoOpen(e: any): void;
    _rectifyMouseCoordinte(owner: any, mouseCoordinate: any): any;
    _rectifyLineStringMouseCoordinate(lineString: any, mouseCoordinate: any): {
        dis: number;
        coordinate: any;
    };
    _getWindowWidth(): any;
    _bindDomEvents(dom: any, to: any): void;
    _getDomEvents(): {
        mouseover: (domEvent: any) => void;
        mouseout: (domEvent: any) => void;
    };
    _onDomMouseover(domEvent: any): void;
    _onDomMouseout(domEvent: any): void;
}
export default InfoWindow;
