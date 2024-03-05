import {
    charHasUprightVerticalOrientation,
    charAllowsIdeographicBreaking
} from './script_detection';
import verticalizePunctuation from './verticalize_punctuation';
// import { plugin as rtlTextPlugin } from '../source/rtl_text_plugin';

const WritingMode = {
    horizontal: 1,
    vertical: 2,
    horizontalOnly: 3
};

export { shapeText, shapeIcon, WritingMode };

// The position of a glyph relative to the text's anchor point.
// export type PositionedGlyph = {
//     glyph: number,
//     x: number,
//     y: number,
//     vertical: boolean
// };

// // A collection of positioned glyphs and some metadata
// export type Shaping = {
//     positionedGlyphs: Array<PositionedGlyph>,
//     top: number,
//     bottom: number,
//     left: number,
//     right: number,
//     writingMode: 1 | 2
// };

// type SymbolAnchor = 'center' | 'left' | 'right' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
// type TextJustify = 'left' | 'center' | 'right';

function breakLines(text, lineBreakPoints) {
    const lines = [];
    let start = 0;
    for (let i = 0; i < lineBreakPoints.length; i++) {
        const lineBreak = lineBreakPoints[i];
        lines.push(text.substring(start, lineBreak));
        start = lineBreak;
    }

    if (start < text.length) {
        lines.push(text.substring(start, text.length));
    }
    return lines;
}

function shapeText(text, //: string,
    glyphs, //: {[number]: ?StyleGlyph},
    maxWidth, //: number,
    lineHeight, //: number,
    textAnchor, //: SymbolAnchor,
    textJustify, //: TextJustify,
    spacing, //: number,
    translate, //: [number, number],
    verticalHeight, //: number,
    writingMode) {
    let logicalInput = text.trim();
    if (writingMode === WritingMode.vertical) {
        logicalInput = verticalizePunctuation(logicalInput);
    }

    const positionedGlyphs = [];
    const shaping = {
        positionedGlyphs,
        text: logicalInput,
        top: translate[1],
        bottom: translate[1],
        left: translate[0],
        right: translate[0],
        writingMode
    };

    let lines;

    // const {processBidirectionalText} = rtlTextPlugin;
    // if (processBidirectionalText) {
    //     lines = processBidirectionalText(logicalInput, determineLineBreaks(logicalInput, spacing, maxWidth, glyphs));
    // } else {
    //     lines = breakLines(logicalInput, determineLineBreaks(logicalInput, spacing, maxWidth, glyphs));
    // }
    lines = breakLines(logicalInput, determineLineBreaks(logicalInput, spacing, maxWidth, glyphs));

    shapeLines(shaping, glyphs, lines, lineHeight, textAnchor, textJustify, writingMode, spacing, verticalHeight);

    if (!positionedGlyphs.length)
        return false;

    return shaping;
}

const whitespace = {
    [0x09]: true, // tab
    [0x0a]: true, // newline
    [0x0b]: true, // vertical tab
    [0x0c]: true, // form feed
    [0x0d]: true, // carriage return
    [0x20]: true, // space
};

const breakable = {
    [0x0a]: true, // newline
    [0x20]: true, // space
    [0x26]: true, // ampersand
    [0x28]: true, // left parenthesis
    [0x29]: true, // right parenthesis
    [0x2b]: true, // plus sign
    [0x2d]: true, // hyphen-minus
    [0x2f]: true, // solidus
    [0xad]: true, // soft hyphen
    [0xb7]: true, // middle dot
    [0x200b]: true, // zero-width space
    [0x2010]: true, // hyphen
    [0x2013]: true, // en dash
    [0x2027]: true  // interpunct
    // Many other characters may be reasonable breakpoints
    // Consider "neutral orientation" characters at scriptDetection.charHasNeutralVerticalOrientation
    // See https://github.com/mapbox/mapbox-gl-js/issues/3658
};

function determineAverageLineWidth(logicalInput, //: string,
    spacing, //: number,
    maxWidth, //: number,
    glyphs//: {[number]: ?StyleGlyph}
) {
    let totalWidth = 0;

    for (let index = 0; index < logicalInput.length; index++) {
        const glyph = glyphs[logicalInput.codePointAt(index)];
        if (!glyph)
            continue;
        totalWidth += glyph.metrics.advance + spacing;
    }

    const lineCount = Math.max(1, Math.ceil(totalWidth / maxWidth));
    return totalWidth / lineCount;
}

function calculateBadness(lineWidth, //: number,
    targetWidth, //: number,
    penalty, //: number,
    isLastBreak //: boolean
) {
    const raggedness = Math.pow(lineWidth - targetWidth, 2);
    if (isLastBreak) {
        // Favor finals lines shorter than average over longer than average
        if (lineWidth < targetWidth) {
            return raggedness / 2;
        } else {
            return raggedness * 2;
        }
    }

    return raggedness + Math.abs(penalty) * penalty;
}

function calculatePenalty(codePoint, nextCodePoint) {
    let penalty = 0;
    // Force break on newline
    if (codePoint === 0x0a) {
        penalty -= 10000;
    }
    // Penalize open parenthesis at end of line
    if (codePoint === 0x28 || codePoint === 0xff08) {
        penalty += 50;
    }

    // Penalize close parenthesis at beginning of line
    if (nextCodePoint === 0x29 || nextCodePoint === 0xff09) {
        penalty += 50;
    }
    return penalty;
}

// type Break = {
//     index: number,
//     x: number,
//     priorBreak: ?Break,
//     badness: number
// };

function evaluateBreak(breakIndex, //: number,
    breakX, //: number,
    targetWidth, //: number,
    potentialBreaks, //: Array<Break>,
    penalty, //: number,
    isLastBreak//: boolean
) {
    // We could skip evaluating breaks where the line length (breakX - priorBreak.x) > maxWidth
    //  ...but in fact we allow lines longer than maxWidth (if there's no break points)
    //  ...and when targetWidth and maxWidth are close, strictly enforcing maxWidth can give
    //     more lopsided results.

    let bestPriorBreak = null;
    let bestBreakBadness = calculateBadness(breakX, targetWidth, penalty, isLastBreak);

    for (let i = 0; i < potentialBreaks.length; i++) {
        const potentialBreak = potentialBreaks[i];
        const lineWidth = breakX - potentialBreak.x;
        const breakBadness =
            calculateBadness(lineWidth, targetWidth, penalty, isLastBreak) + potentialBreak.badness;
        if (breakBadness <= bestBreakBadness) {
            bestPriorBreak = potentialBreak;
            bestBreakBadness = breakBadness;
        }
    }

    return {
        index: breakIndex,
        x: breakX,
        priorBreak: bestPriorBreak,
        badness: bestBreakBadness
    };
}

function leastBadBreaks(lastLineBreak) {
    if (!lastLineBreak) {
        return [];
    }
    return leastBadBreaks(lastLineBreak.priorBreak).concat(lastLineBreak.index);
}

function determineLineBreaks(logicalInput, //: string,
    spacing, //: number,
    maxWidth, //: number,
    glyphs) {
    if (!maxWidth)
        return [];

    if (!logicalInput)
        return [];

    const potentialLineBreaks = [];
    const targetWidth = determineAverageLineWidth(logicalInput, spacing, maxWidth, glyphs);

    let currentX = 0;

    for (let i = 0; i < logicalInput.length; i++) {
        const codePoint = logicalInput.codePointAt(i);
        const glyph = glyphs[codePoint];
        if (!glyph) continue;

        if (glyph && !whitespace[codePoint])
            currentX += glyph.metrics.advance + spacing;

        // Ideographic characters, spaces, and word-breaking punctuation that often appear without
        // surrounding spaces.
        if ((i < logicalInput.length - 1) &&
            (breakable[codePoint] ||
                charAllowsIdeographicBreaking(codePoint))) {

            potentialLineBreaks.push(
                evaluateBreak(
                    i + 1,
                    currentX,
                    targetWidth,
                    potentialLineBreaks,
                    calculatePenalty(codePoint, logicalInput.codePointAt(i + 1)),
                    false));
        }
    }

    return leastBadBreaks(
        evaluateBreak(
            logicalInput.length,
            currentX,
            targetWidth,
            potentialLineBreaks,
            0,
            true));
}

function getAnchorAlignment(anchor, isVector3D) {
    let horizontalAlign = 0.5, verticalAlign = 0.5;

    switch (anchor) {
    case 'right':
    case 'top-right':
    case 'bottom-right':
        horizontalAlign = isVector3D ? 1 : 0;
        break;
    case 'left':
    case 'top-left':
    case 'bottom-left':
        horizontalAlign = isVector3D ? 0 : 1;
        break;
    }

    switch (anchor) {
    case 'bottom':
    case 'bottom-right':
    case 'bottom-left':
        verticalAlign = isVector3D ? 1 : 0;
        break;
    case 'top':
    case 'top-right':
    case 'top-left':
        verticalAlign = isVector3D ? 0 : 1;
        break;
    }

    return { horizontalAlign, verticalAlign };
}

function shapeLines(shaping, //: Shaping,
    glyphs, //: {[number]: ?StyleGlyph},
    lines, //: Array<string>,
    lineHeight, //: number,
    textAnchor, //: SymbolAnchor,
    textJustify, //: TextJustify,
    writingMode, //: 1 | 2,
    spacing, //: number,
    verticalHeight,
    isVector3D) {
    // the y offset *should* be part of the font metadata
    const yOffset = 0;//-24 + lineHeight;

    let x = 0;
    let y = yOffset;

    let maxLineLength = 0;
    const positionedGlyphs = shaping.positionedGlyphs;

    const justify =
        textJustify === 'right' ? 1 :
            textJustify === 'left' ? 0 : 0.5;

    for (let ii = 0; ii < lines.length; ii++) {
        let line = lines[ii];
        line = line.trim();

        if (!line.length) {
            y -= lineHeight; // Still need a line feed after empty line
            continue;
        }

        const lineStartIndex = positionedGlyphs.length;
        for (let i = 0; i < line.length; i++) {
            const codePoint = line.codePointAt(i);
            const glyph = glyphs[codePoint];

            if (!glyph) continue;

            if (!charHasUprightVerticalOrientation(codePoint) || writingMode === WritingMode.horizontal) {
                if (codePoint !== 32) {
                    //fuzhen 忽略空格，而只增加x值，让空格前后文字的偏移正常，但空格本身不再添加到pointpack中
                    positionedGlyphs.push({ glyph: codePoint, x, y, vertical: false });
                }
                x += glyph.metrics.advance + spacing;
            } else {
                if (codePoint !== 32) {
                    positionedGlyphs.push({ glyph: codePoint, x, y: 0, vertical: true });
                }
                x += verticalHeight + spacing;
            }
        }

        // Only justify if we placed at least one glyph
        if (positionedGlyphs.length !== lineStartIndex) {
            const lineLength = x - spacing;
            maxLineLength = Math.max(lineLength, maxLineLength);

            justifyLine(positionedGlyphs, glyphs, lineStartIndex, positionedGlyphs.length - 1, justify);
        }

        x = 0;
        y -= lineHeight;
    }

    const { horizontalAlign, verticalAlign } = getAnchorAlignment(textAnchor, isVector3D);
    align(positionedGlyphs, justify, horizontalAlign, verticalAlign, maxLineLength, lineHeight, lines.length);

    // Calculate the bounding box
    const height = lines.length * lineHeight;

    shaping.top += -verticalAlign * height;
    shaping.bottom = shaping.top + height;
    shaping.left += -horizontalAlign * maxLineLength;
    shaping.right = shaping.left + maxLineLength;
}

// justify right = 1, left = 0, center = 0.5
function justifyLine(positionedGlyphs, //: Array<PositionedGlyph>,
    glyphs, //: {[number]: ?StyleGlyph},
    start, //: number,
    end, //: number,
    justify/* : 1 | 0 | 0.5 */) {
    if (!justify)
        return;

    const glyph = glyphs[positionedGlyphs[end].glyph];
    if (glyph) {
        const lastAdvance = glyph.metrics.advance;
        const lineIndent = (positionedGlyphs[end].x + lastAdvance) * justify;

        if (!lineIndent) {
            return;
        }

        for (let j = start; j <= end; j++) {
            positionedGlyphs[j].x -= lineIndent;
        }
    }
}

function align(positionedGlyphs, //: Array<PositionedGlyph>,
    justify, //: number,
    horizontalAlign, //: number,
    verticalAlign, //: number,
    maxLineLength, //: number,
    lineHeight, //: number,
    lineCount//: number
) {
    const shiftX = (justify - horizontalAlign) * maxLineLength;
    const shiftY = -(-verticalAlign * lineCount + 0.5) * lineHeight;

    if (!shiftX && !shiftY) {
        return;
    }

    for (let j = 0; j < positionedGlyphs.length; j++) {
        positionedGlyphs[j].x += shiftX;
        positionedGlyphs[j].y += shiftY;
    }
}

// export type PositionedIcon = {
//     image: ImagePosition,
//     top: number,
//     bottom: number,
//     left: number,
//     right: number
// };

function shapeIcon(image, //: ImagePosition,
    // iconOffset, //: [number, number],
    iconAnchor,//: SymbolAnchor
    isVector3D
) {
    let { horizontalAlign, verticalAlign } = getAnchorAlignment(iconAnchor, isVector3D);
    if (!isVector3D) {
        //TODO vt图层下vertical需要反过来，原因未知
        verticalAlign = 1 - verticalAlign;
    } else {
        //TODO Vector 3D图层下horizontal需要反过来，原因未知
        horizontalAlign = 1 - horizontalAlign;
    }
    // const dx = iconOffset[0];
    // const dy = iconOffset[1];
    // const dx = 0;
    // const dy = 0;
    // const x1 = dx - image.displaySize[0] * horizontalAlign;
    // const x2 = x1 + image.displaySize[0];
    // const y1 = dy - image.displaySize[1] * verticalAlign;
    // const y2 = y1 + image.displaySize[1];

    const width = 2048, height = 2048;
    const x1 = -width * horizontalAlign;
    const x2 = x1 + width;
    const y1 = -height * verticalAlign;
    const y2 = y1 + height;
    return { image, top: y1, bottom: y2, left: x1, right: x2 };
}
