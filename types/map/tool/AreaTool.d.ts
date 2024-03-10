import DistanceTool from './DistanceTool';
/**
 * A map tool to help measure area on the map
 * @category maptool
 * @extends DistanceTool
 * @example
 * var areaTool = new AreaTool({
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
 */
declare class AreaTool extends DistanceTool {
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
    _measure(toMeasure: any): string;
    _msGetCoordsToMeasure(param: any): any;
    _msOnDrawVertex(param: any): void;
    _msOnDrawEnd(param: any): void;
}
export default AreaTool;
