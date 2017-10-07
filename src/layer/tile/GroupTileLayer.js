import { pushIn } from 'core/util';
import Layer from '../Layer';
import TileLayer from './TileLayer';

/**
 * @classdesc
 * A layer used to display a group of tile layers
 * @category layer
 * @extends Layer
 * @param {String|Number} id - tile layer's id
 * @param {Object} [options=null] - options defined in [TileLayer]{@link TileLayer#options}
 * @example
 * new GroupTileLayer("group-tiles",{
 *      tiles : [
 *          {
 *              urlTemplate : 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
 *              subdomains:['a','b','c']
 *          },
 *          {
 *              urlTemplate : 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
 *              subdomains:['a','b','c']
 *          }
 *      ]

    })
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
     * Export the tile layer's profile json. <br>
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
        layers.forEach(layer => {
            const childGrid = layer.getTiles(z);
            if (!childGrid || childGrid.tiles.length === 0) {
                return;
            }
            pushIn(tiles, childGrid.tiles);
            grid = childGrid;
        });
        if (!grid) {
            return null;
        }
        grid.tiles = tiles;
        return grid;
    }

    onAdd() {
        const map = this.getMap();
        this.layers.forEach(layer => layer._bindMap(map));
    }

    onRemove() {
        this.layers.forEach(layer => layer._doRemove());
    }

}

GroupTileLayer.registerJSONType('GroupTileLayer');

export default GroupTileLayer;
