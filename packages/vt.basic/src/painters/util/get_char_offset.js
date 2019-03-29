import { vec2, vec3 } from '@maptalks/gl';
import { getLineOffset } from './line_offset';


const GLYPH_OFFSET = [], SEGMENT = [], DXDY = [];

export function getCharOffset(out, mesh, textSize, line, i, anchor, scale, flip) {
    // 遍历每个文字，对每个文字获取: anchor, glyphOffset, dx， dy
    // 计算anchor的屏幕位置
    // 根据地图pitch和cameraDistanceFromCenter计算glyph的perspective ratio
    // 从 aSegment 获取anchor的segment, startIndex 和 lineLength
    // 调用 line_offset.js 计算文字的 offset 和 angle
    // 与aDxDy和aRotation相加后，写回到 aOffset 和 aRotation 中


    const { aGlyphOffset, aSegment, symbol } = mesh.geometry.properties;
    const dxdy = vec2.set(DXDY, symbol['textDx'] || 0, symbol['textDy'] || 0);

    const glyphOffset = vec2.set(GLYPH_OFFSET, aGlyphOffset[i * 2], aGlyphOffset[i * 2 + 1]),
        segment = vec3.set(SEGMENT, aSegment[i * 3], aSegment[i * 3 + 1], aSegment[i * 3 + 2]);

    const offset = getLineOffset(out, line, anchor, glyphOffset, dxdy[0], dxdy[1], segment[0], segment[1], segment[2], textSize / 24, flip, scale);
    return offset;
}
