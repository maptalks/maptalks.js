import * as maptalks from 'maptalks';

export function getCascadeTileIds(layer, x, y, z, offset, terrainTileScaleY, scale, levelLimit) {
    const result = {};
    for (let i = 0; i < levelLimit; i++) {
        result[i + ''] = getTileIdsAtLevel(layer, x, y, z, offset, terrainTileScaleY, scale, i);
    }
    return result;
}

const EMPTY_ARRAY = [];
export function getTileIdsAtLevel(layer, x, y, z, offset, terrainTileScaleY, scale, level) {
    z -= level;
    if (z <= 0) {
        return EMPTY_ARRAY;
    }
    // 这里假设 tile offset 还在tileSize范围内，而不是跨越或超过1整张瓦片的那种偏移方式
    const tileSize = layer.getTileSize().width;
    const layerOffset = layer['_getTileOffset'](z);
    const tileOffsetX = offset[0] - layerOffset[0];
    const tileOffsetY = layerOffset[1] - offset[1];
    const tileConfig = layer['_getTileConfig']();
    const sr = layer.getSpatialReference();
    const tileRes = sr.getResolution(z);
    const tileXScale = tileConfig.tileSystem.scale.x;
    const tileYScale = tileConfig.tileSystem.scale.y;

    const delta = 1E-7;
    scale = scale / Math.pow(2, level);
    let xStart = 0;
    let yStart = 0;
    let xEnd = scale;
    let yEnd = scale;
    if (tileOffsetX < 0) {
        xEnd += tileXScale * Math.ceil(-tileOffsetX / tileSize - delta);
    } else if (tileOffsetX > 0) {
        xStart -= tileXScale * Math.ceil(tileOffsetX / tileSize - delta);
    }
    if (tileOffsetY > 0) {
        yStart -= tileYScale * Math.ceil(tileOffsetY / tileSize - delta);
    } else if (tileOffsetY < 0) {
        yEnd += tileYScale * Math.ceil(-tileOffsetY / tileSize - delta);
    }
    if (xStart === 0 && yStart === 0 && xEnd <= 1 && yEnd <= 1) {
        const tx = Math.floor(x * scale);
        let ty = Math.floor(y * scale);
        const skinY = ty;
        if (tileYScale !== terrainTileScaleY) {
            ty = getReverseY(tileConfig, ty, tileRes);
        }
        return [
            {
                x: tx,
                y: ty,
                skinY,
                z,
                offset: layerOffset,
                tileSize,
                id: layer['_getTileId'](tx, ty, z)
            }
        ];
    }
    const result = [];
    for (let i = xStart; i < xEnd; i++) {
        for (let j = yStart; j < yEnd; j++) {
            const tx = x * scale + i;
            let ty = y * scale + j;
            const skinY = ty;
            if (tileYScale !== terrainTileScaleY) {
                ty = getReverseY(tileConfig, ty, tileRes);
            }
            result.push({
                x: tx,
                y: ty,
                skinY,
                z,
                offset: layerOffset,
                tileSize,
                id: layer['_getTileId'](tx, ty, z)
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

function getReverseY(tileConfig, y, res) {
    const fullExtent = tileConfig.fullExtent;
    return Math.round((fullExtent['top'] - fullExtent['bottom']) / (tileConfig.tileSize.width * res) - y) - 1;
}
