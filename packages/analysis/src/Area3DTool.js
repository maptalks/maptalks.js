import * as maptalks from 'maptalks';
import Measure3DTool from './Measure3DTool';
import { PolygonLayer, PointLayer } from '@maptalks/vt';

export default class Area3DTool extends Measure3DTool {

    _addHelperLayer() {
        super._addHelperLayer();
        this._helperLayer = new PolygonLayer(maptalks.INTERNAL_LAYER_PREFIX + '_area3dtool', { geometryEvents: false }).addTo(this._gllayer);
        this._markerLayer = new PointLayer(maptalks.INTERNAL_LAYER_PREFIX + '_area3dtool_marker', { geometryEvents: false }).addTo(this._gllayer);
    }

    _drawVertexMarker() {
        this._helperGeometry.setCoordinates(this._drawCoordinates);
        const markers = this._markerLayer.getGeometries();
        const geometryCount = this._helperLayer.getGeometries().length;
        for (let i = 0; i < markers.length; i++) {
            const id = markers[i].getId();
            if ( id !== 'label' + geometryCount && id.indexOf(`${geometryCount}_`) > -1) {
                markers[i].remove();
            }
        }
        for (let i = 0; i < this._drawCoordinates.length - 1; i++) {
            new maptalks.Marker(this._drawCoordinates[i], {
                id: geometryCount + '_' + i,
                symbol: this.options['vertexSymbol']
            }).addTo(this._markerLayer);
        }
        this._drawLabel();
    }

    _drawLabel() {
        const distance = this.getMeasureResult();
        const language = this.options['language'] === 'zh-CN' ? 0 : 1;
        const unitContent = this._getUnitContent(distance);
        const content = (!language ? '面积: ' : 'area: ') + unitContent;
        const labelSymbol = maptalks.Util.extend({ textName: content }, this.options.labelSymbol);
        const labelCoordinate = this._drawCoordinates[this._drawCoordinates.length - 1];
        const geometryCount = this._helperLayer.getGeometries().length;
        if (!this._label) {
            this._label = new maptalks.Marker(labelCoordinate, {
                id: 'label' + geometryCount,
                symbol: [this.options['vertexSymbol'], labelSymbol]
            }).addTo(this._markerLayer);
        } else {
            this._label.setSymbol([this.options['vertexSymbol'], labelSymbol]);
            this._label.setCoordinates(labelCoordinate);
        }
    }

    _getUnitContent(area) {
        let units;
        if (this.options['language'] === 'zh-CN') {
            units = [' 平方米', ' 平方公里', ' 平方英尺', ' 平方英里'];
        } else {
            units = [' sq.m', ' sq.km', ' sq.ft', ' sq.mi'];
        }
        let content = '';
        if (this.options['metric']) {
            this._measure = area < 1E6 ? area.toFixed(2) :  (area / 1E6).toFixed(2);
            this._units = area < 1E6 ? units[0] : units[1];
        }
        if (this.options['imperial']) {
            area *= 3.2808399;
            if (content.length > 0) {
                content += '\n';
            }
            const sqmi = 5280 * 5280;
            this._measure = area < sqmi ? area.toFixed(2) :  (area / sqmi).toFixed(2);
            this._units =  area < sqmi ? units[2] : units[3];
        }
        content += this._measure + this._units;
        return content;
    }


    _addHelperGeometry(coordinate) {
        if (!this._helperGeometry) {
            this._helperGeometry = new maptalks.Polygon([coordinate], {
                symbol: this.options.symbol
            }).addTo(this._helperLayer);
        }
        this._drawVertexMarker();
        this._first = true;
    }

    getMeasureResult() {
        return this._helperGeometry.getArea();
    }
}
