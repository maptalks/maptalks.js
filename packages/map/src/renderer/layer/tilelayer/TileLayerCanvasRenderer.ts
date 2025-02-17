/* eslint-disable @typescript-eslint/no-unused-vars */
import Canvas2D from '../../../core/Canvas';
import { default as TileLayer } from '../../../layer/tile/TileLayer';
import WMSTileLayer from '../../../layer/tile/WMSTileLayer';
import CanvasRenderer from '../CanvasRenderer';
import Point from '../../../geo/Point';
import TileLayerRenderable, { RenderContext, Tile } from './TileLayerRendererable';

const TILE_POINT = new Point(0, 0);
const TEMP_POINT = new Point(0, 0);

export default class TileLayerCanvasRenderer extends TileLayerRenderable(CanvasRenderer) {

    /**
     *
     * @param {TileLayer} layer - TileLayer to render
     */
    constructor(layer: TileLayer) {
        super(layer);
        this.init(layer);
    }

    _drawTiles(tiles, parentTiles, childTiles, placeholders, parentContext, missedTiles, incompleteTiles) {
        if (parentTiles.length) {
            //closer the latter (to draw on top)
            // parentTiles.sort((t1, t2) => Math.abs(t2.info.z - this._tileZoom) - Math.abs(t1.info.z - this._tileZoom));
            parentTiles.sort(this._compareTiles);
            this._parentTiles = parentTiles;
        }
        if (childTiles.length) {
            this._childTiles = childTiles;
            this._childTiles.sort(this._compareTiles);
        }

        let drawBackground = true;
        const backgroundTimestamp = this.canvas._parentTileTimestamp;
        if (this.layer.constructor === TileLayer || this.layer.constructor === WMSTileLayer) {
            // background tiles are only painted once for TileLayer and WMSTileLayer per frame.
            if (this._renderTimestamp === backgroundTimestamp) {
                drawBackground = false;
            } else {
                this.canvas._parentTileTimestamp = this._renderTimestamp;
            }
        }

        // todo 当为 gl 模式时实例应为 TileLayerGLRenderer
        const renderInGL = this.layer.options.renderer === 'gl' && (!(this as any).isGL || (this as any).isGL());

        const context = { tiles, parentTiles: this._parentTiles, childTiles: this._childTiles, parentContext };
        this.onDrawTileStart(context, parentContext);

        if (drawBackground && this.layer.options['opacity'] === 1) {
            this.layer._silentConfig = true;
            const fadingAnimation = this.layer.options['fadeAnimation'];
            this.layer.options['fadeAnimation'] = false;

            if (renderInGL) {
                this._drawChildTiles(childTiles, parentContext);
                this._drawParentTiles(this._parentTiles, parentContext);
            } else {
                this._drawParentTiles(this._parentTiles, parentContext);
                this._drawChildTiles(childTiles, parentContext);
            }

            this.layer.options['fadeAnimation'] = fadingAnimation;
            this.layer._silentConfig = false;
        }

        this.drawingCurrentTiles = true;
        tiles.sort(this._compareTiles);
        for (let i = 0, l = tiles.length; i < l; i++) {
            this._drawTileAndCache(tiles[i], parentContext);
        }
        delete this.drawingCurrentTiles;

        if (drawBackground && this.layer.options['opacity'] < 1) {
            this.layer._silentConfig = true;
            const fadingAnimation = this.layer.options['fadeAnimation'];
            this.layer.options['fadeAnimation'] = false;

            if (renderInGL) {
                this._drawChildTiles(childTiles, parentContext);
                this._drawParentTiles(this._parentTiles, parentContext);
            } else {
                this._drawParentTiles(this._parentTiles, parentContext);
                this._drawChildTiles(childTiles, parentContext);
            }

            this.layer.options['fadeAnimation'] = fadingAnimation;
            this.layer._silentConfig = false;
        }

        placeholders.forEach(t => this._drawTile(t.info, t.image, parentContext));

        this.onDrawTileEnd(context, parentContext);

    }

    needToRedraw(): boolean {
        const map = this.getMap();
        if (this.checkIfNeedRedraw()) {
            return true;
        }
        if (map.getPitch()) {
            return super.needToRedraw();
        }
        if (map.isRotating() || map.isZooming()) {
            return true;
        }
        if (map.isMoving()) {
            return !!this.layer.options['forceRenderOnMoving'];
        }
        return super.needToRedraw();
    }

    isDrawable(): boolean {
        if (this.getMap().getPitch()) {
            if (console) {
                console.warn('TileLayer with canvas renderer can\'t be pitched, use gl renderer (\'renderer\' : \'gl\') instead.');
            }
            this.clear();
            return false;
        }
        return true;
    }

    clipCanvas(context): boolean {
        // const mask = this.layer.getMask();
        // if (!mask) {
        //     return this._clipByPitch(context);
        // }
        return super.clipCanvas(context);
    }

    clear() {
        this.clearTileCaches();
        super.clear();
    }

    onRemove() {
        this.clear();
        this.removeTileCaches();
        super.onRemove();
    }


    // clip canvas to avoid rough edge of tiles
    //@internal
    // _clipByPitch(ctx: CanvasRenderingContext2D): boolean {
    //     const map = this.getMap();
    //     if (map.getPitch() <= map.options['maxVisualPitch']) {
    //         return false;
    //     }
    //     if (!this.layer.options['clipByPitch']) {
    //         return false;
    //     }
    //     const clipExtent = map.getContainerExtent();
    //     const r = map.getDevicePixelRatio();
    //     ctx.save();
    //     ctx.strokeStyle = 'rgba(0, 0, 0, 0)';
    //     ctx.beginPath();
    //     ctx.rect(0, Math.ceil(clipExtent.ymin) * r, Math.ceil(clipExtent.getWidth()) * r, Math.ceil(clipExtent.getHeight()) * r);
    //     ctx.stroke();
    //     ctx.clip();
    //     return true;
    // }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    drawTile(tileInfo: Tile['info'], tileImage: Tile['image'], parentContext?: RenderContext) {
        if (!tileImage || !this.getMap()) {
            return;
        }
        const { extent2d, offset } = tileInfo;
        const point = TILE_POINT.set(extent2d.xmin - offset[0], extent2d.ymax - offset[1]),
            tileZoom = tileInfo.z,
            tileId = tileInfo.id;
        const map = this.getMap(),
            zoom = map.getZoom(),
            ctx = this.context,
            cp = map._pointAtResToContainerPoint(point, tileInfo.res, 0, TEMP_POINT),
            bearing = map.getBearing(),
            transformed = bearing || zoom !== tileZoom;
        const opacity = this.getTileOpacity(tileImage, tileInfo);
        const alpha = ctx.globalAlpha;
        if (opacity < 1) {
            ctx.globalAlpha = opacity;
        }
        if (!transformed) {
            cp._round();
        }
        let x = cp.x,
            y = cp.y;
        let w = tileInfo.extent2d.xmax - tileInfo.extent2d.xmin;
        let h = tileInfo.extent2d.ymax - tileInfo.extent2d.ymin;
        const layer = this.layer;
        const bufferPixel = (layer ? layer.options.bufferPixel : 0);
        if (transformed) {
            ctx.save();
            ctx.translate(x, y);
            if (bearing) {
                ctx.rotate(-bearing * Math.PI / 180);
            }
            w += bufferPixel;
            h += bufferPixel;
            const res = map._getResolution();
            if (res !== tileInfo.res) {
                const scale = tileInfo.res / res;
                ctx.scale(scale, scale);
            }
            x = y = 0;
        }
        Canvas2D.image(ctx, tileImage, x, y, w, h);
        if (this.layer.options['debug']) {
            const color = this.layer.options['debugOutline'];
            ctx.save();
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            // ctx.strokeWidth = 10;
            // ctx.lineWidth = 10
            ctx.font = '20px monospace';
            const point = new Point(x, y);
            Canvas2D.rectangle(ctx, point, { width: w, height: h }, 1, 0);
            Canvas2D.fillText(ctx, this.getDebugInfo(tileId), point._add(32, h - 14), color);
            Canvas2D.drawCross(ctx, x + w / 2, y + h / 2, 2, color);
            ctx.restore();
        }
        if (transformed) {
            ctx.restore();
        }
        if (ctx.globalAlpha !== alpha) {
            ctx.globalAlpha = alpha;
        }
        this.setCanvasUpdated();
    }

}

TileLayer.registerRenderer<typeof TileLayerCanvasRenderer>('canvas', TileLayerCanvasRenderer);
