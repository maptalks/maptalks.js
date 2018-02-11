import { pushIn } from '../../core/util';
import Layer from '../Layer';
import TileLayer from './TileLayer';

/**
 * @classdesc
 * A layer used to display a group of tile layers. <br>
 * Its performance is better than add TileLayers seperately and it can help prevent limits of active webgl contexts: <br>
 * "WARNING: Too many active WebGL contexts. Oldest context will be lost"
 * @category layer
 * @extends TileLayer
 * @param {String|Number} id - tile layer's id
 * @param {TileLayer[]} layers  - TileLayers to add
 * @param {Object} [options=null] - options defined in [TileLayer]{@link TileLayer#options}
 * @example
 * new GroupTileLayer("group-tiles",[
    new maptalks.WMSTileLayer('wms', {
      'urlTemplate' : 'https://demo.boundlessgeo.com/geoserver/ows',
      'crs' : 'EPSG:3857',
      'layers' : 'ne:ne',
      'styles' : '',
      'version' : '1.3.0',
      'format': 'image/png',
      'transparent' : true,
      'uppercase' : true
    }),
    new maptalks.TileLayer('tile2',{
      urlTemplate: 'http://korona.geog.uni-heidelberg.de/tiles/adminb/x={x}&y={y}&z={z}'
    })
  ])
 */
class GroupTileLayer extends TileLayer {
    /**
     * Reproduce a GroupTileLayer from layer's profile JSON.
     * @param  {Object} layerJSON - layer's profile JSON
     * @return {GroupTileLayer}
     * @static
     * @private
     * @function
     */
    static fromJSON(layerJSON) {
        if (!layerJSON || layerJSON['type'] !== 'GroupTileLayer') {
            return null;
        }
        const layers = layerJSON['layers'].map(json => Layer.fromJSON(json));
        return new GroupTileLayer(layerJSON['id'], layers, layerJSON['options']);
    }

    /**
     * @param {String|Number} id    - layer's id
     * @param {TileLayer[]} layers  - TileLayers to add
     * @param {Object}  [options=null]          - construct options
     * @param {*}  [options.*=null]             - options defined in [TileLayer]{@link TileLayer#options}
     */
    constructor(id, layers, options) {
        super(id, options);
        this.layers = layers || [];
    }

    /**
     * Get children TileLayer
     * @returns {TileLayer[]}
     */
    getLayers() {
        return this.layers;
    }

    /**
     * Export the GroupTileLayer's profile json. <br>
     * Layer's profile is a snapshot of the layer in JSON format. <br>
     * It can be used to reproduce the instance by [fromJSON]{@link Layer#fromJSON} method
     * @return {Object} layer's profile JSON
     */
    toJSON() {
        const profile = {
            'type': this.getJSONType(),
            'id': this.getId(),
            'layers' : this.layers.map(layer => layer.toJSON()),
            'options': this.config()
        };
        return profile;
    }

    /**
     * Get tiles at zoom (or current zoom)
     * @param {Number} z
     * @returns {Object} tiles
     */
    getTiles(z) {
        const layers = this.layers;
        const tiles = [];
        let grid;
        for (let i = 0, l = layers.length; i < l; i++) {
            const layer = layers[i];
            if (!layer.options['visible']) {
                continue;
            }
            const childGrid = layer.getTiles(z);
            if (!childGrid || childGrid.tiles.length === 0) {
                continue;
            }
            pushIn(tiles, childGrid.tiles);
            grid = childGrid;
        }
        if (!grid) {
            return null;
        }
        grid.tiles = tiles;
        return grid;
    }

    onAdd() {
        const map = this.getMap();
        this.layers.forEach(layer => {
            layer._bindMap(map);
            layer.on('show hide', this._onLayerShowHide, this);
        });
    }

    onRemove() {
        this.layers.forEach(layer => {
            layer._doRemove();
            layer.off('show hide', this._onLayerShowHide, this);
        });
    }

    _onLayerShowHide() {
        const renderer = this.getRenderer();
        if (renderer) {
            renderer.setToRedraw();
        }
    }

    isVisible() {
        if (!super.isVisible()) {
            return false;
        }
        const children = this.layers;
        for (let i = 0, l = children.length; i < l; i++) {
            if (children[i].isVisible()) {
                return true;
            }
        }
        return false;
    }
}

GroupTileLayer.registerJSONType('GroupTileLayer');

export default GroupTileLayer;
