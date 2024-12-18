import * as maptalks from 'maptalks';
import Measure3DTool from './Measure3DTool';

export default class Area3DTool extends Measure3DTool {

    _addHelperLayer() {
        super._addHelperLayer();
        this._helperLayer = new maptalks.VectorLayer(maptalks.INTERNAL_LAYER_PREFIX + '_area3dtool', { enableAltitude: true }).addTo(this._map);
        this._markerLayer = new maptalks.VectorLayer(maptalks.INTERNAL_LAYER_PREFIX + '_area3dtool_marker', { enableAltitude: true }).addTo(this._map);
    }

    _drawVertexMarker() {
        const coordinates = this._getPolygonCoordinates(this._drawCoordinates);
        this._helperGeometry.setCoordinates(coordinates);
        this._polygon.setCoordinates(coordinates);
        const markers = this._markerLayer.getGeometries();
        const geometryCount = this._helperLayer.getGeometries().length;
        for (let i = 0; i < markers.length; i++) {
            const id = markers[i].getId();
            if ( id !== 'label' + geometryCount && id.indexOf(`${geometryCount}_`) > -1) {
                markers[i].remove();
            }
        }
        for (let i = 0; i < this._drawCoordinates.length; i++) {
            new maptalks.Marker(this._drawCoordinates[i], {
                id: geometryCount + '_' + i,
                symbol: this.options['vertexSymbol']
            }).addTo(this._markerLayer);
        }
        this._drawLabel();
    }

    _getPolygonCoordinates(coordinates) {
        const polygonCoords = coordinates.map(coord => { return coord; });
        if (coordinates.length > 2) {
            polygonCoords.push(coordinates[0]);
        }
        return polygonCoords;
    }

    _drawLabel() {
        const distance = this.getMeasureResult();
        const language = this.options['language'] === 'zh-CN' ? 0 : 1;
        const unitContent = this._getUnitContent(distance);
        const content = (!language ? '面积: ' : 'area: ') + unitContent;
        const labelCoordinate = this._drawCoordinates[this._drawCoordinates.length - 1];
        const geometryCount = this._helperLayer.getGeometries().length;
        const options = maptalks.Util.extend({ id: 'label' + geometryCount }, this.options.labelSymbol);
        if (!this._label) {
            this._label = new maptalks.Label(content, labelCoordinate, options).addTo(this._markerLayer);
        } else {
            this._label.setContent(content);
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
            this._helperGeometry = new maptalks.LineString([coordinate], {
                symbol: this.options.symbol
            }).addTo(this._helperLayer);
            this._polygon =  new maptalks.Polygon([coordinate]);
        }
        this._drawVertexMarker();
        this._first = true;
    }

    getMeasureResult() {
        return this._polygon.getArea();
    }
}
