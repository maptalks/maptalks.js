import { vec2, vec3 } from '@maptalks/gl';
import { getLineOffset } from './line_offset';
import { projectPoint } from './projection';

const ANCHOR = [], PROJ_ANCHOR = [], GLYPH_OFFSET = [], SEGMENT = [], DXDY = [];

export function getCharOffset(out, mesh, line, i, projMatrix, width, height, isProjected, scale) {
    // 遍历每个文字，对每个文字获取: anchor, glyphOffset, dx， dy
    // 计算anchor的屏幕位置
    // 根据地图pitch和cameraDistanceFromCenter计算glyph的perspective ratio
    // 从 aSegment 获取anchor的segment, startIndex 和 lineLength
    // 调用 line_offset.js 计算文字的 offset 和 angle
    // 与aDxDy和aRotation相加后，写回到 aOffset 和 aRotation 中

    // const { aAnchor, aGlyphOffset, aDxDy, aSegment, aSize } = mesh.geometry.properties;
    // const dxdy = vec2.set(DXDY, aDxDy[i * 2], aDxDy[i * 2 + 1]);

    const { aAnchor, aGlyphOffset, aSegment, aSize, symbol } = mesh.geometry.properties;
    const dxdy = vec2.set(DXDY, symbol['textDx'] || 0, symbol['textDy'] || 0);

    let anchor = vec3.set(ANCHOR, aAnchor[i * 3], aAnchor[i * 3 + 1], aAnchor[i * 3 + 2]);
    if (isProjected) {
        anchor = projectPoint(PROJ_ANCHOR, anchor, projMatrix, width, height);
    }

    const glyphOffset = vec2.set(GLYPH_OFFSET, aGlyphOffset[i * 2], aGlyphOffset[i * 2 + 1]),
        segment = vec3.set(SEGMENT, aSegment[i * 3], aSegment[i * 3 + 1], aSegment[i * 3 + 2]);

    const offset = getLineOffset(out, line, anchor, glyphOffset, dxdy[0], dxdy[1], segment[0], segment[1], segment[2], aSize[i] / 24, false, scale);
    return offset;
}
