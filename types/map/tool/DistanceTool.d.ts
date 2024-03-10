import Marker from '../../geometry/Marker';
import Label from '../../geometry/Label';
import VectorLayer from '../../layer/VectorLayer';
import DrawTool from './DrawTool';
import { Layer } from './../../layer';
/**
 * A map tool to help measure distance on the map
 * @category maptool
 * @extends DrawTool
 * @example
 * var distanceTool = new DistanceTool({
 *     'once' : true,
 *     'symbol': {
 *       'lineColor' : '#34495e',
 *       'lineWidth' : 2
 *     },
 *     'vertexSymbol' : {
 *       'markerType'        : 'ellipse',
 *       'markerFill'        : '#1bbc9b',
 *       'markerLineColor'   : '#000',
 *       'markerLineWidth'   : 3,
 *       'markerWidth'       : 10,
 *      'markerHeight'      : 10
 *    },
 *    'language' : 'en-US'
 *  }).addTo(map);
 *
 */
declare class DistanceTool extends DrawTool {
    _measureLayers: Array<Layer>;
    _lastMeasure: any;
    _lastVertex: any;
    _measureMarkerLayer: VectorLayer;
    _measureLineLayer: Layer;
    _tailMarker: Marker;
    _tailLabel: Label;
    /**
     * @param {options} [options=null] - construct options
     * @param {String} [options.language=zh-CN]         - language of the distance tool, zh-CN or en-US
     * @param {Boolean} [options.metric=true]           - display result in metric system
     * @param {Boolean} [options.imperial=false]        - display result in imperial system.
     * @param {Object}  [options.symbol=null]           - symbol of the line
     * @param {Object}  [options.vertexSymbol=null]     - symbol of the vertice
     * @param {Object}  [options.labelOptions=null]     - construct options of the vertice labels.
     */
    constructor(options: any);
    /**
     * Clear the measurements
     * @return {DistanceTool} this
     */
    clear(): this;
    /**
     * Get the VectorLayers with the geometries drawn on the map during measuring.
     * @return {Layer[]}
     */
    getMeasureLayers(): Layer[];
    /**
     * Get last measuring result
     * @return {Number}
     */
    getLastMeasure(): any;
    undo(): this;
    redo(): this;
    _measure(toMeasure: any): string;
    _registerMeasureEvents(): void;
    _afterEnable(): void;
    _afterDisable(): void;
    _msOnDrawStart(param: any): void;
    _msOnMouseMove(param: any): void;
    _msGetCoordsToMeasure(param: any): any;
    _msOnDrawVertex(param: any): void;
    _addVertexMarker(marker: any, vertexLabel?: any): void;
    _msOnDrawEnd(param: any): void;
    _addClearMarker(coordinates: any, prjCoord: any, dx: any): void;
    _clearTailMarker(): void;
    _clearMeasureLayers(): void;
}
export default DistanceTool;
