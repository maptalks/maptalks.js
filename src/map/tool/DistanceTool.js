/**
 * 测距鼠标工具类
 * @class maptalks.DistanceTool
 * @extends maptalks.Class
 * @mixins maptalks.Eventable
 * @author Maptalks Team
 */
Z.DistanceTool = Z.Class.extend({
    includes: [Z.Eventable],

    /**
     * 初始化测距工具
     * @constructor
     * @param {Object} options:{}
     */
    initialize: function(options) {
        Z.Util.extend(this, options);
        return this;
    },

    /**
     * 将工具添加到目标对象上
     * @param {maptalks.Map} map
     * @expose
     */
    addTo: function(map) {
        //TODO options应该设置到this.options中
        this.map = map;
        if (!this.map) {return;}
        this.layerId = Z.internalLayerPrefix+'distancetool';
        this.drawLayer = null;
        this.drawTool = null;
        this.rings = [];
        this.enable();
        return this;
    },

    /**
     * 激活测距鼠标工具
     * @expose
     */
    enable:function() {
        if (!this.map) {
            return;
        }
        var drawTool = this.drawTool;
        this.drawLayer = this.map.getLayer(this.layerId);
        if (this.drawLayer !== null && drawTool !== null) {
            drawTool.enable();
            return;
        }
        if (this.drawLayer !== null) {
            this.map.removeLayer(this.layerId);
        }

        this.drawLayer = new Z.VectorLayer(this.layerId);

        this.map.addLayer(this.drawLayer);

        drawTool = new Z.DrawTool({
            'mode':Z.Geometry.TYPE_POLYLINE,
            'symbol': {'strokeSymbol':{'stroke':'#ff0000', 'stroke-width':3, 'opacity':0.6}},
            'disableOnDrawEnd': true
        }).addTo(this.map);

        drawTool.on('drawstart', Z.Util.bind(this._startMeasure, this));
        drawTool.on('drawvertex', Z.Util.bind(this._measureRing, this));
        drawTool.on('drawend', Z.Util.bind(this._afterMeasure, this));

        this.drawTool = drawTool;

        this.counter = 0;
        this.rings = [];
        this.tmpMarkers = [];
    },

    /**
     * 停止测距鼠标工具
     * @expose
     */
    disable:function() {
        if (!this.map) {
            return;
        }
        this.clear();
        var drawTool = this.drawTool;
        var _canvas = this.map.canvasDom;
        if (!_canvas) {
            this._changeCursor('default');
        }
        if (drawTool !== null) {
            drawTool.disable();
        }
    },

    /**
     * 清除测量结果
     * @expose
     */
    clear: function(){
        if (this.drawLayer !== null && this.map !== null) {
            this.drawLayer.clear();
        }
        this.rings = [];
        this.counter = 0;
        this.tmpMarkers = [];
    },

    _startMeasure : function(param) {
        var startDiv = this._outline('起点', 28);
        var coordinate = param['coordinate'];
        this.rings.push(coordinate);

        var point = this._genMeasurePoint(coordinate, this.layerId + '_startp_' + this.counter);
        var marker = new Z.Marker(coordinate, this.layerId + '_start_' + this.counter);
        marker.setSymbol({
            'type' : 'html',
            'content' : startDiv
        });
        this.drawLayer.addGeometry([point,marker]);
        this.tmpMarkers.push(point);
        this.tmpMarkers.push(marker);
    },

    _measureRing : function(param) {
        var content = null;
        var coordinate = param['coordinate'];
        this.rings.push(coordinate);
        var lenSum = this._caculateLenSum();
        if (lenSum>1000) {
            content = (lenSum/1000).toFixed(1)+'公里';
        } else {
            content = lenSum + '米';
        }
        var measureDiv = this._outline(content, 50);
        var point = this._genMeasurePoint(coordinate, this.layerId + '_ringp_' + this.rings.length+'_' + this.counter);
        var marker = new Z.Marker(coordinate, this.layerId + '_ring_' + this.rings.length + '_' + this.counter);
        marker.setSymbol({
            'type' : 'html',
            'content' : measureDiv
        });
        this.drawLayer.addGeometry([point,marker]);
        this.tmpMarkers.push(point);
        this.tmpMarkers.push(marker);
    },

    _afterMeasure : function(param) {
        var polyline = param.target;
        var coordinate = param['coordinate'];
        this.rings.push(coordinate);
        var divContent = '总长';
        var lenSum = this._caculateLenSum();
        if (lenSum>1000) {
            divContent += (lenSum/1000).toFixed(1)+'公里';
        } else {
            divContent += lenSum.toFixed(1)+'米';
        }
        this._endMeasure(coordinate, divContent, polyline);
        this._changeCursor('default');
        this.counter++;
        this.rings = [];
        /**
         * 距离量算结束事件
         * @event measureend
         * @param result: 总长度
         */
        this.fire('measureend', {'result': lenSum});
    },

    _caculateLenSum : function() {
        var rings = this.rings;
        if (rings.length <= 1) {
            return 0;
        }
        var lenSum = 0;
        var projection = this.map.getProjection();
        for (var i=1,len=rings.length;i<len;i++){
            lenSum += projection.measureLength(rings[i-1],rings[i]);
        }
        return parseFloat(lenSum);
    },

    _genMeasurePoint: function(coordinate, id) {
        var point = new Z.Marker(coordinate, id);
        point.setSymbol({
            'icon':{
                'type'   : 'picture',
                'url'    : Z.prefix + 'images/point.png',
                'width'  : 16,
                'height' : 17,
                'offset' : {
                    'x'  : 0,
                    'y'  : -8
                }
            }

        });
        return point;
    },



    _outline: function(content,width,top,left) {
        if (top===null) {
            top=-10;
        }
        if (left===null) {
            left = 10;
        }
        return '<div class="MAP_CONTROL_PointTip" style="top:'+
            top+'px;left:'+left+'px;width:'+width+'px">'+content+'</div>';
    },

    _endMeasure: function(coordinate, divContent, geo) {
        var _geo = geo;
        var counter = this.counter;
        var tmpMarkers = this.tmpMarkers;
        // var map = this.map;
        var point = this._genMeasurePoint(coordinate, this.layerId+'_endp_'+counter);

        var rings;
        if(geo.getPath) {
            rings = geo.getPath();
        } else if(geo.getShell) {
            rings = geo.getShell();
        }
        var offsetX,offsetY;
        //TODO 不清楚map.incre是什么？
//      if (map.incre.x*(rings[rings.length-1].x - rings[rings.length-2].x)>0) {
        if ((rings[rings.length-1].x - rings[rings.length-2].x)>0) {
            offsetX = 15;
        } else {
            offsetX = -20;
        }
//      if (map.incre.y*(rings[rings.length-1].y - rings[rings.length-2].y)>0) {
        if ((rings[rings.length-1].y - rings[rings.length-2].y)>0) {
            offsetY = -30;
        } else {
            offsetY = 10;
        }
        var endDiv = this._outline('<b>'+divContent+'<b>',80,offsetY);
        var marker = new Z.Marker(coordinate, this.layerId+'_end_'+counter);
        marker.setSymbol({
            'icon':{
                'type' : 'html',
                'content' : endDiv
            }
        });
        var closeBtn = new Z.Marker(coordinate, this.layerId + '_close_' + counter);
        closeBtn.setSymbol({
            'icon' : {
                'type'   : 'picture',
                'url'    : Z.prefix + 'images/m_close.png',
                'width'  : 12,
                'height' : 12,
                'offset' : {
                    x : offsetX,
                    y : -6
                }
            }
        });

        closeBtn.setAttributes(counter);

        closeBtn.on('click',function() {
            _geo.remove();
            for (var i = 0, len = tmpMarkers.length;i<len;i++) {
                if (strEndWith(this.tmpMarkers[i].getId(),"_"+closeBtn.getAttributes())) {
                    this.tmpMarkers[i].remove();
                }
            }
        });

        //去掉最后一个点的标签
        if(tmpMarkers&&tmpMarkers.length>0) {
            var center = tmpMarkers[tmpMarkers.length-1].getCenter();

            var endIndexes = [tmpMarkers.length-1];
            var i, len;
            for (i=tmpMarkers.length-3;i>0;i-=2) {
                if (tmpMarkers[i].center.x === center.x && tmpMarkers[i].center.y === center.y) {
                    endIndexes.push(i);
                } else {
                    break;
                }
            }
            for (i=0, len=endIndexes.length;i<len;i++) {
                tmpMarkers[endIndexes[i]].remove();
            }
        }

        this.drawLayer.addGeometry([point,closeBtn,marker,_geo]);

        tmpMarkers.push(marker);
        tmpMarkers.push(point);
        tmpMarkers.push(closeBtn);
        function strEndWith(str, end) {
            if (str===null||str===''||str.length===0||end.length>str.length) {
             return false;
            }
            if (str.substring(str.length-end.length)===end) {
             return true;
            } else {
             return false;
            }
            return true;
        }
    },

    _changeCursor:function(cursorStyle) {
       /*if (_canvas.style!=null && !_canvas.style.cursor)
            _canvas.style.cursor = cursorStyle;*/
   }
});
