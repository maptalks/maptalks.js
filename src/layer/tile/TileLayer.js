/**
 * 瓦片图层
 * @class maptalks.TileLayer
 * @extends maptalks.Layer
 * @author Maptalks Team
 */
Z.TileLayer = Z.Layer.extend({
    type: 'tile',

    options: {
        'errorTileUrl'  : 'images/system/transparent.png',
        'urlTemplate'   : 'images/system/transparent.png',
        'subdomains'    : [''],

        'gradualLoading' : true,

        'repeatWorld'   : true,

        'renderWhenPanning' : false,
        //移图时地图的更新间隔, 默认为0即实时更新, -1表示不更新.如果效率较慢则可改为适当的值
        'renderSpanWhenPanning' : 0,

        'crossOrigin' : null,

        'tileSize' : {
            'width'   : 256,
            'height'  : 256
        },

        'tileSystem' : null,

        'renderer'  : 'canvas'
    },


    /**
     * <pre>
     * 瓦片图层类构造函数
     * 图层配置如下:
     *     tileInfo: 空间参考系设置,例如ESGP:3857
     *     opacity:图层透明度
     *     urlTemplate:URL模板,例如http://{s}.example.com/{z}/{y}/{x}.png
     *     subdomains:数组,用来轮流替换url模板中的{s}变量
     *     tileSize:{width:256,height:256}
     *     tileInfo的值可为字符串类型的预定义配置或属性对象:
     *     预定义配置有:"web-mercator","global-mercator","baidu"
     *     如果是属性对象,则需要指定
     * </pre>
     * @param  {String} id 图层identifier
     * @param  {Object} opts 图层配置
     */
    initialize:function(id,opts) {
        this.setId(id);
        Z.Util.setOptions(this,opts);
    },

    /**
     * load the tile layer, can't be overrided by sub-classes
     */
    load:function(){
        if (!this.getMap()) {return;}
        this._initTileConfig();
        this._initRenderer();
        this._renderer.initContainer();
        var zIndex = this.getZIndex();
        if (!Z.Util.isNil(zIndex)) {
            this._renderer.setZIndex(zIndex);
        }
        if (this._prepareLoad()) {
            this._renderer.render(true);
        }
    },

    getTileSize:function() {
        return Z.Util.extend({}, this.options['tileSize']);
    },

    clear:function() {
        if (this._renderer) {
            this._renderer.clear();
        }
    },

    /**
     * 载入前的准备操作
     */
    _prepareLoad:function() {
        //nothing to do here, just return true
        return true;
    },


    /**
     * * 加载TileConfig
     * @param  {fn} onLoaded 加载完成后的回调函数
     */
    _initTileConfig:function() {
        if (this.options['tileSystem']) {
            this._tileConfig = new Z.TileConfig(this.options['tileSystem'], this.getMap().getFullExtent(), this.getTileSize());
        } else {
            var map = this.getMap();
            this._defaultTileConfig = new Z.TileConfig(Z.TileSystem.getDefault(map.getProjection()), map.getFullExtent(), this.getTileSize());
        }
    },

    _getTileConfig:function(){
        var tileConfig = this._tileConfig;
        if (!this._tileConfig) {
            var map = this.getMap();
            //如果tilelayer本身没有设定tileconfig,则继承地图基础底图的tileconfig
            if (map && map.getBaseLayer() && map.getBaseLayer()._getTileConfig) {
                tileConfig = map.getBaseLayer()._getTileConfig();
            }
        }
        if (!tileConfig) {
            return this._defaultTileConfig;
        }
        return tileConfig;
    },

    _getTiles:function(canvasSize) {
        // rendWhenReady = false;
        var map =this.getMap();
        if (!map) {
            return null;
        }
        if (!this.isVisible()) {
            return null;
        }

        var tileConfig = this._getTileConfig();
        if (!tileConfig) {return null;}

        var tileSize = this.getTileSize(),
            zoom = map.getZoom(),
            res = map._getResolution(),
            mapDomOffset = map.offsetPlatform();

        var holderLeft=mapDomOffset.x,
            holderTop = mapDomOffset.y,
            mapWidth = map.width,
            mapHeight = map.height;
            //中心瓦片信息,包括瓦片编号,和中心点在瓦片上相对左上角的位置
        var centerTileIndex =  tileConfig.getCenterTileIndex(map._getPrjCenter(), res);
        //计算中心瓦片的top和left偏移值
        var centerTileViewPoint=new Z.Point(parseFloat(mapWidth/2-centerTileIndex["offsetLeft"]),
                                                parseFloat(mapHeight/2-centerTileIndex["offsetTop"])).round();
        if (!canvasSize || !(canvasSize instanceof Z.Size)) {
            canvasSize = new Z.Size(mapWidth, mapHeight);
        }
        //中心瓦片上下左右的瓦片数
        var tileTopNum =Math.ceil(Math.abs((canvasSize['height'] - mapHeight)/2 + centerTileViewPoint.y)/tileSize["height"]),
            tileLeftNum=Math.ceil(Math.abs((canvasSize['width']- mapWidth)/2 + centerTileViewPoint.x)/tileSize["width"]),
            tileBottomNum=Math.ceil(Math.abs((canvasSize['height'] - mapHeight)/2 + mapHeight-centerTileViewPoint.y)/tileSize["height"]),
            tileRightNum=Math.ceil(Math.abs((canvasSize['width'] - mapWidth)/2 + mapWidth-centerTileViewPoint.x)/tileSize["width"]);

    //  只加中心的瓦片，用做调试
    //  var centerTileImg = this._createTileImage(centerTileViewPoint.x,centerTileViewPoint.y,this.config._getTileUrl(centerTileIndex["topIndex"],centerTileIndex["leftIndex"],zoom),tileSize["height"],tileSize["width"]);
    //  tileContainer.appendChild(centerTileImg);

        var tiles = [];
        var fullExtent = new Z.Extent();
        //TODO 瓦片从中心开始加起
        for (var i=-(tileLeftNum);i<tileRightNum;i++){
            for (var j=-(tileTopNum);j<=tileBottomNum;j++){
                    var tileIndex = tileConfig.getNeighorTileIndex(centerTileIndex["y"], centerTileIndex["x"], j,i, res, this.options['repeatWorld']);
                    var tileLeft = centerTileViewPoint.x + tileSize["width"]*i-holderLeft;
                    var tileTop = centerTileViewPoint.y +tileSize["height"]*j-holderTop;
                    var tileUrl = this._getTileUrl(tileIndex["x"],tileIndex["y"],zoom);
                    var tileId=[tileIndex["y"], tileIndex["x"], zoom].join('__');
                    var tileDesc = {
                        'url' : tileUrl,
                        'viewPoint': new Z.Point(tileLeft, tileTop),
                        'id'  : tileId,
                        'zoom' : zoom
                    };
                    tiles.push(tileDesc);
                    fullExtent = fullExtent.combine(new Z.Extent(tileDesc['viewPoint'], tileDesc['viewPoint'].add(new Z.Point(tileSize['width'],tileSize['height']))));
            }
        }
        var sortOrder = 1;
        if (Z.Browser.ie || Z.Browser.edge) {
            sortOrder = -1;
        }
        //瓦片排序, 地图中心的瓦片排在末尾, 末尾的瓦片先载入
        tiles.sort(function (a, b) {
            return sortOrder*(b['viewPoint'].distanceTo(centerTileViewPoint)-a['viewPoint'].distanceTo(centerTileViewPoint));
        });
        return {
            'tiles' : tiles,
            'fullExtent' : fullExtent
        };
    },

    _getTileUrl:function(x,y,z) {
        if (!this.options['urlTemplate']) {
            return this.options['errorTileUrl'];
        }
        var urlTemplate = this.options['urlTemplate'];
        if (Z.Util.isFunction(urlTemplate)) {
            return urlTemplate(x,y,z);
        }
        var domain = '';
        if (this.options['subdomains']) {
            var subdomains = this.options['subdomains'];
            if (Z.Util.isArrayHasData(subdomains)) {
                var length = subdomains.length;
                var s = (x+y) % length;
                if (s<0) {
                    s=0;
                }
                domain = subdomains[s];
            }
        }
        var data = {
            'x' : x,
            'y' : y,
            'z' : z,
            's' : domain
        };
        return urlTemplate.replace(/\{ *([\w_]+) *\}/g,function (str, key) {
            var value = data[key];

            if (value === undefined) {
                throw new Error('No value provided for variable ' + str);

            } else if (typeof value === 'function') {
                value = value(data);
            }
            return value;
        });
    }
});

Z.Util.extend(Z.TileLayer,Z.Renderable);
