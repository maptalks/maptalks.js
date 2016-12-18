import { isString } from './common';
import { stringLength, splitContent } from './strings';
import Size from 'geo/Size';
import { TextMarkerSymbolizer } from 'renderer/vectorlayer/symbolizers';

/**
 * Split a text to multiple rows according to the style.<br>
 * Style is generated in [TextMarkerSymbolizer]{@link maptalks.symbolizer.TextMarkerSymbolizer}
 * @param {String} text     - text to split
 * @param {Object} style    - text style
 * @return {Object[]} the object's structure: {rowNum: rowNum, textSize: textSize, rows: textRows}
 */
export function splitTextToRow(text, style) {
    var font = TextMarkerSymbolizer.getFont(style),
        lineSpacing = style['textLineSpacing'] || 0,
        rawTextSize = stringLength(text, font),
        textWidth = rawTextSize['width'],
        textHeight = rawTextSize['height'],
        wrapChar = style['textWrapCharacter'],
        wrapWidth = style['textWrapWidth'],
        textRows = [];
    if (!wrapWidth || wrapWidth > textWidth) {
        wrapWidth = textWidth;
    }
    if (!isString(text)) {
        text += '';
    }
    var actualWidth = 0,
        size, i, l;
    if (wrapChar && text.indexOf(wrapChar) >= 0) {
        var texts = text.split(wrapChar),
            t, tSize, tWidth, contents, ii, ll;
        for (i = 0, l = texts.length; i < l; i++) {
            t = texts[i];
            //TODO stringLength is expensive, should be reduced here.
            tSize = stringLength(t, font);
            tWidth = tSize['width'];
            if (tWidth > wrapWidth) {
                contents = splitContent(t, tWidth, wrapWidth);
                for (ii = 0, ll = contents.length; ii < ll; ii++) {
                    size = stringLength(contents[ii], font);
                    if (size['width'] > actualWidth) {
                        actualWidth = size['width'];
                    }
                    textRows.push({
                        'text': contents[ii],
                        'size': size
                    });
                }
            } else {
                if (tSize['width'] > actualWidth) {
                    actualWidth = tSize['width'];
                }
                textRows.push({
                    'text': t,
                    'size': tSize
                });
            }
        }
    } else if (textWidth > wrapWidth) {
        var splitted = splitContent(text, textWidth, wrapWidth);
        for (i = 0; i < splitted.length; i++) {
            size = stringLength(splitted[i], font);
            if (size['width'] > actualWidth) {
                actualWidth = size['width'];
            }
            textRows.push({
                'text': splitted[i],
                'size': size
            });
        }
    } else {
        if (rawTextSize['width'] > actualWidth) {
            actualWidth = rawTextSize['width'];
        }
        textRows.push({
            'text': text,
            'size': rawTextSize
        });
    }

    var rowNum = textRows.length;
    var textSize = new Size(actualWidth, textHeight * rowNum + lineSpacing * (rowNum - 1));
    return {
        'total': rowNum,
        'size': textSize,
        'rows': textRows,
        'rawSize': rawTextSize
    };
}
