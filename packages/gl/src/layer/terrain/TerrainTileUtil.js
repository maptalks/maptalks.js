import * as maptalks from 'maptalks';
import { createMartiniData } from './util/martini.js';

export function getCascadeTileIds(layer, x, y, z, center, offset, terrainTileScaleY, scale, levelLimit) {
    const result = {};
    for (let i = 0; i < levelLimit; i++) {
        result[i + ''] = getTileIdsAtLevel(layer, x, y, z, center, offset, terrainTileScaleY, scale, i);
    }
    return result;
}

const EMPTY_ARRAY = [];
/**
 * 通过 layerA 的x，y 编号，计算 layerB 在 zoom 级别上的所有瓦片id
 * @param {*} layerB
 * @param {*} ax layerA瓦片的x方向编号
 * @param {*} ay layerA瓦片的y方向编号
 * @param {*} bz layerB瓦片的zoom级别
 * @param {*} aNW layerA瓦片的northwest
 * @param {*} offset
 * @param {*} aScaleY layerA 的 tileSystem.scale.y
 * @param {*} scale layerA 和 layerB 编号的scale
 * @param {*} level
 * @returns
 */
export function getTileIdsAtLevel(layerB, ax, ay, bz, aNW, offset, aScaleY, scale, level) {
    bz -= level;
    if (bz <= 0) {
        return EMPTY_ARRAY;
    }
    // 这里假设 tile offset 还在tileSize范围内，而不是跨越或超过1整张瓦片的那种偏移方式
    const tileSize = layerB.getTileSize().width;
    const layerOffset = layerB['_getTileOffset'](bz, aNW);
    const tileOffsetX = offset[0] - layerOffset[0];
    const tileOffsetY = layerOffset[1] - offset[1];
    const tileConfig = layerB['_getTileConfig']();
    const sr = layerB.getSpatialReference();
    const tileRes = sr.getResolution(bz);
    const layerTileYScale = tileConfig.tileSystem.scale.y;

    const delta = 1E-7;
    scale = scale / Math.pow(2, level);
    let xStart = 0;
    let yStart = 0;
    let xEnd = scale;
    let yEnd = scale;
    if (tileOffsetX < 0) {
        xEnd += Math.ceil(-tileOffsetX / tileSize - delta);
    } else if (tileOffsetX > 0) {
        xStart -= Math.ceil(tileOffsetX / tileSize - delta);
    }
    if (tileOffsetY > 0) {
        yStart -= Math.ceil(tileOffsetY / tileSize - delta);
    } else if (tileOffsetY < 0) {
        yEnd += Math.ceil(-tileOffsetY / tileSize - delta);
    }
    if (xStart === 0 && yStart === 0 && xEnd <= 1 && yEnd <= 1) {
        const tx = Math.floor(ax * scale);
        let ty = Math.floor(ay * scale);
        const skinY = ty;
        if (layerTileYScale !== aScaleY) {
            ty = getReverseY(tileConfig, ty, tileRes);
        }
        return [
            {
                x: tx,
                y: ty,
                skinY,
                z: bz,
                offset: layerOffset,
                tileSize,
                id: layerB['_getTileId'](tx, ty, bz)
            }
        ];
    }
    const result = [];
    for (let i = xStart; i < xEnd; i++) {
        for (let j = yStart; j < yEnd; j++) {
            const tx = ax * scale + i;
            let ty = ay * scale + j;
            const skinY = ty;
            if (layerTileYScale !== aScaleY) {
                ty = getReverseY(tileConfig, ty, tileRes);
            }
            result.push({
                x: tx,
                y: ty,
                skinY,
                z: bz,
                offset: layerOffset,
                tileSize,
                id: layerB['_getTileId'](tx, ty, bz)
            });
        }
    }
    return result;
}

export function getParentSkinTile(layer, x, y, z, limit) {
    const tileCache = layer.getRenderer().tileCache;
    const tx = Math.floor(x / 2);
    const ty = Math.floor(y / 2);
    const tz = z - 1;
    const parentNodeId = layer['_getTileId'](tx, ty, tz);
    const cached = tileCache.get(parentNodeId);
    if (!cached && limit <= 0) {
        return getParentSkinTile(layer, tx, ty, tz, limit + 1);
    }
    return cached;
}

// 地形瓦片与skin瓦片编号的scale
export function getSkinTileScale(res, size, terrainRes, terrainSize) {
    let scale = res / terrainRes * terrainSize / size;
    if (scale < 1) {
        scale = 1 / scale;
        scale = 1 / Math.round(scale);
    } else {
        scale = Math.round(scale);
    }
    return scale;
}

export function getSkinTileRes(sr, z, terrainRes) {
    const resAtZ = sr.getResolution(z);
    const zoom = z - Math.log(terrainRes / resAtZ) * Math.LOG2E;
    const myRes = sr.getResolution(zoom);
    return { zoom, res: myRes };
}

const TILEPOINT = new maptalks.Point(0, 0);
export function inTerrainTile(tileInfo, x, y, res) {
    const point0 = TILEPOINT.set(x, y);
    const point1 = point0['_multi'](res / tileInfo.res);
    return tileInfo.extent2d.contains(point1);
}

// from Leaflet's GridLayer.js
function getReverseY(tileConfig, y, res) {
    const fullExtent = tileConfig.fullExtent;
    const tileSize = tileConfig.tileSize.width;
    const max = Math.max(fullExtent.top, fullExtent.bottom);
    const min = Math.min(fullExtent.top, fullExtent.bottom);
    const top = Math.ceil(max / tileSize / res) - 1;
    const bottom = Math.floor(min / tileSize / res);
    return (top - bottom) - y;
}

export function createEmtpyTerrainHeights(height, size) {
    const length = size * size;
    const data = height !== 0 ? new Float32Array(length) : new Uint8Array(length);
    data.fill(height);
    return {
        data,
        width: size,
        height: size,
        max: height,
        min: height
    };
}

const emptyHeights = createEmtpyTerrainHeights(0, 5);
export const EMPTY_TERRAIN_GEO =  createMartiniData(1, emptyHeights.data, emptyHeights.width, true);
EMPTY_TERRAIN_GEO.empty = true;
