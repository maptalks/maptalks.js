/**
 * 坐标类
 * @class maptalks.Coordinate
 * @author Maptalks Team
 */
Z.Coordinate = function(x, y) {
    if (!Z.Util.isNil(x) && !Z.Util.isNil(y)) {
        this.x = Z.Util.isNumber(x)?x:parseFloat(x);
        this.y = Z.Util.isNumber(y)?y:parseFloat(y);
    } else if (Z.Util.isArray(x)) {
        //数组
        this.x = Z.Util.isNumber(x[0])?x[0]:parseFloat(x[0]);
        this.y = Z.Util.isNumber(x[1])?x[1]:parseFloat(x[1]);
    } else if (!Z.Util.isNil(x['x']) && !Z.Util.isNil(x['y'])) {
        //对象
        this.x = Z.Util.isNumber(x['x'])?x['x']:parseFloat(x['x']);
        this.y = Z.Util.isNumber(x['y'])?x['y']:parseFloat(x['y']);
    }
    if (this.isNaN()) {
        throw new Error('coordinate is NaN');
    }
};

Z.Util.extend(Z.Coordinate.prototype,{
    _add: function(d) {
        this.x += d.x;
        this.y += d.y;
        return this;
    },

    add:function(d) {
        return new Z.Coordinate(this.x+d.x, this.y+d.y);
    },

    copy:function() {
        return new Z.Coordinate(this.x, this.y);
    },

    _substract: function(d) {
        this.x -= d.x;
        this.y -= d.y;
        return this;
    },

    substract:function(d) {
        return new Z.Coordinate(this.x-d.x, this.y-d.y);
    },
    multi: function(ratio) {
        return new Z.Coordinate(this.x*ratio, this.y*ratio);
    },
    /**
     * 比较两个坐标是否相等
     * @param {maptalks.Coordinate} c1
     * @param {maptalks.Coordinate} c1
     * @return {Boolean} true：坐标相等
     */
    equals:function(c2) {
        if (!Z.Util.isCoordinate(c2)) {
            return false;
        }
        return this.x === c2.x && this.y === c2.y;
    },
    isNaN:function() {
        return isNaN(this.x) || isNaN(this.y);
    },
    toArray:function() {
        return [this.x, this.y];
    }
});
