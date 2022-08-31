export function getCascadeTileIds(layer, x, y, z, scale, levelLimit) {
    const result = {};
    for (let i = 0; i < levelLimit; i++) {
        result[i + ''] = getTileIdsAtLevel(layer, x, y, z, scale, i);
    }
    return result;
}

const EMPTY_ARRAY = [];
export function getTileIdsAtLevel(layer, x, y, z, scale, level) {
    z -= level;
    if (z <= 0) {
        return EMPTY_ARRAY;
    }
    scale = scale / Math.pow(2, level);
    if (scale <= 1) {
        const tx = Math.floor(x * scale);
        const ty = Math.floor(y * scale);
        return [{
            x: tx,
            y: ty,
            z,
            id: layer['_getTileId'](tx, ty, z)
        }];
    }
    let result = [];
    for (let i = 0; i < scale; i++) {
        for (let j = 0; j < scale; j++) {
            const tx = x * scale + i;
            const ty = y * scale + j;
            result.push({
                x: tx,
                y: ty,
                z,
                id: layer['_getTileId'](tx, ty, z)
            });
        }
    }
    return result;
}

export function getParentSkinTile(tileCache, skinTileIds) {

}

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
