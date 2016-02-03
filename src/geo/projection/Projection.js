Z.Projection = {};

Z.Projection.Common = {
    /**
     * 计算一组坐标的投影坐标
     * @param  {[type]} points [description]
     * @return {[type]}        [description]
     */
    projectPoints:function(points) {
        return Z.Util.eachInArray(points, this, this.project);
    },

    /**
     * 计算一组投影坐标的经纬度坐标
     * @param  {[type]} points [description]
     * @return {[type]}           [description]
     */
    unprojectPoints:function(points) {
        return Z.Util.eachInArray(points, this, this.unproject);
    }
};
