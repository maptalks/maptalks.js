/*!
 * maptalks.mapresty v0.1.0
 * LICENSE : MIT
 * (c) 2016-2017 maptalks.org
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('maptalks')) :
	typeof define === 'function' && define.amd ? define(['exports', 'maptalks'], factory) :
	(factory((global.maptalks = global.maptalks || {}),global.maptalks));
}(this, (function (exports,maptalks) { 'use strict';

function _defaults(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }











var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};











var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : _defaults(subClass, superClass);
};











var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

var options = {
    baseUrl: '',
    format: 'png',
    layers: [],
    showOnTileLoadComplete: false
};

var DynamicLayer = function (_maptalks$TileLayer) {
    inherits(DynamicLayer, _maptalks$TileLayer);

    /**
     * Reproduce a DynamicLayer from layer's JSON.
     * @param  {Object} json - layer's JSON
     * @return {maptalks.DynamicLayer}
     * @static
     * @private
     * @function
     */
    DynamicLayer.fromJSON = function fromJSON(json) {
        if (!json || json['type'] !== 'DynamicLayer') {
            return null;
        }
        return new DynamicLayer(json['id'], json['options']);
    };

    function DynamicLayer(id, options) {
        classCallCheck(this, DynamicLayer);

        //reload时n会增加,改变瓦片请求参数,以刷新浏览器缓存
        var _this = possibleConstructorReturn(this, _maptalks$TileLayer.call(this, id, options));

        _this.n = 0;
        return _this;
    }

    /**
     * 重新载入动态图层，当改变了图层条件时调用
     * @expose
     */


    DynamicLayer.prototype.reload = function reload() {
        this.n += 1;
        this.load();
    };

    /**
     * 载入前的准备, 由父类中的load方法调用
     */


    DynamicLayer.prototype.onAdd = function onAdd() {
        var _this2 = this;

        var map = this.getMap();
        if (!this.options.baseUrl) {
            return false;
        }
        //保证在高频率load时，dynamicLayer总能在zoom结束时只调用一次
        if (this._loadDynamicTimeout) {
            clearTimeout(this._loadDynamicTimeout);
        }

        this._loadDynamicTimeout = setTimeout(function () {
            maptalks.Ajax.post({
                url: _this2.options.baseUrl,
                headers: {
                    'Content-Type': 'application/json'
                }
            }, _this2._buildMapConfig(), function (err, response) {
                if (err) {
                    throw err;
                }
                var result = maptalks.Util.parseJSON(response);
                if (result && result.token) {
                    _this2._token = result.token;
                    _this2._renderer.render(_this2.options.showOnTileLoadComplete);
                }
            });
        }, map.options['zoomAnimationDuration'] + 80);
        //通知父类先不载入瓦片
        return false;
    };

    DynamicLayer.prototype._getTileUrl = function _getTileUrl(x, y, z) {
        var parts = [];
        parts.push(this.options.baseUrl);
        parts.push(this._token);
        parts.push(z);
        parts.push(x);
        parts.push(y + '.' + this.options.format);
        return parts.join('/');
    };

    DynamicLayer.prototype._buildMapConfig = function _buildMapConfig() {
        var map = this.getMap();
        var view = map.getView();
        var projection = view.getProjection();
        var fullExtent = view.getFullExtent();
        var resolutions = view.getResolutions();

        var mapConfig = {
            version: '1.0.0',
            // mandatory: view, optional: center, zoom
            options: {
                center: map.getCenter(),
                zoom: map.getZoom(),
                view: {
                    projection: projection.code,
                    resolutions: resolutions,
                    fullExtent: [fullExtent.left, fullExtent.bottom, fullExtent.right, fullExtent.top]
                }
            },
            layers: this.options.layers
        };
        var maxExtent = map.getMaxExtent();
        if (maxExtent) {
            mapConfig.extent = [maxExtent.xmin, maxExtent.ymin, maxExtent.xmax, maxExtent.ymax];
        }

        return mapConfig;
    };

    return DynamicLayer;
}(maptalks.TileLayer);

DynamicLayer.mergeOptions(options);

DynamicLayer.registerJSONType('DynamicLayer');

/**
 * 空间过滤类
 * @class maptalks.SpatialFilter
 * @extends maptalks.Class
 * @param {maptalks.Geometry} geometry
 * @param {Number} relation
 * @author Maptalks Team
 */

var SpatialFilter = function () {
  function SpatialFilter(geometry, relation, crs) {
    classCallCheck(this, SpatialFilter);

    this.geometry = geometry;
    this.relation = relation;
    this.crs = crs;
  }

  /**
   * 获取SpatialFilter中的geometry
   * @return {maptalks.Geometry} SpatialFilter的Geometry
   * @expose
   */


  SpatialFilter.prototype.getGeometry = function getGeometry() {
    return this.geometry;
  };

  /**
   * 获取SpatialFilter的json
   * @return {String} spatialfilter
   * @expose
   */


  SpatialFilter.prototype.toJSON = function toJSON() {
    var geojson = this.geometry;
    if (this.geometry instanceof maptalks.Geometry) {
      geojson = this.geometry.toGeoJSONGeometry();
    }
    return {
      'geometry': geojson,
      'relation': this.relation,
      'crs': this.crs
    };
  };

  return SpatialFilter;
}();

maptalks.Util.extend(SpatialFilter, {
  /**
   * @static
   * @property {Number} RELATION_INTERSECT 相交
   */
  'RELATION_INTERSECT': 0,
  /**
   * @static
   * @property {Number} RELATION_CONTAIN 包含
   */
  'RELATION_CONTAIN': 1,
  /**
   * @static
   * @property {Number} RELATION_DISJOINT 分离
   */
  'RELATION_DISJOINT': 2,
  /**
   * @static
   * @property {Number} RELATION_OVERLAP 重叠
   */
  'RELATION_OVERLAP': 3,
  /**
   * @static
   * @property {Number} RELATION_TOUCH 接触
   */
  'RELATION_TOUCH': 4,
  /**
   * @static
   * @property {Number} RELATION_WITHIN 在内部
   */
  'RELATION_WITHIN': 5,

  /**
   * @static
   * @property {Number} RELATION_INTERECTNOTCONTAIN 相交但不包含关系即within 或 overlap
   */
  'RELATION_INTERECTNOTCONTAIN': 100,
  /**
   * @static
   * @property {Number} RELATION_CONTAINCENTER 包含中心点
   */
  'RELATION_CONTAINCENTER': 101,

  /**
   * @static
   * @property {Number} RELATION_CENTERWITHIN 中心点被包含
   */
  'RELATION_CENTERWITHIN': 102
});

/**
 * 查询类
 * @class maptalks.FeatureQuery
 * @author Maptalks Team
 */

var FeatureQuery = function () {
    function FeatureQuery(opts) {
        classCallCheck(this, FeatureQuery);

        if (!opts) {
            return;
        }
        this.host = opts['host'];
        this.port = opts['port'];
        this.protocol = opts['protocol'];
        this.mapdb = opts['mapdb'];
    }

    /**
     * 检查查询参数是否正常
     * @return {Boolean} true|false
     */


    FeatureQuery.prototype.check = function check() {
        if (!this.mapdb) {
            return false;
        }
        return true;
    };

    /**
     * 获取空间库主机地址
     * @return {String} 空间库主机地址
     */


    FeatureQuery.prototype.getHost = function getHost() {
        if (!this.port && !this.protocol) {
            return this.host;
        }
        return (this.protocol || 'http:') + '//' + this.host + ':' + this.port;
    };

    /**
     * Identify
     * @param  {Object} opts 查询参数
     * @return 查询结果
     * @expose
     */


    FeatureQuery.prototype.identify = function identify(opts, callback) {
        if (!opts) {
            return this;
        }
        var coordinate = opts['coordinate'];
        var radius = opts['radius'];
        var spatialFilter = new SpatialFilter(new maptalks.Circle(coordinate, radius), SpatialFilter.RELATION_INTERSECT);
        var queryFilter = {
            'spatialFilter': spatialFilter,
            'condition': opts['condition']
        };
        if (opts['resultCRS']) {
            queryFilter['resultCRS'] = opts['resultCRS'];
        }
        opts['queryFilter'] = queryFilter;
        opts['page'] = 0;
        opts['count'] = 1;
        this.query(opts, callback);
        return this;
    };

    /**
     * query
     * @param  {Object} opts 查询参数
     * @expose
     */


    FeatureQuery.prototype.query = function query(opts, callback) {
        if (!opts || !this.check()) {
            throw new Error('invalid options for FeatureQuery\'s query method.');
        }
        if (!opts['layer']) {
            throw new Error('layer is not specified in query options.');
        }
        var layer = opts['layer'];

        if (!layer) {
            throw new Error('layer is not specified in query options.');
        }
        if (maptalks.Util.isArrayHasData(layer)) {
            layer = layer.join(',');
        } else if (maptalks.Util.isString(layer)) {
            var segs = layer.split(',');
            //去掉图层名前后两端的空格, 如 foo1, foo2 , foo3 ----> foo1,foo2,foo3
            for (var i = segs.length - 1; i >= 0; i--) {
                segs[i] = segs[i].replace(/(^\s*)|(\s*$)/g, '');
            }
            layer = segs.join(',');
        }
        //•/databases/{db}/layers/{id}/data?op=query
        var url = this.getHost() + '/rest/sdb/databases/' + this.mapdb + '/layers/' + layer + '/data?op=query';
        var queryFilter = opts['queryFilter'];
        if (!queryFilter) {
            //默认的queryFilter
            queryFilter = {
                'fields': '*'
            };
        }
        var postData = this.formQueryString(queryFilter);
        if (maptalks.Util.isNumber(opts['page'])) {
            postData += '&page=' + opts['page'];
        }
        if (maptalks.Util.isNumber(opts['count'])) {
            postData += '&count=' + opts['count'];
        }

        maptalks.Ajax.post({
            url: url
        }, postData, function (err, response) {
            if (err) {
                throw err;
            }
            if (!response) {
                //20000是未知错误的错误代码
                if (maptalks.Util.isFunction(opts['error'])) {
                    callback({ 'success': false, 'errCode': maptalks.Constant.ERROR_CODE_UNKNOWN, 'error': '' });
                }
                return;
            }
            var result = maptalks.Util.parseJSON(response);
            if (!result) {
                //20000是未知错误的错误代码
                if (maptalks.Util.isFunction(opts['error'])) {
                    callback({ 'success': false, 'errCode': maptalks.Constant.ERROR_CODE_UNKNOWN, 'error': '' });
                }
            } else if (!result['success']) {
                callback(result);
            } else {
                var datas = result['data'];
                if (!datas || datas.length === 0) {
                    callback(null, []);
                } else {
                    var collections = [];
                    if (queryFilter['returnGeometry'] === false) {
                        for (var _i = 0, len = datas.length; _i < len; _i++) {
                            collections.push({
                                'layer': datas[_i]['layer'],
                                'features': datas[_i]['features']
                            });
                        }
                        //不返回Geometry,直接返回属性数据
                        callback(null, collections);
                    } else {
                        for (var _i2 = 0, _len = datas.length; _i2 < _len; _i2++) {
                            collections.push({
                                'layer': datas[_i2]['layer'],
                                'features': maptalks.GeoJSON.toGeometry(datas[_i2]['features'])
                            });
                        }
                        callback(null, collections);
                    }
                }
            }
        });
    };

    /**
     * 构造查询url
     * @param  {Object} queryFilter 查询条件
     * @return {String} 查询url
     * @expose
     */


    FeatureQuery.prototype.formQueryString = function formQueryString(queryFilter) {
        var ret = ['encoding=utf-8', 'mapdb=' + this.mapdb];
        if (queryFilter['resultCRS']) {
            ret.push('resultCRS=' + encodeURIComponent(JSON.stringify(queryFilter['resultCRS'])));
        }
        if (!maptalks.Util.isNil(queryFilter['returnGeometry'])) {
            ret.push('returnGeometry=' + queryFilter['returnGeometry']);
        }
        if (queryFilter['spatialFilter']) {
            var spatialFilter = queryFilter['spatialFilter'];
            var filterGeo = spatialFilter['geometry'];
            if (filterGeo) {
                var paramFilter = void 0;
                if (spatialFilter instanceof SpatialFilter) {
                    paramFilter = spatialFilter.toJSON();
                } else {
                    paramFilter = spatialFilter;
                    if (filterGeo instanceof maptalks.Geometry) {
                        paramFilter['geometry'] = filterGeo.toGeoJSONGeometry();
                    }
                }
                ret.push('spatialFilter=' + encodeURIComponent(JSON.stringify(paramFilter)));
            }
        }
        if (queryFilter['condition']) {
            ret.push('condition=' + encodeURIComponent(queryFilter['condition']));
        }
        if (queryFilter['resultFields']) {
            var fields = queryFilter['resultFields'];
            if (Array.isArray(fields)) {
                fields = fields.join(',');
            }
            ret.push('fields=' + fields);
        }
        return ret.join('&');
    };

    return FeatureQuery;
}();

//默认结果的symbol
var defaultSymbol = {
    'lineColor': '#800040',
    'lineWidth': 2,
    'lineOpacity': 1,
    'lineDasharray': [20, 10, 5, 5, 5, 10],
    'polygonOpacity': 0
};

/**
 * 拓扑查询类
 * @class maptalks.TopoQuery
 * @extends maptalks.Class
 * @author Maptalks Team
 */

var TopoQuery = function () {
    function TopoQuery(opts) {
        classCallCheck(this, TopoQuery);

        if (!opts) {
            return;
        }
        this.host = opts['host'];
        this.port = opts['port'];
        this.protocol = opts['protocol'];
    }

    /**
     * 获取空间库主机地址
     * @return {String} 空间库主机地址
     */


    TopoQuery.prototype.getHost = function getHost() {
        if (!this.port && !this.protocol) {
            return this.host;
        }
        return (this.protocol || 'http:') + '//' + this.host + ':' + this.port;
    };

    /**
     * 计算Geometry的外缓冲，该功能需要引擎服务器版的支持
     * @member maptalks.Map
     * @param {[maptalks.Geometry]} [geometry] [做缓冲的geometry]
     * @param {Number} distance 缓冲距离，单位为米
     * @expose
     */


    TopoQuery.prototype.buffer = function buffer(opts, callback) {
        var geometries = opts['geometries'],
            distance = opts['distance'];
        if (maptalks.Util.isString(distance)) {
            distance = +distance;
        }
        if (!maptalks.Util.isArrayHasData(geometries) || !maptalks.Util.isNumber(distance)) {
            throw new Error('invalid parameters');
        }
        var symbol = opts['symbol'] || defaultSymbol;
        if (!Array.isArray(geometries)) {
            geometries = [geometries];
        }
        //准备参数
        var targets = [];
        for (var i = 0, l = geometries.length; i < l; i++) {
            var geometry = geometries[i];
            if (!(geometry instanceof maptalks.Marker) && !(geometry instanceof maptalks.Circle)) {
                var geoJSON = geometry.toGeoJSONGeometry();
                targets.push(geoJSON);
            }
        }
        function formQueryString() {
            var ret = 'distance=' + distance;
            ret += '&targets=' + encodeURIComponent(JSON.stringify(targets));
            return ret;
        }
        function bufferPointOrCircle(p) {
            // 点和圆形的buffer不需通过服务器而直接进行计算
            if (p instanceof maptalks.Marker) {
                return new maptalks.Circle(p.getCoordinates(), distance);
            } else if (p instanceof maptalks.Circle) {
                return new maptalks.Circle(p.getCoordinates(), p.getRadius() + distance);
            }
            return null;
        }
        var buffered = [];
        if (targets.length === 0) {
            //全都是点或者圆形
            for (var _i = 0, _l = geometries.length; _i < _l; _i++) {
                var r = bufferPointOrCircle(geometries[_i]);
                if (r) {
                    r.setSymbol(symbol);
                }
                buffered.push(r);
            }
            callback(null, buffered);
        } else {
            var url = this.getHost() + '/rest/geometry/analysis/buffer';
            var queryString = formQueryString();
            maptalks.Ajax.post({
                'url': url
            }, queryString, function (err, resultText) {
                if (err) {
                    throw err;
                }
                var result = maptalks.Util.parseJSON(resultText);
                if (!result['success']) {
                    callback(result);
                    return;
                }
                var svrBuffered = maptalks.GeoJSON.toGeometry(result['data']);
                var tmpIndex = 0;
                for (var _i2 = 0, _l2 = geometries.length; _i2 < _l2; _i2++) {
                    var g = void 0;
                    if (geometries[_i2] instanceof maptalks.Marker || geometries[_i2] instanceof maptalks.Circle) {
                        g = bufferPointOrCircle(geometries[_i2]);
                    } else {
                        g = svrBuffered[tmpIndex++];
                    }
                    if (g) {
                        g.setSymbol(symbol);
                    }
                    buffered.push(g);
                }
                callback(null, buffered);
            });
        }
    };

    /**
     * 判断Geometry和参数中的Geometry数组的空间关系，该功能需要引擎服务器版的支持
     * @member maptalks.Map
     * @param {maptalks.Geometry} [geometry] [被relate的Geometry]
     * @param {maptalks.Geometry[]} geometries 输入Geometry数组
     * @param {Number} relation  空间关系，参考maptalks.constant内的常量定义
     * @param {Function} success 回调函数，参数为布尔类型数组，数组长度与geometries参数数组相同，每一位代表相应的判断结果
     * @expose
     */


    TopoQuery.prototype.relate = function relate(opts, callback) {
        var source = opts['source'];
        var relation = opts['relation'];
        var targets = opts['targets'];
        if (targets && !Array.isArray(targets)) {
            targets = [targets];
        }
        if (!source || !maptalks.Util.isArrayHasData(targets) || !maptalks.Util.isNumber(opts['relation'])) {
            throw new Error('invalid parameters');
        }

        function formQueryString() {
            var srcGeoJSON = source.toGeoJSONGeometry();
            var targetGeoJSONs = [];
            for (var i = 0, len = targets.length; i < len; i++) {
                var t = targets[i].toGeoJSONGeometry();
                targetGeoJSONs.push(t);
            }
            var ret = 'source=' + JSON.stringify(srcGeoJSON);
            ret += '&targets=' + JSON.stringify(targetGeoJSONs);
            ret += '&relation=' + relation;
            return ret;
        }
        var url = this.getHost() + '/rest/geometry/relation';
        var queryString = formQueryString();
        maptalks.Ajax.post({
            url: url
        }, queryString, function (err, resultText) {
            if (err) {
                throw err;
            }
            var result = maptalks.Util.parseJSON(resultText);
            if (!result['success']) {
                callback['error'](result);
                return;
            } else {
                callback(null, result['data']);
            }
        });
    };

    return TopoQuery;
}();

maptalks.Map.include({
    genSnapConfig: function genSnapConfig(options) {
        if (!options) {
            options = {
                'extent': this.getExtent(),
                'zoom': this.getZoom(),
                'format': 'png'
            };
        }
        if (options.profile && options.profile.version) {
            return options;
        }
        var extent = options['extent'] || this.getExtent();
        var zoom = options['zoom'] || this.getZoom(),
            format = options['format'] || 'png';
        if (extent instanceof maptalks.Geometry) {
            extent = extent.getExtent();
        }
        var serverDir = options['serverDir'],
            serverFileName = options['serverFileName'];

        var profile = this.toJSON(maptalks.Util.extend({}, options['profile'], { 'clipExtent': extent }));
        profile['extent'] = extent;
        profile.options['zoom'] = zoom;

        profile.options['center'] = extent.getCenter();

        //extra geometries to add to the snapping.
        var extraGeometries = options['extraGeometries'];
        if (extraGeometries) {
            var extraLayer = new maptalks.VectorLayer('__SNAP_extraGeometries_' + maptalks.Util.GUID());
            if (Array.isArray(extraGeometries)) {
                for (var i = 0, len = extraGeometries.length; i < len; i++) {
                    extraLayer.addGeometry(extraGeometries[i].copy());
                }
            } else if (extraGeometries instanceof maptalks.Geometry) {
                extraLayer.addGeometry(extraGeometries.copy());
            }
            if (extraLayer.getCount() > 0) {
                profile['layers'].push(extraLayer.toJSON());
            }
        }
        var snapConfig = {
            'format': format,
            'profile': profile
        };
        if (serverDir) {
            snapConfig['serverDir'] = serverDir;
        }
        if (serverFileName) {
            snapConfig['serverFileName'] = serverFileName;
        }
        return snapConfig;
    },


    /**
        * 截图
        * @param  {Object} options 截图设置
        * @member maptalks.Map
        * @expose
        */
    snap: function snap(options, callback) {
        var snapConfig = void 0;
        if (options.snaps && Array.isArray(options.snaps)) {
            snapConfig = [];
            for (var i = 0, l = options.snaps.length; i < l; i++) {
                snapConfig.push(this.genSnapConfig(options.snaps[i]));
            }
        } else {
            snapConfig = this.genSnapConfig(options);
        }
        //optional host and port, if need another snap server to perform snapping.
        var host = options['host'];
        maptalks.Ajax.post({
            'url': host + '/snap/',
            'headers': {
                'Content-Type': 'text/plain'
            }
        }, snapConfig, function (err, responseText) {
            if (err) {
                throw err;
            }
            var result = JSON.parse(responseText);
            if (callback) {
                if (result['success']) {
                    callback(null, result);
                } else {
                    callback(result);
                }
            }
        });
        return this;
    }
});

exports.DynamicLayer = DynamicLayer;
exports.FeatureQuery = FeatureQuery;
exports.TopoQuery = TopoQuery;
exports.SpatialFilter = SpatialFilter;

Object.defineProperty(exports, '__esModule', { value: true });

})));
