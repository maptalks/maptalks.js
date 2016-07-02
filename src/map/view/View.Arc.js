(function () {
    function parse(arcConf) {
        var version=arcConf['currentVersion'];
        var tileInfo=arcConf['tileInfo'],
            tileSize = {'width' : tileInfo['cols'], 'height' : tileInfo['rows']},
            resolutions = [],
            lods = tileInfo["lods"];
        for (var i = 0, len = lods.length; i < len; i++) {
            resolutions.push(lods[i]['resolution']);
        }
        var maxZoom = resolutions.length-1,
            minZoom = 0,
            fullExtent = arcConf['fullExtent'],

            origin=tileInfo['origin'],
            tileSystem = [1, -1, origin['x'], origin['y']];

        return {
            'view' : {
                'resolutions' : resolutions,
                'fullExtent' : fullExtent
            },
            'tileSystem' : tileSystem,
            'tileSize' : tileSize
        };
    }

    Z.View.loadArcgis = function (url, cb, context) {
        if (Z.Util.isString(url)) {
            maptalks.Ajax.getJSON(url, function (err, json) {
                if (err) {
                    if (context) {
                        cb.call(context, err)
                    } else {
                        cb(err);
                    }
                    return;
                }
                var view = parse(json);
                if (context) {
                    cb.call(context, null, view)
                } else {
                    cb(null, view);
                }
            });
        } else {
            var view = parse(url);
            if (context) {
                cb.call(context, null, view)
            } else {
                cb(null, view);
            }

        }
        return this;
    }

})();
