/**
 * String utilities  used internally
 * @class
 * @category core
 * @protected
 */
maptalks.StringUtil = {

    /**
     * Trim the string
     * @param {String} str
     * @return {String}
     */
    trim: function (str) {
        return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
    },

    /**
     * Split string by specified char
     * @param {String} chr - char to split
     * @return {String[]}
     */
    splitWords: function (chr) {
        return maptalks.StringUtil.trim(chr).split(/\s+/);
    },

    /**
     * Gets size in pixel of the text with a certain font.
     * @param {String} text - text to measure
     * @param {String} font - font of the text, same as the CSS font.
     * @return {maptalks.Size}
     */
    stringLength:function (text, font) {
        var ruler = maptalks.DomUtil._getDomRuler('span');
        ruler.style.font = font;
        ruler.innerHTML = text;
        var result = new maptalks.Size(ruler.clientWidth, ruler.clientHeight);
        //if not removed, the canvas container on chrome will turn to unexpected blue background.
        //Reason is unknown.
        maptalks.DomUtil.removeDomNode(ruler);
        return result;

    },

    /**
     * Split content by wrapLength 根据长度分割文本
     * @param {String} content      - text to split
     * @param {Number} textLength   - width of the text, provided to prevent expensive repeated text measuring
     * @param {Number} wrapWidth    - width to wrap
     * @return {String[]}
     */
    splitContent: function (content, textLength, wrapWidth) {
        var rowNum = Math.ceil(textLength / wrapWidth);
        var avgLen = textLength / content.length;
        var approxLen =  Math.floor(wrapWidth / avgLen);
        var result = [];
        for (var i = 0; i < rowNum; i++) {
            if (i < rowNum - 1) {
                result.push(content.substring(i * approxLen, (i + 1) * approxLen));
            } else {
                result.push(content.substring(i * approxLen));
            }
        }
        return result;
    },
    /**
     * Replace variables wrapped by square brackets ({foo}) with actual values in props.
     * @example
     *     // will returns 'John is awesome'
     *     var actual = maptalks.StringUtil.replaceVariable('{foo} is awesome', {'foo' : 'John'});
     * @param {String} str      - string to replace
     * @param {Object} props    - variable value properties
     * @return {String}
     */
    replaceVariable: function (str, props) {
        if (!maptalks.Util.isObject(props) || !maptalks.Util.isString(str)) {
            return str;
        }
        return str.replace(maptalks.StringUtil._contentExpRe, function (str, key) {
            var value = props[key];
            if (maptalks.Util.isNil(value)) {
                return str;
            }
            return value;
        });
    },

    _contentExpRe: /\{([\w_]+)\}/g,

    /**
     * Split a text to multiple rows according to the style.<br>
     * Style is generated in [TextMarkerSymbolizer]{@link maptalks.symbolizer.TextMarkerSymbolizer}
     * @param {String} text     - text to split
     * @param {Object} style    - text style
     * @return {Object[]} the object's structure: {rowNum: rowNum, textSize: textSize, rows: textRows}
     */
    splitTextToRow: function (text, style) {
        var font = maptalks.symbolizer.TextMarkerSymbolizer.getFont(style),
            lineSpacing = style['textLineSpacing'] || 0,
            rawTextSize = maptalks.StringUtil.stringLength(text, font),
            textWidth = rawTextSize['width'],
            textHeight = rawTextSize['height'],
            wrapChar = style['textWrapCharacter'],
            wrapWidth = style['textWrapWidth'],
            textRows = [];
        if (!wrapWidth || wrapWidth > textWidth) { wrapWidth = textWidth; }
        if (!maptalks.Util.isString(text)) {
            text += '';
        }
        var actualWidth = 0, size, i, l;
        if (wrapChar && text.indexOf(wrapChar) >= 0) {
            var texts = text.split(wrapChar),
                t, tSize, tWidth, contents, ii, ll;
            for (i = 0, l = texts.length; i < l; i++) {
                t = texts[i];
                //TODO stringLength is expensive, should be reduced here.
                tSize = maptalks.StringUtil.stringLength(t, font);
                tWidth = tSize['width'];
                if (tWidth > wrapWidth) {
                    contents = maptalks.StringUtil.splitContent(t, tWidth, wrapWidth);
                    for (ii = 0, ll = contents.length; ii < ll; ii++) {
                        size = maptalks.StringUtil.stringLength(contents[ii], font);
                        if (size['width'] > actualWidth) { actualWidth = size['width']; }
                        textRows.push({'text':contents[ii], 'size':size});
                    }
                } else {
                    if (tSize['width'] > actualWidth) { actualWidth = tSize['width']; }
                    textRows.push({'text':t, 'size':tSize});
                }
            }
        } else if (textWidth > wrapWidth) {
            var splitted = maptalks.StringUtil.splitContent(text, textWidth, wrapWidth);
            for (i = 0; i < splitted.length; i++) {
                size = maptalks.StringUtil.stringLength(splitted[i], font);
                if (size['width'] > actualWidth) { actualWidth = size['width']; }
                textRows.push({'text':splitted[i], 'size':size});
            }
        } else {
            if (rawTextSize['width'] > actualWidth) {
                actualWidth = rawTextSize['width'];
            }
            textRows.push({'text':text, 'size':rawTextSize});
        }

        var rowNum = textRows.length;
        var textSize = new maptalks.Size(actualWidth, textHeight * rowNum + lineSpacing * (rowNum - 1));
        return {'total': rowNum, 'size': textSize, 'rows': textRows, 'rawSize':rawTextSize};
    },

    /**
     * Gets text's align point according to the horizontalAlignment and verticalAlignment
     * @param  {maptalks.Size} size                  - text size
     * @param  {String} horizontalAlignment - horizontalAlignment: left/middle/right
     * @param  {String} verticalAlignment   - verticalAlignment: top/middle/bottom
     * @return {maptalks.Point}
     */
    getAlignPoint:function (size, horizontalAlignment, verticalAlignment) {
        var width = size['width'], height = size['height'];
        var alignW, alignH;
        if (horizontalAlignment === 'left') {
            alignW = -width;
        } else if (horizontalAlignment === 'middle') {
            alignW = -width / 2;
        } else if (horizontalAlignment === 'right') {
            alignW = 0;
        }
        if (verticalAlignment === 'top') {
            alignH = -height;
        } else if (verticalAlignment === 'middle') {
            alignH = -height / 2;
        } else if (verticalAlignment === 'bottom') {
            alignH = 0;
        }
        return new maptalks.Point(alignW, alignH);
    },

    /**
     * Filter special characters in text content
     * @param {String} content
     * @return {String}
     * '\b\t\r\v\f';
     */
    filterContent: function (content) {
        var pattern = /[\b\t\r\v\f]/igm;
        return content.replace(pattern, '');
    }
};
