Z.Label.include({
    /**
     * 开始编辑Label
     * @member maptalks.Label
     * @expose
     */
    startEditText: function() {
        //隐藏label标签
        this.hide();
        this._prepareEditor();
        return this;
    },

    _prepareEditor:function() {
        var map = this.getMap();
        var viewPoint = this._computeViewPoint();
        this._container = Z.DomUtil.createEl('div');
        this._container.style.cssText='position:absolute;top:'+viewPoint['y']
                                    +'px;left:'+viewPoint['x']+'px;z-index:5000;';
        map._panels.mapPlatform.appendChild(this._container);
        this._textEditor = this._createInputDom();
        this._container.appendChild(this._textEditor);
    },

    _computeViewPoint: function() {
        var map = this.getMap();
        var symbol = this.getSymbol();
        var labelSize = this.getSize();
        var dx = Z.Util.getValueOrDefault(symbol['textDx'],0),
            dy = Z.Util.getValueOrDefault(symbol['textDy'],0);
        var align = Z.StringUtil.getAlignPoint(labelSize, symbol['textHorizontalAlignment'], symbol['textVerticalAlignment'])
                    .add(new Z.Point(dx,dy));
        var viewPoint = map.coordinateToViewPoint(this.getCenter()).add(align);
        return viewPoint;
    },

    _createInputDom: function() {
        var labelSize = this.getSize();
        var symbol = this.getSymbol();
        var width = labelSize['width'];
        var height = labelSize['height'];
        var textColor = symbol['textFill'];
        var textSize = symbol['textSize'];
        var fill = symbol['markerFill'];
        var lineColor = symbol['markerLineColor'];
        var spacing = Z.Util.getValueOrDefault(symbol['textLineSpacing'],0);
        var inputDom = Z.DomUtil.createEl('textarea');
        inputDom.style.cssText ='background:'+fill+';'+
            'border:1px solid '+lineColor+';'+
            'color:'+textColor+';'+
            'font-size:'+textSize+'px;'+
            'width:'+(width-spacing)+'px;'+
            'height:'+(height-spacing)+'px;';
        var content = this.getContent();
        inputDom.value = content;
        var me = this;
        Z.DomUtil.on(inputDom, 'blur', function(param){
             me.endEditText();
        });
        return inputDom;

    },

    /**
     * 结束编辑
     * @member maptalks.Label
     * @expose
     */
    endEditText: function() {
        var content = this._textEditor.value;
        this.setContent(content);
        this.show();
        Z.DomUtil.removeDomNode(this._container);
        delete this._container;
        delete this._textEditor;
        return this;
    },

    /**
     * Label是否处于编辑状态中
     * @member maptalks.Label
     * @return {Boolean} 是否处于编辑状态
     * @expose
     */
    isEditingText: function() {
        if (this._container) {
            return true;
        }
        return false;
    }

});
