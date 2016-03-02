/**
 * String utilities  used internally
 * @class
 * @category core
 * @protected
 */
Z.StringUtil = {

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
        return Z.StringUtil.trim(chr).split(/\s+/);
    },

    /**
     * Gets size in pixel of the text with a certain font.
     * @param {String} text - text to measure
     * @param {String} font - font of the text, same as the CSS font.
     * @return {maptalks.Size}
     */
    stringLength:function(text, font) {
        var ruler = Z.StringUtil._getStrRuler();
        ruler.style.font = font;
        ruler.innerHTML = text;
        var result = new Z.Size(ruler.clientWidth, ruler.clientHeight);
        //if not removed, the canvas container on chrome will turn to unexpected blue background.
        //Reason is unknown.
        Z.DomUtil.removeDomNode(ruler);
        return result;

    },

    _getStrRuler:function(){
        var span = document.createElement("span");
        span.style.cssText="position:absolute;left:-10000px;top:-10000px;";
        document.body.appendChild(span);
        return span;
    },

    /**
     * Split content by wrapLength 根据长度分割文本
     * @param {String} content      - text to split
     * @param {Number} textLength   - width of the text, provided to prevent expensive repeated text measuring
     * @param {Number} wrapWidth    - width to wrap
     * @return {String[]}
     */
    splitContent: function(content, textLength, wrapWidth) {
        var rowNum = Math.ceil(textLength/wrapWidth);
        var avgLen = textLength / content.length;
        var approxLen =  Math.floor(wrapWidth / avgLen);
        var result = [];
        for(var i=0;i<rowNum;i++) {
            if(i < rowNum -1 ) {
                result.push(content.substring(i*approxLen, (i+1)*approxLen));
            } else {
                result.push(content.substring(i*approxLen));
            }
        }
        return result;
    },
    /**
     * Replace variables wrapped by square brackets ([foo]) with actual values in props.
     * @example
     *     // will returns 'John is awesome'
     *     var actual = maptalks.StringUtil.replaceVariable('[foo] is awesome', {'foo' : 'John'});
     * @param {String} str      - string to replace
     * @param {Object} props    - variable value properties
     * @return {String}
     */
    replaceVariable: function (str, props) {
        if (!Z.Util.isObject(props) || !Z.Util.isString(str)) {
            return str;
        }
        return str.replace(Z.StringUtil._contentExpRe, function (str, key) {
            var value = props[key];
            if (Z.Util.isNil(value)) {
                return str;
            }
            return value;
        });
    },

    _contentExpRe: /\[([\w_]+)\]/g,

    /**
     * Split a text to multiple rows according to the style.<br>
     * Style is generated in [TextMarkerSymbolizer]{@link maptalks.symbolizer.TextMarkerSymbolizer}
     * @param {String} text     - text to split
     * @param {Object} style    - text style
     * @return {Object[]} the object's structure: {rowNum: rowNum, textSize: textSize, rows: textRows}
     */
    splitTextToRow: function(text, style) {
        var font = Z.symbolizer.TextMarkerSymbolizer.getFont(style);
        var lineSpacing = Z.Util.getValueOrDefault(style['textLineSpacing'],0);
        var rawTextSize = Z.StringUtil.stringLength(text,font);
        var textWidth = rawTextSize['width'];
        var textHeight = rawTextSize['height'];
        var wrapChar = Z.Util.getValueOrDefault(style['textWrapCharacter'],null);
        var wrapWidth = style['textWrapWidth'];
        if(!wrapWidth || wrapWidth > textWidth) {wrapWidth = textWidth;}
        var textRows = [];
        if(!Z.Util.isString(text)) {
            text +='';
        }
        var actualWidth = 0;
        if(wrapChar&&text.indexOf(wrapChar)>=0){
            var texts = text.split(wrapChar);
            for(var i=0,len=texts.length;i<len;i++) {
                var t = texts[i];
                //TODO stringLength is expensive, should be reduced here.
                var tSize = Z.StringUtil.stringLength(t,font);
                var tWidth = tSize['width'];
                if(tWidth>wrapWidth) {
                    var contents = Z.StringUtil.splitContent(t, tWidth, wrapWidth);
                    for (var ii = 0; ii < contents.length; ii++) {
                        var size = Z.StringUtil.stringLength(contents[ii],font);
                        if (size['width'] > actualWidth) {actualWidth = size['width'];}
                        textRows.push({'text':contents[ii],'size':size});
                    }
                } else {
                    if (tSize['width'] > actualWidth) {actualWidth = tSize['width'];}
                    textRows.push({'text':t,'size':tSize});
                }
            }
        } else {
            if(textWidth>wrapWidth) {
                var splitted = Z.StringUtil.splitContent(text, textWidth, wrapWidth);
                for (var iii = 0; iii < splitted.length; iii++) {
                    var size = Z.StringUtil.stringLength(splitted[iii],font);
                    if (size['width'] > actualWidth) {actualWidth = size['width'];}
                    textRows.push({'text':splitted[iii],'size':size});
                }
            } else {
                if (rawTextSize['width'] > actualWidth) {actualWidth = rawTextSize['width'];}
                textRows.push({'text':text,'size':rawTextSize});
            }
        }
        var rowNum = textRows.length;
        var textSize = new Z.Size(actualWidth, textHeight*rowNum+lineSpacing*(rowNum-1));
        return {'total': rowNum, 'size': textSize, 'rows': textRows, 'rawSize':rawTextSize};
    },

    /**
     * Gets text's align point according to the horizontalAlignment and verticalAlignment
     * @param  {maptalks.Size} size                  - text size
     * @param  {String} horizontalAlignment - horizontalAlignment: left/middle/right
     * @param  {String} verticalAlignment   - verticalAlignment: top/middle/bottom
     * @return {maptalks.Point}
     */
    getAlignPoint:function(size, horizontalAlignment, verticalAlignment) {
        var width = size['width'], height = size['height'];
        var alignW, alignH;
        if (horizontalAlignment === 'left') {
            alignW = -width;
        } else if (horizontalAlignment === 'middle') {
            alignW = -width/2;
        } else if (horizontalAlignment === 'right') {
            alignW = 0;
        }
        if (verticalAlignment === 'top') {
            alignH = -height;
        } else if (verticalAlignment === 'middle') {
            alignH = -height/2;
        } else if (verticalAlignment === 'bottom') {
            alignH = 0;
        }
        return new Z.Point(alignW, alignH);
    }
};
