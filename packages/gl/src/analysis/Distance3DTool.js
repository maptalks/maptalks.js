import * as maptalks from 'maptalks';
import Measure3DTool from './Measure3DTool';

export default class Distance3DTool extends Measure3DTool {

    _addHelperLayer() {
        super._addHelperLayer();
        this._helperLayer = new maptalks.VectorLayer(maptalks.INTERNAL_LAYER_PREFIX + '_distance3dtool', { enableAltitude: true }).addTo(this._map);
        this._markerLayer = new maptalks.VectorLayer(maptalks.INTERNAL_LAYER_PREFIX + '_distance3dtool_marker', { enableAltitude: true }).addTo(this._map);
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
        for (let i = 0; i < this._drawCoordinates.length; i++) {
            new maptalks.Marker(this._drawCoordinates[i], {
                id: geometryCount + '_' + i,
                symbol: this.options['vertexSymbol'],
            }).addTo(this._markerLayer);
        }
        this._drawLabel();
    }

    _drawLabel() {
        const distance = this.getMeasureResult();
        const language = this.options['language'] === 'zh-CN' ? 0 : 1;
        const unitContent = this._getUnitContent(distance);
        const content = (!language ? '距离: ' : 'distance: ') + unitContent;
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

    _getUnitContent(length) {
        let units;
        if (this.options['language'] === 'zh-CN') {
            units = [' 米', ' 公里', ' 英尺', ' 英里'];
        } else {
            units = [' m', ' km', ' feet', ' mile'];
        }
        let content = '';
        if (this.options['metric']) {
            this._measure = length < 1000 ? length.toFixed(1) : (length / 1000).toFixed(2);
            this._units = length < 1000 ? units[0] : units[1];
        }
        if (this.options['imperial']) {
            length *= 3.2808399;
            if (content.length > 0) {
                content += '\n';
            }
            this._measure = length < 5280 ? length.toFixed(1) : (length / 5280).toFixed(2);
            this._units = length < 5280 ? units[2] : units[3];
        }
        content += this._measure + this._units;
        return content;
    }

    _addHelperGeometry(coordinate) {
        if (!this._helperGeometry) {
            this._helperGeometry = new maptalks.LineString([coordinate], {
                symbol: this.options.symbol
            }).addTo(this._helperLayer);
        }
        this._drawVertexMarker();
        this._first = true;
    }

    getMeasureResult() {
        return this._helperGeometry.getLength();
    }
}
