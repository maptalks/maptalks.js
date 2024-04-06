import { isFunction, isNumber, isObject, isString } from '../core/util';
import { createEl, addDomEvent, removeDomEvent } from '../core/util/dom';
import Coordinate from '../geo/Coordinate';
import Point from '../geo/Point';
import Size from '../geo/Size';
import { Geometry, Marker, MultiPoint, LineString, MultiLineString } from '../geometry';
import type { Map } from '../map';
import { MapEventDataType } from '../map/Map.DomEvents';
import UIComponent, { UIComponentOptionsType } from './UIComponent';
const PROPERTY_PATTERN = /\{ *([\w_]+) *\}/g;

/**
 * @property {Object} options
 * @property {Boolean} [options.autoPan=true]  - set it to false if you don't want the map to do panning animation to fit the opened window.
 * @property {String} [options.autoCloseOn=null] - Auto close infowindow on map's events, e.g. "click contextmenu" will close infowindow with click or right click on map.
 * @property {String} [options.autoOpenOn='click']  - Auto open infowindow on owner's events, e.g. "click" will open infowindow with click or right click on window's owner.
 * @property {Number}  [options.width=auto]     - default width
 * @property {Number}  [options.minHeight=120] - minimun height
 * @property {Boolean} [options.custom=false]  - set it to true if you want a customized infowindow, customized html codes or a HTMLElement is set to content.
 * @property {String}  [options.title=null]    - title of the infowindow.
 * @property {String|HTMLElement}  options.content - content of the infowindow.
 * @property {Boolean}  [options.enableTemplate=false]  - whether open template . such as content:`homepage:{url},company name:{name}`.
 * @memberOf ui.InfoWindow
 * @instance
 */
const options: InfoWindowOptionsType = {
    'containerClass': 'maptalks-msgBox',
    'autoPan': true,
    'autoCloseOn': null,
    'autoOpenOn': 'click',
    'width': 'auto',
    'minHeight': 120,
    'custom': false,
    'title': null,
    'content': null,
    'enableTemplate': false
};

const EMPTY_SIZE = new Size(0, 0);

/**
 * @classdesc
 * Class for info window, a popup on the map to display any useful infomation you wanted.
 * @category ui
 * @extends ui.UIComponent
 * @param {Object} options - options defined in [InfoWindow]{@link InfoWindow#options}
 * @memberOf ui
 */
class InfoWindow extends UIComponent {

    options: InfoWindowOptionsType;
    _onCloseBtnClick: () => void;

    // TODO: obtain class in super
    _getClassName() {
        return 'InfoWindow';
    }

    /**
     * Adds the UI Component to a geometry or a map
     * @param {Geometry|Map} owner - geometry or map to addto.
     * @returns {UIComponent} this
     * @fires UIComponent#add
     */
    addTo(owner: Geometry | Map) {
        if (owner instanceof Geometry) {
            if (owner.getInfoWindow() && owner.getInfoWindow() !== this) {
                owner.removeInfoWindow();
            }
            owner._infoWindow = this;
        }
        return super.addTo(owner);
    }

    /**
     * Set the content of the infowindow.
     * @param {String|HTMLElement} content - content of the infowindow.
     * return {InfoWindow} this
     * @fires InfoWindow#contentchange
     */
    setContent(content: string | HTMLElement) {
        const old = this.options['content'];
        this.options['content'] = content;
        /**
         * contentchange event.
         *
         * @event InfoWindow#contentchange
         * @type {Object}
         * @property {String} type - contentchange
         * @property {InfoWindow} target - InfoWindow
         * @property {String|HTMLElement} old      - old content
         * @property {String|HTMLElement} new      - new content
         */
        this.fire('contentchange', {
            'old': old,
            'new': content
        });
        if (this.isVisible()) {
            this.show(this._coordinate);
        }
        return this;
    }

    /**
     * Get content of  the infowindow.
     * @return {String|HTMLElement} - content of the infowindow
     */
    getContent(): string | HTMLElement {
        return this.options['content'];
    }

    /**
     * Set the title of the infowindow.
     * @param {String|HTMLElement} title - title of the infowindow.
     * return {InfoWindow} this
     * @fires InfoWindow#titlechange
     */
    setTitle(title: string) {
        const old = title;
        this.options['title'] = title;
        /**
         * titlechange event.
         *
         * @event InfoWindow#titlechange
         * @type {Object}
         * @property {String} type - titlechange
         * @property {InfoWindow} target - InfoWindow
         * @property {String} old      - old content
         * @property {String} new      - new content
         */
        this.fire('contentchange', {
            'old': old,
            'new': title
        });
        if (this.isVisible()) {
            this.show(this._coordinate);
        }
        return this;
    }

    /**
     * Get title of  the infowindow.
     * @return {String|HTMLElement} - content of the infowindow
     */
    getTitle() {
        return this.options['title'];
    }

    buildOn(): HTMLElement {
        const isFunc = isFunction(this.options['content']);
        const isStr = isString(this.options['content']);
        if (this.options['custom']) {
            const oldDom = this.getDOM();
            let newDom;
            this._bindDomEvents(oldDom, 'off');
            if (isStr || isFunc) {
                const dom = createEl('div');
                if (isStr) {
                    dom.innerHTML = this.options['content'] as string;
                    this._replaceTemplate(dom);
                } else {
                    //dymatic render dom content
                    (this.options['content'] as any).bind(this)(dom);
                }
                newDom = dom;
            } else {
                this._replaceTemplate(this.options['content'] as HTMLElement);
                newDom = this.options['content'];
            }
            this._bindDomEvents(newDom, 'on');
            return newDom;
        }
        this._bindDomEvents(this.getDOM(), 'off');
        const dom = createEl('div');
        if (this.options['containerClass']) {
            dom.className = this.options['containerClass'];
        }
        const width = this._getWindowWidth();
        dom.style.width = isNumber(width) ? width + 'px' : 'auto';
        dom.style.bottom = '0px'; // fix #657
        let content = '<em class="maptalks-ico"></em>';
        if (this.options['title']) {
            content += '<h2>' + this.options['title'] + '</h2>';
        }
        content += '<a href="javascript:void(0);" class="maptalks-close">×</a><div class="maptalks-msgContent"></div>';
        dom.innerHTML = content;
        //reslove title
        this._replaceTemplate(dom);
        const msgContent = dom.querySelector('.maptalks-msgContent');
        if (isStr || isFunc) {
            if (isStr) {
                msgContent.innerHTML = this.options['content'] as string;
            } else {
                //dymatic render dom content
                (this.options['content'] as any).bind(this)(msgContent);
            }
        } else {
            msgContent.appendChild(this.options['content'] as HTMLElement);
        }
        this._onCloseBtnClick = this.hide.bind(this);
        const closeBtn = dom.querySelector('.maptalks-close');
        addDomEvent(closeBtn as HTMLElement, 'click touchend', this._onCloseBtnClick);
        //reslove content
        if (!isFunc) {
            this._replaceTemplate(msgContent);
        }
        this._bindDomEvents(dom, 'on');
        return dom;
    }

    _replaceTemplate(dom: Element) {
        const geo = this._owner as Geometry;
        if (this.options['enableTemplate'] && geo && geo.getProperties && dom && dom.innerHTML) {
            const properties = geo.getProperties() || {};
            if (isObject(properties)) {
                const html = dom.innerHTML;
                dom.innerHTML = html.replace(PROPERTY_PATTERN, function (str, key) {
                    return properties[key];
                });
            }
        }
        return this;
    }

    /**
     * Gets InfoWindow's transform origin for animation transform
     * @protected
     * @return {Point} transform origin
     */
    getTransformOrigin() {
        const size = this.getSize();
        return size.width / 2 + 'px bottom';
    }

    getOffset() {
        const size = this.getSize();
        const o = new Point(-size['width'] / 2, 0);
        if (!this.options['custom']) {
            o._sub(4, 12);
        } else {
            o._sub(0, size['height']);
        }
        const owner = this.getOwner();
        if (owner instanceof Marker || owner instanceof MultiPoint) {
            let painter, markerSize;
            if (owner instanceof Marker) {
                painter = owner._getPainter();
                markerSize = owner.getSize();
            } else {
                const children = owner.getGeometries();
                if (!children || !children.length) {
                    return o;
                }
                painter = children[0]._getPainter();
                markerSize = children[0].getSize();
            }
            if (!markerSize) {
                markerSize = EMPTY_SIZE;
            }
            if (painter) {
                const fixExtent = painter.getFixedExtent();
                o._add(fixExtent.xmax - markerSize.width / 2, fixExtent.ymin);
            } else {
                o._add(0, -markerSize.height);
            }
        }
        return o;
    }

    show(coordinate: Coordinate) {
        if (!this.getMap()) {
            return this;
        }
        if (!this.getMap().options['enableInfoWindow']) {
            return this;
        }
        return super.show(coordinate);
    }

    getEvents() {
        if (!this.options['autoCloseOn']) {
            return null;
        }
        const events = {};
        events[this.options['autoCloseOn']] = this.hide;
        return events;
    }

    getOwnerEvents() {
        const owner = this.getOwner();
        if (!this.options['autoOpenOn'] || !owner) {
            return null;
        }
        const events = {};
        events[this.options['autoOpenOn']] = this._onAutoOpen;
        return events;
    }

    onRemove() {
        this._onDomMouseout();
        this.onDomRemove();
    }

    onDomRemove() {
        if (this._onCloseBtnClick) {
            const dom = this.getDOM();
            const closeBtn = dom.childNodes[2];
            removeDomEvent(closeBtn as HTMLElement, 'click touchend', this._onCloseBtnClick);
            delete this._onCloseBtnClick;
        }
    }

    _onAutoOpen(e: MapEventDataType) {
        const owner = this.getOwner();
        setTimeout(() => {
            if (owner instanceof Marker || owner instanceof UIComponent) {
                this.show((owner as Marker).getCoordinates());
            } else if (owner instanceof MultiPoint) {
                this.show(owner.findClosest(e.coordinate));
            } else if ((owner instanceof LineString) || (owner instanceof MultiLineString)) {
                if (this.getMap().getScale() >= 8) {
                    e.coordinate = this._rectifyMouseCoordinte(owner, e.coordinate);
                }
                this.show(e.coordinate);
            } else {
                this.show(e.coordinate);
            }
        }, 1);
    }

    _rectifyMouseCoordinte(owner: Geometry | Map, mouseCoordinate: Coordinate): Coordinate {
        if (owner instanceof LineString) {
            return this._rectifyLineStringMouseCoordinate(owner, mouseCoordinate).coordinate;
        } else if (owner instanceof MultiLineString) {
            return owner.getGeometries().map(lineString => {
                return this._rectifyLineStringMouseCoordinate(lineString as LineString, mouseCoordinate);
            }).sort((a, b) => {
                return a.dis - b.dis;
            })[0].coordinate;
        }
        // others
        return mouseCoordinate;
    }

    _rectifyLineStringMouseCoordinate(lineString: LineString, mouseCoordinate:Coordinate) {
        const map = this.getMap();
        const coordinates = lineString.getCoordinates() || [];
        const glRes = map.getGLRes();
        //coordinates to containerpoints
        const pts = coordinates.map(coordinate => {
            const renderPoints = map.coordToPointAtRes(coordinate, glRes);
            const altitude = coordinate.z || 0;
            return map._pointAtResToContainerPoint(renderPoints, glRes, altitude);
        });
        const mousePt = map.coordToContainerPoint(mouseCoordinate);
        let minDis = Infinity, coordinateIndex = -1;
        // Find the point with the shortest distance
        for (let i = 0, len = pts.length; i < len; i++) {
            const pt = pts[i];
            const dis = mousePt.distanceTo(pt);
            if (dis < minDis) {
                minDis = dis;
                coordinateIndex = i;
            }
        }
        const indexs = [coordinateIndex - 1, coordinateIndex, coordinateIndex + 1].filter(index => {
            return index >= 0 && index <= pts.length - 1;
        });

        const filterPts = indexs.map(index => {
            return pts[index];
        });
        const xys = [];
        const { width, height } = map.getSize();
        //Calculate all pixels in the field of view
        for (let i = 0, len = filterPts.length - 1; i < len; i++) {
            const coordinateIndex = i;
            const pt1 = filterPts[i], pt2 = filterPts[i + 1];
            // Vertical line
            if (pt1.x === pt2.x) {
                const miny = Math.max(0, Math.min(pt1.y, pt2.y));
                const maxy = Math.min(height, Math.max(pt1.y, pt2.y));
                for (let y = miny; y <= maxy; y++) {
                    xys.push({
                        point: new Point(pt1.x, y),
                        coordinateIndex
                    });
                }
            } else {
                const k = (pt2.y - pt1.y) / (pt2.x - pt1.x);
                // y-y0=k(x-x0)
                // y-pt1.y=k(x-pt1.x)
                const minx = Math.max(0, Math.min(pt1.x, pt2.x));
                const maxx = Math.min(width, Math.max(pt1.x, pt2.x));
                for (let x = minx; x <= maxx; x++) {
                    const y = k * (x - pt1.x) + pt1.y;
                    xys.push({
                        point: new Point(x, y),
                        coordinateIndex
                    });
                }
            }
        }
        let minPtDis = Infinity, ptIndex = -1, index = -1, containerPoint;
        // Find the point with the shortest distance
        for (let i = 0, len = xys.length; i < len; i++) {
            const { point, coordinateIndex } = xys[i];
            const dis = mousePt.distanceTo(point);
            if (dis < minPtDis) {
                minPtDis = dis;
                ptIndex = i;
                index = coordinateIndex;
                containerPoint = point;
            }
        }
        if (ptIndex < 0) {
            return {
                dis: minPtDis,
                coordinate: mouseCoordinate
            };
        }
        // const coordinate = map.containerPointToCoord(containerPoint);
        const p1 = filterPts[index], p2 = filterPts[index + 1];
        const distance = p1.distanceTo(p2);
        const d = containerPoint.distanceTo(p1);
        const percent = d / distance;

        const filterCoordinates = indexs.map(index => {
            return coordinates[index];
        });
        const c1 = filterCoordinates[index], c2 = filterCoordinates[index + 1];
        const x1 = c1.x, y1 = c1.y, z1 = c1.z || 0;
        const x2 = c2.x, y2 = c2.y, z2 = c2.z || 0;
        const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1;
        const x = x1 + dx * percent, y = y1 + dy * percent, z = z1 + dz * percent;
        return {
            dis: minPtDis,
            coordinate: new Coordinate(x, y, z)
        };
    }

    _getWindowWidth() {
        const defaultWidth = options.width;
        let width = this.options['width'];
        if (!width) {
            width = defaultWidth;
        }
        return width;
    }

}

InfoWindow.mergeOptions(options);

export default InfoWindow;

export type InfoWindowOptionsType = {
    containerClass?: string;
    autoPan?: boolean;
    autoCloseOn?: string;
    autoOpenOn?: string;
    width?: string;
    minHeight?: number;
    custom?: boolean;
    title?: string;
    content?: string | HTMLElement;
    enableTemplate?: boolean;

} & UIComponentOptionsType;
