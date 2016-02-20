/**
 * 图形范围类
 * @class maptalks.Extent
 * @author Maptalks Team
 */
Z.Extent =
 /**
  * @constructor
  * @param {maptalks.Coordinate} p1 坐标
  * @param {maptalks.Coordinate} p2 坐标
  * @param {maptalks.Coordinate} p3 坐标
  * @param {maptalks.Coordinate} p4 坐标
  * @returns {maptalks.Extent} extent对象
  */
function(p1,p2,p3,p4) {
    this._clazz = Z.Coordinate;
    this._initialize(p1,p2,p3,p4);
};

Z.Util.extend(Z.Extent.prototype, {
    _initialize:function(p1, p2, p3, p4) {
        this['xmin'] = null;
        this['xmax'] = null;
        this['ymin'] = null;
        this['ymax'] = null;
        if (Z.Util.isNil(p1)) {
            return;
        }
        //构造方法一: 参数都是数字
        if (Z.Util.isNumber(p1) &&
            Z.Util.isNumber(p2) &&
            Z.Util.isNumber(p3) &&
            Z.Util.isNumber(p4)) {
            this['xmin'] = Math.min(p1,p3);
            this['ymin'] = Math.min(p2,p4);
            this['xmax'] = Math.max(p1,p3);
            this['ymax'] = Math.max(p2,p4);
            return;
        } else {
             //构造方法二: 参数是两个坐标

            if (Z.Util.isNumber(p1.x) &&
                Z.Util.isNumber(p2.x) &&
                Z.Util.isNumber(p1.y) &&
                Z.Util.isNumber(p2.y)) {
                if (p1.x>p2.x) {
                    this['xmin'] = p2.x;
                    this['xmax'] = p1.x;
                } else {
                    this['xmin'] = p1.x;
                    this['xmax'] = p2.x;
                }
                if (p1.y>p2.y) {
                    this['ymin'] = p2.y;
                    this['ymax'] = p1.y;
                } else {
                    this['ymin'] = p1.y;
                    this['ymax'] = p2.y;
                }
                //构造方法三: 参数为一个对象,包含xmin, xmax, ymin, ymax四个属性
            } else if (Z.Util.isNumber(p1['xmin']) &&
                    Z.Util.isNumber(p1['xmax']) &&
                    Z.Util.isNumber(p1['ymin']) &&
                    Z.Util.isNumber(p1['ymax']))   {
                    this['xmin'] = p1['xmin'];
                    this['ymin'] = p1['ymin'];
                    this['xmax'] = p1['xmax'];
                    this['ymax'] = p1['ymax'];
            }
        }
    },

    round:function() {
        return new Z.Extent(Z.Util.round(this['xmin']), Z.Util.round(this['ymin']),
            Z.Util.round(this['xmax']),Z.Util.round(this['ymax']));
    },

    _round:function() {
        this['xmin'] = Z.Util.round(this['xmin']);
        this['ymin'] = Z.Util.round(this['ymin']);
        this['xmax'] = Z.Util.round(this['xmax']);
        this['ymax'] = Z.Util.round(this['ymax']);
        return this;
    },

    getCenter:function() {
        return new this._clazz((this['xmin']+this['xmax'])/2, (this['ymin']+this['ymax'])/2);
    },

    getSize:function() {
        return new Z.Size(this.getWidth(), this.getHeight());
    },

    getWidth:function() {
        return this['xmax'] - this['xmin'];
    },

    getHeight:function() {
        return this['ymax'] - this['ymin'];
    },

    getMin:function() {
        return new this._clazz(this['xmin'],this['ymin']);
    },

    getMax:function() {
        return new this._clazz(this['xmax'],this['ymax']);
    },

    /**
     * 将extent对象转化为json对象
     * @return {Object} jsonObject
     */
    toJSON:function() {
        return {
            'xmin':this['xmin'],
            'ymin':this['ymin'],
            'xmax':this['xmax'],
            'ymax':this['ymax']
        };
    },


    /**
     * 判断extent是否有效
     * @return {Boolean} true：表明有效
     */
    isValid:function() {
        return Z.Util.isNumber(this['xmin']) &&
                Z.Util.isNumber(this['ymin']) &&
                Z.Util.isNumber(this['xmax']) &&
                Z.Util.isNumber(this['ymax']);
    },


    /**
     * 比较两个Extent是否相等
     * @param  {maptalks.Extent}  ext2 比较的extent
     * @return {Boolean} true：表明两个extent相等
     */
    equals:function(ext2) {
        return (this['xmin'] === ext2['xmin'] &&
            this['xmax'] === ext2['xmax'] &&
            this['ymin'] === ext2['ymin'] &&
            this['ymax'] === ext2['ymax']);
    },

    /**
     * 两个Extent是否相交
     * @param  {maptalks.Extent}  ext2 比较的extent
     * @return {Boolean} true：表明两个extent相交
     */
    intersects:function(ext2) {
        var rxmin = Math.max(this['xmin'], ext2['xmin']);
        var rymin = Math.max(this['ymin'], ext2['ymin']);
        var rxmax = Math.min(this['xmax'], ext2['xmax']);
        var rymax = Math.min(this['ymax'], ext2['ymax']);
        var intersects = !((rxmin > rxmax) || (rymin > rymax));
        return intersects;
    },

    /**
     * 判断坐标是否在extent中
     * @param  {maptalks.Coordinate} coordinate
     * @returns {Boolean} true：坐标在extent中
     */
    contains: function(coordinate) {
        var x, y;
        var c = new this._clazz(coordinate);
        x = c.x;
        y = c.y;
        return (x >= this.xmin) &&
            (x <= this.xmax) &&
            (y >= this.ymin) &&
            (y <= this.ymax);
    },

    __combine:function(extent) {
        var xmin = this['xmin'];
        if (!Z.Util.isNumber(xmin)) {
            xmin = extent['xmin'];
        } else if (Z.Util.isNumber(extent['xmin'])) {
            if (xmin>extent['xmin']) {
                xmin = extent['xmin'];
            }
        }

        var xmax = this['xmax'];
        if (!Z.Util.isNumber(xmax)) {
            xmax = extent['xmax'];
        } else if (Z.Util.isNumber(extent['xmax'])) {
            if (xmax<extent['xmax']) {
                xmax = extent['xmax'];
            }
        }

        var ymin = this['ymin'];
        if (!Z.Util.isNumber(ymin)) {
            ymin = extent['ymin'];
        } else if (Z.Util.isNumber(extent['ymin'])) {
            if (ymin>extent['ymin']) {
                ymin = extent['ymin'];
            }
        }

        var ymax = this['ymax'];
        if (!Z.Util.isNumber(ymax)) {
            ymax = extent['ymax'];
        } else if (Z.Util.isNumber(extent['ymax'])) {
            if (ymax<extent['ymax']) {
                ymax = extent['ymax'];
            }
        }
        return [xmin, ymin, xmax, ymax];
    },

    _combine:function(extent) {
        if (!extent) {
            return this;
        }
        var ext = this.__combine(extent);
        this['xmin'] = ext[0];
        this['ymin'] = ext[1];
        this['xmax'] = ext[2];
        this['ymax'] = ext[3];
        return this;
    },

    /**
     * 合并两个extent
     * @param  {maptalks.Extent} ext1
     * @param  {maptalks.Extent} ext2
     * @returns {maptalks.Extent} 合并后的extent
     */
    combine:function(extent) {
        if (!extent) {
            return this;
        }
        var ext = this.__combine(extent);
        return new Z.Extent(ext[0],ext[1],ext[2],ext[3]);
    },

    intersection:function(extent) {
        if (!this.intersects(extent)) {
            return null;
        }
        return new Z.Extent(Math.max(this['xmin'], extent['xmin']),Math.max(this['ymin'], extent['ymin']),
            Math.min(this['xmax'], extent['xmax']),Math.min(this['ymax'], extent['ymax'])
            );
    },

    /**
     * 扩大Extent
     * @param  {maptalks.Extent} ext 初始extent
     * @param  {maptalks.Extent} distance  像素距离
     * @returns {maptalks.Extent} 扩大后的extent
     */
    expand:function(distance) {
        if (distance instanceof Z.Size) {
            return new Z.Extent(this['xmin']-distance['width'], this['ymin']-distance['height'],this['xmax']+distance['width'],this['ymax']+distance['height']);
        } else {
            return new Z.Extent(this['xmin']-distance, this['ymin']-distance,this['xmax']+distance,this['ymax']+distance);
        }
    },

    _expand:function(distance) {
        if (distance instanceof Z.Size) {
            this['xmin'] -= distance['width'];
            this['ymin'] -= distance['height'];
            this['xmax'] += distance['width'];
            this['ymax'] += distance['height'];
        } else {
            this['xmin'] -= distance;
            this['ymin'] -= distance;
            this['xmax'] += distance;
            this['ymax'] += distance;
        }
        return this;
    },

    toArray:function() {
        var xmin = this['xmin'],
            ymin = this['ymin'],
            xmax = this['xmax'],
            ymax = this['ymax'];
        return return [
                new this._clazz([xmin, ymax]), new this._clazz([xmax, ymax]),
                new this._clazz([xmax, ymin]), new this._clazz([xmin, ymin]),
                new this._clazz([xmin, ymax])
            ];
    }
});
