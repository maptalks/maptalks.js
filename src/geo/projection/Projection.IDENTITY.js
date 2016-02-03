Z.Projection.IDENTITY = Z.Util.extend({}, Z.Projection.Common, {
    code : "IDENTITY",
    project:function(p){
        return p.copy();
    },
    unproject:function(p){
        return p.copy();
    }
}, Z.measurer.Identity);
