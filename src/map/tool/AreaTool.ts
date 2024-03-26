import Size from '../../geo/Size';
import { Geometry, Marker, Label } from '../../geometry';
import DistanceTool from './DistanceTool';
import Translator from '../../lang/translator';


export type AreaToolOptions = {
    language?: string,
    metric?: boolean,
    imperial?: boolean,
    symbol?: any,
    vertexSymbol?: any,
    labelOptions?: any,
    mode?: string
}

/**
 * options 配置项说明
 * 
 * @english
 * @property options
 * @property options.language         - language of the distance tool, zh-CN or en-US
 * @property options.metric           - display result in metric system
 * @property options.imperial         - display result in imperial system.
 * @property options.symbol          - symbol of the line
 * @property options.vertexSymbol    - symbol of the vertice
 * @property options.labelOptions    - construct options of the vertice labels.
 * @memberOf AreaTool
 * @instance
 */

const options: AreaToolOptions = {
    'mode': 'Polygon',
    'symbol': {
        'lineColor': '#000000',
        'lineWidth': 2,
        'lineOpacity': 1,
        'lineDasharray': '',
        'polygonFill': '#ffffff',
        'polygonOpacity': 0.5
    },
    'language': 'zh-CN'
};

/**
 * 一个继承于DistanceTool类，测量面积的地图工具类。
 * 
 * @english
 * A map tool to help measure area on the map .it is extends DistanceTool
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
class AreaTool extends DistanceTool {    
    /**
     * 配置项
     * 
     * @english
     * @param options option              - construct options
     * @param options.language=zh-CN      - language of the distance tool, zh-CN or en-US
     * @param options.metric=true         - display result in metric system
     * @param options.imperial=false      - display result in imperial system.
     * @param options.symbol=null         - symbol of the line
     * @param options.vertexSymbol=null   - symbol of the vertice
     * @param options.labelOptions=null   - construct options of the vertice labels.
     */
    constructor(options:AreaToolOptions) {
        super(options);
        // this.on('enable', this._afterEnable, this)
        //     .on('disable', this._afterDisable, this);
        this.translator = new Translator(this.options['language']);
        this._measureLayers = [];
    }

    _measure(toMeasure:Geometry|Array<any>) {
        const map:any = this.getMap();
        let area:number;
        if (toMeasure instanceof Geometry) {
            area = map.computeGeometryArea(toMeasure);
        } else if (Array.isArray(toMeasure)) {
            area = map.getProjection().measureArea(toMeasure);
        }
        this._lastMeasure = area;

        const result = this._formatLabelContent(area);
        if (result) {
            return result;
        }
        const units = [
            this.translator.translate('areatool.units.meter'),
            this.translator.translate('areatool.units.kilometer'),
            this.translator.translate('areatool.units.feet'),
            this.translator.translate('areatool.units.mile')];

        let content:string = '';
        const decimals = this.options['decimalPlaces'];
        if (this.options['metric']) {
            content += area < 1E6 ? area.toFixed(decimals) + units[0] : (area / 1E6).toFixed(decimals) + units[1];
        }
        if (this.options['imperial']) {
            area *= Math.pow(3.2808399, 2);
            if (content.length > 0) {
                content += '\n';
            }
            const sqmi = 5280 * 5280;
            content += area < sqmi ? area.toFixed(decimals) + units[2] : (area / sqmi).toFixed(decimals) + units[3];
        }
        return content;
    }

    _msGetCoordsToMeasure(param:any) {
        return param['geometry'].getShell().concat([param['coordinate']]);
    }

    _msOnDrawVertex(param:any) {
        // const prjCoord = this.getMap()._pointToPrj(param['point2d']);
        const lastCoordinate = this._getLasttCoordinate() || param.coordinate;
        const vertexMarker = new Marker(lastCoordinate.copy(), {
            'symbol': this.options['vertexSymbol']
        });
        // vertexMarker._setPrjCoordinates(prjCoord);
        this._measure(param['geometry']);
        this._lastVertex = vertexMarker;
        this._addVertexMarker(vertexMarker);
    }

    _msOnDrawEnd(param:any) {
        this._clearTailMarker();
        let prjCoord;
        const map:any = this.getMap()
        if (param['point2d']) {
            prjCoord = map._pointToPrj(param['point2d']);
        } else {
            let prjCoords = param['geometry']._getPrjCoordinates() || [];
            prjCoords = prjCoords.slice(0, prjCoords.length - 1);
            // param['geometry']._setPrjCoordinates(prjCoords);
            prjCoord = prjCoords[prjCoords.length - 1];
        }
        if (param['geometry'].getShell().length < 3) {
            this._lastMeasure = 0;
            this._clearMeasureLayers();
            return;
        }

        const ms = this._measure(param['geometry']);
        // const projection = this.getMap().getProjection();
        // const coord = projection.unproject(prjCoord);
        const lastCoordinate = this._getLasttCoordinate();
        const endLabel = new Label(ms, lastCoordinate.copy(), this.options['labelOptions'])
            .addTo(this._measureMarkerLayer);
        // endLabel._setPrjCoordinates(prjCoord);
        let size = endLabel.getSize();
        if (!size) {
            size = new Size(10, 10);
        }
        this._addClearMarker(lastCoordinate.copy(), prjCoord, size['width']);
        const geo = param['geometry'].copy();
        geo.setCoordinates(param.geometry.getCoordinates());
        // geo._setPrjCoordinates(param['geometry']._getPrjCoordinates());
        geo.addTo(this._measureLineLayer);
        this._lastMeasure = geo.getArea();
    }
}

AreaTool.mergeOptions(options);

export default AreaTool;
