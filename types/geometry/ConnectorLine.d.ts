import LineString, { LineStringOptionsType } from './LineString';
import Geometry from './Geometry';
import ArcCurve, { ArcCurveOptionsType } from './ArcCurve';
declare const ConnectorLine_base: {
    new (...args: any[]): {
        _connSource: Geometry;
        _connTarget: Geometry;
        /**
         * Gets the source of the connector line.
         * @return {Geometry|control.Control|UIComponent}
         * @function Connectable.getConnectSource
         */
        getConnectSource(): Geometry;
        /**
         * Sets the source to the connector line.
         * @param {Geometry|control.Control|UIComponent} src
         * @return {ConnectorLine} this
         * @function Connectable.setConnectSource
         */
        setConnectSource(src: Geometry): any;
        /**
         * Gets the target of the connector line.
         * @return {Geometry|control.Control|UIComponent}
         * @function Connectable.getConnectTarget
         */
        getConnectTarget(): Geometry;
        /**
         * Sets the target to the connector line.
         * @param {Geometry|control.Control|UIComponent} target
         * @return {ConnectorLine} this
         * @function Connectable.setConnectTarget
         */
        setConnectTarget(target: Geometry): any;
        _updateCoordinates(): void;
        onAdd(): void;
        onRemove(): void;
        _showConnect(): void;
        _registerEvents(): void;
    };
    _hasConnectors(geometry: any): boolean;
    _getConnectors(geometry: any): any;
} & typeof LineString;
/**
 * A straight connector line geometry can connect geometries or ui components with each other. <br>
 *
 * @category geometry
 * @extends LineString
 * @example
 * var src = new Marker([0,0]).addTo(layer),
 *     dst = new Marker([1,0]).addTo(layer),
 *     line = new ConnectorLine(src, dst, {
 *         showOn : 'always', //'moving', 'click', 'mouseover', 'always'
 *         arrowStyle : 'classic',
 *         arrowPlacement : 'vertex-last', //vertex-first, vertex-last, vertex-firstlast, point
 *         symbol: {
 *           lineColor: '#34495e',
 *           lineWidth: 2
 *        }
 *     }).addTo(layer);
 * @mixes connectorLineMixin
 */
declare class ConnectorLine extends ConnectorLine_base {
    _connSource: Geometry;
    _connTarget: Geometry;
    /**
     * @param {Geometry|control.Control|UIComponent} src     - source to connect
     * @param {Geometry|control.Control|UIComponent} target  - target to connect
     * @param {Object} [options=null]  - construct options defined in [ConnectorLine]{@link ConnectorLine#options}
     */
    constructor(src: Geometry, target: Geometry, options: LineStringOptionsType);
}
declare const ArcConnectorLine_base: {
    new (...args: any[]): {
        _connSource: Geometry;
        _connTarget: Geometry;
        /**
         * Gets the source of the connector line.
         * @return {Geometry|control.Control|UIComponent}
         * @function Connectable.getConnectSource
         */
        getConnectSource(): Geometry;
        /**
         * Sets the source to the connector line.
         * @param {Geometry|control.Control|UIComponent} src
         * @return {ConnectorLine} this
         * @function Connectable.setConnectSource
         */
        setConnectSource(src: Geometry): any;
        /**
         * Gets the target of the connector line.
         * @return {Geometry|control.Control|UIComponent}
         * @function Connectable.getConnectTarget
         */
        getConnectTarget(): Geometry;
        /**
         * Sets the target to the connector line.
         * @param {Geometry|control.Control|UIComponent} target
         * @return {ConnectorLine} this
         * @function Connectable.setConnectTarget
         */
        setConnectTarget(target: Geometry): any;
        _updateCoordinates(): void;
        onAdd(): void;
        onRemove(): void;
        _showConnect(): void;
        _registerEvents(): void;
    };
    _hasConnectors(geometry: any): boolean;
    _getConnectors(geometry: any): any;
} & typeof ArcCurve;
/**
 * An arc curve connector line geometry can connect geometries or ui components with each other. <br>
 *
 * @category geometry
 * @extends ArcCurve
 * @example
 * var src = new Marker([0,0]).addTo(layer),
 *     dst = new Marker([1,0]).addTo(layer),
 *     line = new ArcConnectorLine(src, dst, {
 *         arcDegree : 120,
 *         showOn : 'always', //'moving', 'click', 'mouseover', 'always'
 *         arrowStyle : 'classic',
 *         arrowPlacement : 'vertex-last', //vertex-first, vertex-last, vertex-firstlast, point
 *         symbol: {
 *           lineColor: '#34495e',
 *           lineWidth: 2
 *        }
 *     }).addTo(layer);
 * @mixes connectorLineMixin
 */
declare class ArcConnectorLine extends ArcConnectorLine_base {
    _connSource: Geometry;
    _connTarget: Geometry;
    /**
     * @param {Geometry|control.Control|UIComponent} src     - source to connect
     * @param {Geometry|control.Control|UIComponent} target  - target to connect
     * @param {Object} [options=null]  - construct options defined in [ConnectorLine]{@link ConnectorLine#options}
     */
    constructor(src: Geometry, target: Geometry, options: ArcCurveOptionsType);
}
export { ConnectorLine, ArcConnectorLine };
