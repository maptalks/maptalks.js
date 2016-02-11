Z.symbolizer.VectorMarkerSymbolizer = Z.symbolizer.PointSymbolizer.extend({

    defaultSymbol:{
        "markerType": "ellipse", //<----- ellipse | cross | x | triangle | diamond | square | bar | pin等,默认ellipse

        "markerFill": "#0000ff", //blue as cartoCSS
        "markerFillOpacity": 1,
        "markerLineColor": "#000000", //black
        "markerLineWidth": 1,
        "markerLineOpacity": 1,
        "markerLineDasharray":[],
        "markerWidth": 10,
        "markerHeight": 10,

        "markerDx": 0,
        "markerDy": 0
    },

    initialize:function(symbol, geometry) {
        this.symbol = symbol;
        this.geometry = geometry;
        this.style = this.translate();
        this.strokeAndFill = Z.symbolizer.VectorMarkerSymbolizer.translateStrokeAndFill(this.style);
    },

    symbolize:function(ctx, resources) {

        var cookedPoints = this._getRenderContainerPoints();
        if (!Z.Util.isArrayHasData(cookedPoints)) {
            return;
        }
        var style = this.style;
        var vectorArray = this._getVectorArray(style);
        var markerType = style['markerType'].toLowerCase();
        var strokeAndFill = this.strokeAndFill;
        this._prepareContext(ctx);
        Z.Canvas.prepareCanvas(ctx, strokeAndFill['stroke'],strokeAndFill['fill'], resources);
        var lineOpacity = strokeAndFill['stroke']['stroke-opacity'],
            fillOpacity = strokeAndFill['fill']['fill-opacity'];
        var j;

        var width = style['markerWidth'],
            height = style['markerHeight'];

        for (var i = cookedPoints.length - 1; i >= 0; i--) {
            var point = cookedPoints[i];
            if (markerType === 'cross' || markerType === 'x'){
                for (j = vectorArray.length - 1; j >= 0; j--) {
                    vectorArray[j]._add(point);
                }
                //线类型
                Z.Canvas.path(ctx,vectorArray.slice(0,2),null, lineOpacity);
                Z.Canvas.path(ctx,vectorArray.slice(2,4),null, lineOpacity);
            } else if (markerType === 'diamond' || markerType === 'bar' || markerType === 'square' || markerType === 'triangle'){
                if (markerType === 'bar') {
                    point = point.add(new Z.Point(0,-style['markerLineWidth']/2));
                }
                for (j = vectorArray.length - 1; j >= 0; j--) {
                    vectorArray[j]._add(point);
                }
                //面类型
                Z.Canvas.polygon(ctx,vectorArray,null, lineOpacity, fillOpacity);
            } else if (markerType === 'pin') {
                point = point.add(new Z.Point(0,-style['markerLineWidth']/2));
                for (j = vectorArray.length - 1; j >= 0; j--) {
                    vectorArray[j]._add(point);
                }
                var lineCap = ctx.lineCap;
                ctx.lineCap = 'round'; //set line cap to round to close the pin bottom
                Z.Canvas.bezierCurve(ctx,vectorArray,null, lineOpacity);
                Z.Canvas.fillCanvas(ctx, fillOpacity);
                ctx.lineCap = lineCap;
            } else if (markerType === 'pie') {
                point = point.add(new Z.Point(0,-style['markerLineWidth']/2));
                var angle = Math.atan(width/2/height)*180/Math.PI;
                var lineCap = ctx.lineCap;
                ctx.lineCap = 'round';
                Z.Canvas.sector(ctx, point, height, [90-angle, 90+angle], lineOpacity, fillOpacity);
                ctx.lineCap = lineCap;
            } else {
                //ellipse default
                Z.Canvas.ellipse(ctx, point, new Z.Size(width/2,height/2), lineOpacity, fillOpacity);
            }
        }

    },

    getPlacement:function() {
        return this.symbol['markerPlacement'];
    },

    getDxDy:function() {
        var s = this.style;
        var dx = s['markerDx'],
            dy = s['markerDy'];
        return new Z.Point(dx, dy);
    },

    getMarkerExtent:function() {
        var dxdy = this.getDxDy(),
            style = this.style;
        var markerType = style['markerType'].toLowerCase();
        var width = style['markerWidth'],
            height = style['markerHeight'];
        var result;
        if (markerType  === 'bar' || markerType  === 'pie' || markerType  === 'pin') {
            result = new Z.Extent(dxdy.add(new Z.Point(-width/2,-height)), dxdy.add(new Z.Point(width/2,0)));
        } else {
            result = new Z.Extent(dxdy.add(new Z.Point(-width/2,-height/2)), dxdy.add(new Z.Point(width/2,height/2)));
        }
        if (this.style['markerLineWidth']) {
            result = result.expand(this.style['markerLineWidth']/2);
        }
        return result;
    },


    translate:function() {
        var s = this.symbol;
        var d = this.defaultSymbol;

        var result = {
            "markerType"       : s["markerType"],
            "markerWidth"      : Z.Util.getValueOrDefault(s["markerWidth"], d["markerWidth"]),
            "markerHeight"     : Z.Util.getValueOrDefault(s["markerHeight"], d["markerHeight"]),
            "markerDx"         : Z.Util.getValueOrDefault(s["markerDx"], d["markerDx"]),
            "markerDy"         : Z.Util.getValueOrDefault(s["markerDy"], d["markerDy"]),

            "markerFill"       : Z.Util.getValueOrDefault(s["markerFill"], d["markerFill"]),
            "markerFillOpacity": Z.Util.getValueOrDefault(s["markerFillOpacity"], d["markerFillOpacity"]),
            "markerLineColor" : Z.Util.getValueOrDefault(s["markerLineColor"], d["markerLineColor"]),
            "markerLineWidth" : Z.Util.getValueOrDefault(s["markerLineWidth"], d["markerLineWidth"]),
            "markerLineDasharray": Z.Util.getValueOrDefault(s["markerLineDasharray"], d["markerLineDasharray"]),
            "markerLineOpacity": Z.Util.getValueOrDefault(s["markerLineOpacity"], d["markerLineOpacity"])
        };
        //marker-opacity覆盖fill-opacity和line-opacity
        if (Z.Util.isNumber(s["markerOpacity"])) {
            result["markerFillOpacity"] *= s["markerOpacity"];
            result["markerLineOpacity"] *= s["markerOpacity"];
        }
        return result;
    },

    _getVectorArray: function(style) {
        //ignore case
        var markerType = style['markerType'].toLowerCase();
        var width = style['markerWidth'],
            height = style['markerHeight'];
        //half height and half width
        var hh = Math.round(height/2),
            hw = Math.round(width/2);
        var left = 0, top = 0;
        var v0,v1,v2,v3;
        if ('triangle' === markerType) {
            v0 = new Z.Point(left,top-hh);
            v1 = new Z.Point(left-hw,top+hh);
            v2 = new Z.Point(left+hw,top+hh);
            return [v0,v1,v2];
        } else if ('cross' === markerType) {
            v0 = new Z.Point((left-hw),top);
            v1 = new Z.Point((left+hw),top);
            v2 = new Z.Point((left),(top-hh));
            v3 = new Z.Point((left),(top+hh));
            return [v0,v1,v2,v3];
        } else if ('diamond' === markerType) {
            v0 = new Z.Point((left-hw),top);
            v1 = new Z.Point(left,(top-hh));
            v2 = new Z.Point((left+hw),top);
            v3 = new Z.Point((left),(top+hh));
            return [v0,v1,v2,v3];
        } else if ('square' === markerType) {
            v0 = new Z.Point((left-hw),(top+hh));
            v1 = new Z.Point((left+hw),(top+hh));
            v2 = new Z.Point((left+hw),(top-hh));
            v3 = new Z.Point((left-hw),(top-hh));
            return [v0,v1,v2,v3];
        } else if ('x' === markerType) {
             v0 = new Z.Point(left-hw,top+hh);
             v1 = new Z.Point(left+hw,top-hh);
             v2 = new Z.Point(left+hw,top+hh);
             v3 = new Z.Point(left-hw,top-hh);
             return [v0,v1,v2,v3];
        } else if ('bar' === markerType) {
             v0 = new Z.Point((left-hw),(top-height));
             v1 = new Z.Point((left+hw),(top-height));
             v2 = new Z.Point((left+hw),top);
             v3 = new Z.Point((left-hw),top);
             return [v0,v1,v2,v3];
        } else if ('pin' === markerType) {
              var extWidth = height*Math.atan(hw/hh);
              v0 = new Z.Point(left,top);
              v1 = new Z.Point(left-extWidth,top-height);
              v2 = new Z.Point(left+extWidth,top-height);
              v3 = new Z.Point(left,top);
              return [v0,v1,v2,v3];
        }
        return null;
    }
});


Z.symbolizer.VectorMarkerSymbolizer.test=function(geometry, symbol) {
    if (!geometry || !symbol) {
        return false;
    }
    var layer = geometry.getLayer();
    if (!layer || !layer.isCanvasRender()) {
        return false;
    }
    if (Z.Util.isNil(symbol['markerFile']) && !Z.Util.isNil(symbol['markerType'])) {
        return true;
    }
    return false;
};

Z.symbolizer.VectorMarkerSymbolizer.translateStrokeAndFill=function(s) {
    var result = {
        "stroke" :{
            "stroke" : s['markerLineColor'],
            "stroke-width" : s['markerLineWidth'],
            "stroke-opacity" : s['markerLineOpacity'],
            "stroke-dasharray": null,
            "stroke-linecap" : "butt",
            "stroke-linejoin" : "round"
        },

        "fill" : {
            "fill"          : s["markerFill" ],
            "fill-opacity"  : s["markerFillOpacity"]
        }
    };
    //vml和svg对linecap的定义不同
    if (result['stroke']['stroke-linecap'] === "butt") {
        if (Z.Browser.vml) {
            result['stroke']['stroke-linecap'] = "flat";
        }
    }
    if (result['stroke']['stroke-width'] === 0) {
        result['stroke']['stroke-opacity'] = 0;
    }
    return result;
};
