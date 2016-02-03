/**
 * 图形中心点类
 * @class maptalks.Geometry.Center
 * @author Maptalks Team
 */
Z.Geometry.Center = {
    //计算Geometry中心点在地图容器中的相对坐标
    _getCenterViewPoint:function() {
        var pcenter = this._getPrjCoordinates();
        if (!pcenter) {return null;}
        var map=this.getMap();
        if (!map) {
            return null;
        }
        return map._transformToViewPoint(pcenter);
    },

    /**
     * 返回Geometry的坐标
     * @return {Coordinate} 图形坐标
     * @expose
     */
    getCoordinates:function() {
        return this._coordinates;
    },

    /**
     * 设置新的坐标
     * @param {Coordinate} coordinates 新的坐标
     */
    setCoordinates:function(coordinates) {
        var center = new Z.Coordinate(coordinates);
        this._coordinates = center;
        if (!this.getMap()) {
            this._onPositionChanged();
            return this;
        }
        var projection = this._getProjection();
        this._setPrjCoordinates(projection.project(this._coordinates));
        return this;
    },

    _getPrjCoordinates:function() {
        var projection = this._getProjection();
        if (!projection) {return null;}
        if (!this._pcenter) {
            if (this._coordinates) {
                this._pcenter = projection.project(this._coordinates);
            }
        }
        return this._pcenter;
    },

    //设置投影坐标
    _setPrjCoordinates:function(pcenter) {
        this._pcenter=pcenter;
        this._onPositionChanged();
    },

    //修改投影坐标后调用该方法更新经纬度坐标缓存.
    _updateCache:function() {
        delete this._extent;
        var projection = this._getProjection();
        if (this._pcenter && projection) {
            this._coordinates = projection.unproject(this._pcenter);
        }
    },

    _clearProjection:function() {
        this._pcenter = null;
    },

    _computeCenter:function() {
        return this._coordinates;
    }
};
