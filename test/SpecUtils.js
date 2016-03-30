function genAllTypeGeometries() {
    var center = new Z.Coordinate(118.846825, 32.046534);
    var w = 200, h = 200, r = 200;
    return [
        new Z.Marker(center),
        new maptalks.Label('test label', center),
        new Z.Circle(center, r),
        new Z.Ellipse(center, w, h),
        new Z.Rectangle(center, w, h),
        new Z.Sector(center, r, 90, 180),
        new Z.Polyline([
            {x: 121.111, y: 30.111},
            {x: 121.222, y: 30.222}
        ]),
        new maptalks.CurveLine(
                //线端点坐标数组
                [[121.48416288620015,31.24488412311837],[121.48394830947899,31.242664302121515],[121.48595460182202,31.242535881128543],[121.48695238357557,31.244838259576046],[121.48944147354125,31.24487495041167],[121.49018176322932,31.242664302121515],[121.49290688758839,31.242765204207824],[121.49358280426011,31.245040058995645],[121.49601825004554,31.245159303904526],[121.49715550666777,31.242921143583686]],
                //bezierCurveDegree指贝塞尔曲线的度, 取值为2或者3即二阶贝塞尔曲线或三阶贝塞尔曲线
                {curveType:0, arrowStyle:'classic'}),
        new maptalks.CurveLine(
                //线端点坐标数组
                [[121.48416288620015,31.24488412311837],[121.48394830947899,31.242664302121515],[121.48595460182202,31.242535881128543],[121.48695238357557,31.244838259576046],[121.48944147354125,31.24487495041167],[121.49018176322932,31.242664302121515],[121.49290688758839,31.242765204207824],[121.49358280426011,31.245040058995645],[121.49601825004554,31.245159303904526],[121.49715550666777,31.242921143583686]],
                //bezierCurveDegree指贝塞尔曲线的度, 取值为2或者3即二阶贝塞尔曲线或三阶贝塞尔曲线
                {curveType:1, arcDegree:120, arrowStyle:'classic', arrowPlacement:'point'}),
        new maptalks.CurveLine(
                //线端点坐标数组
                [[121.48416288620015,31.24488412311837],[121.48394830947899,31.242664302121515],[121.48595460182202,31.242535881128543],[121.48695238357557,31.244838259576046],[121.48944147354125,31.24487495041167],[121.49018176322932,31.242664302121515],[121.49290688758839,31.242765204207824],[121.49358280426011,31.245040058995645],[121.49601825004554,31.245159303904526],[121.49715550666777,31.242921143583686]],
                //bezierCurveDegree指贝塞尔曲线的度, 取值为2或者3即二阶贝塞尔曲线或三阶贝塞尔曲线
                {curveType:2, arrowStyle:'classic', arrowPlacement:'point'}),
        new maptalks.CurveLine(
                //线端点坐标数组
                [[121.48416288620015,31.24488412311837],[121.48394830947899,31.242664302121515],[121.48595460182202,31.242535881128543],[121.48695238357557,31.244838259576046],[121.48944147354125,31.24487495041167],[121.49018176322932,31.242664302121515],[121.49290688758839,31.242765204207824],[121.49358280426011,31.245040058995645],[121.49601825004554,31.245159303904526],[121.49715550666777,31.242921143583686]],
                //bezierCurveDegree指贝塞尔曲线的度, 取值为2或者3即二阶贝塞尔曲线或三阶贝塞尔曲线
                {curveType:3, arcDegree:120, arrowStyle:'classic', arrowPlacement:'point'}),
        new Z.Polygon([
            [
                {x: 121.111, y: 30.111},
                {x: 121.222, y: 30.222},
                {x: 121.333, y: 30.333}
            ]
        ]),
        new Z.MultiPolyline([
            [
                {x: 121.111, y: 30.111},
                {x: 121.222, y: 30.222}
            ],
            [
                {x: 121.333, y: 30.333},
                {x: 121.444, y: 30.444}
            ]
        ]),
        new Z.MultiPolygon([
            [
                [
                    {x: 121.111, y: 30.111},
                    {x: 121.222, y: 30.222},
                    {x: 121.333, y: 30.333}
                ]
            ],
            [
                [
                    {x: 121.444, y: 30.444},
                    {x: 121.555, y: 30.555},
                    {x: 121.666, y: 30.666}
                ]
            ]
        ])
    ];
    // return geometries;
}

/*exports = module.exports = {
    genAllTypeGeometries: genAllTypeGeometries
};*/

function isArray(obj) {
    if (!obj) {return false;}
    return typeof obj == 'array' || (obj.constructor !== null && obj.constructor == Array);
}

function near(val, expected, delta) {
    if (delta == null) {delta = 1e-6;}
    return val >= expected-delta && val <= expected+delta;
}

expect.Assertion.prototype.near=function(expected,delta) {
    this.assert(
        near(this.obj, expected, delta)
        , function(){ return 'expected ' + JSON.stringify(this.obj) + ' to sort of equal ' + JSON.stringify(expected) }
        , function(){ return 'expected ' + JSON.stringify(this.obj) + ' to sort of not equal ' + JSON.stringify(expected) }
        , expected);
    return this;
};

expect.Assertion.prototype.nearCoord = function(expected, delta) {
    delta = delta || 1e-6;
    var expectation;
    if (isArray(expected)) {
        expectation =
            near(this.obj[0],expected[0],delta) &&
            near(this.obj[1],expected[1],delta);
    } else {
        expectation =
            near(this.obj.x,expected.x,delta) &&
            near(this.obj.y,expected.y,delta);
    }
    this.assert(
        expectation
        , function(){ return 'expected ' + JSON.stringify(this.obj) + ' to sort of nearCoord ' + JSON.stringify(expected) }
        , function(){ return 'expected ' + JSON.stringify(this.obj) + ' to sort of not nearCoord ' + JSON.stringify(expected) }
        , expected);
    return this;
};

function eqlArray(val, expected) {
    if (val.length !== expected.length) {
        return false;
    }
    for (var i = 0; i < expected.length; i++) {
        if (isArray(expected[i])) {
            if (!eqlArray(val[i], expected[i])) {
                return false;
            }
        } else {
            if (val[i] !== expected[i]) {
                if (!near(val[i], expected[i])) {
                    return false;
                }
            }
        }
    }
    return true;
}

expect.Assertion.prototype.eqlArray = function(expected) {
    this.assert(
        eqlArray(this.obj, expected)
        , function(){ return 'expected ' + JSON.stringify(this.obj) + ' to sort of eqlArray ' + JSON.stringify(expected) }
        , function(){ return 'expected ' + JSON.stringify(this.obj) + ' to sort of not eqlArray ' + JSON.stringify(expected) }
        , expected);
    return this;
};

expect.Assertion.prototype.eqlGeoJSON = function(expected) {
    function eqlGeoJSON(val, expected) {
        if (expected.type === 'FeatureCollection') {
            var features = expected.features;
            if (val.type !== 'FeatureCollection') {
                return false;
            }
            for (var i = 0; i < features.length; i++) {
                if (!eqlGeoJSON(val.features[i], features[i])) {
                    return false;
                }
            }
            return true;
        } else if (expected.type === 'Feature') {
            if (val.type !== 'Feature') {
                return false;
            }
            return expect.eql(val.properties, expected.properties)
                && eqlGeoJSON(val.geometry, expected.geometry);
        } else if (expected.type === 'GeometryCollection') {
            if (val.type !== 'GeometryCollection') {
                return false;
            }
            var geometries = expected.geometries;
            for (var i = 0; i < geometries.length; i++) {
                if (!eqlGeoJSON(geometries[i], val.geometries[i])) {
                    return false;
                }
            }
            return true;
        } else {
            return val.type === expected.type
                && eqlArray(val.coordinates, expected.coordinates);
        }
    }
     this.assert(
        eqlGeoJSON(this.obj, expected)
        , function(){ return 'expected ' + JSON.stringify(this.obj) + ' to sort of eqlGeoJSON ' + JSON.stringify(expected) }
        , function(){ return 'expected ' + JSON.stringify(this.obj) + ' to sort of not eqlGeoJSON ' + JSON.stringify(expected) }
        , expected);
    return this;
};


/**
 * 共同的地图初始化方法
 * @param  {Coordinate} center 中心点坐标
 * @return {Object}        初始化后的容器坐标
 */
function commonSetupMap(center, baseLayer) {
    var container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);
    var option = {
        enableCartoCSS: false,
        zoom: 17,
        center: center
    };
    var map = new Z.Map(container, option);
    if (!baseLayer) {
        var tile = new Z.TileLayer('tile', {

            urlTemplate:"http://t{s}.tianditu.com/DataServer?T=vec_w&x={x}&y={y}&l={z}",
            subdomains: [1, 2, 3]
        });
        map.setBaseLayer(tile);
    } else {
        map.setBaseLayer(baseLayer);
    }
    return {
        "container":container,
        "map":map,
        "base":tile
    };
}

function removeContainer(container) {
    document.body.innerHTML = '';
}

/**
 * 共同的地图销毁方法
 */
function commonTearDownMap() {

}


var GeoSymbolTester = {
    markerSymbols : [
            {
                "marker-placement":"point", //point | line | interior
                "marker-file"   : "images/resource/marker.png",
                //设定marker-file后, 只有下面的属性起作用
                "marker-width"  : 20,
                "marker-height" : 20,
                "marker-opacity": 1,
                //两个cartocss里没有的扩展属性, 用来标注相对中心点的像素距离
                "marker-dx"     : 0, //<-------
                "marker-dy"     : 0  //<-------
            },
            {
                "marker-placement":"point", //point | line | interior

                //marker-type中定义了若干cartoCSS中没有的属性值
                "marker-type": "ellipse", //<----- ellipse | triangle | square | bar等,默认ellipse
                "marker-opacity": 1,
                "marker-fill": "#ff0000",
                "marker-fill-opacity": 1,
                "marker-line-color": "#0000ff",
                "marker-line-width": 1,
                "marker-line-opacity": 1,
                "marker-width": 30,
                "marker-height": 30,

                "marker-dx": 0,
                "marker-dy": 0
            },
            {
                "marker-placement":"point", //point | line | interior
                "marker-type": "path", //<----- ellipse | triangle | square | bar等,默认ellipse
                "marker-path" : "M129.657,71.361C129.657,75.173,128.55200000000002,78.812,126.504,81.924C125.275",
                "marker-opacity": 1,
                "marker-fill": "#ff0000",
                "marker-fill-opacity": 1,
                "marker-line-color": "#0000ff",
                "marker-line-width": 1,
                "marker-line-opacity": 1,
                "marker-width": 30,
                "marker-height": 30,

                "marker-dx": 0,
                "marker-dy": 0
            },
            {
                "text-placement"    : "point", // point | vertex | line | interior

                "text-name"         : "文本标注：[marker_name]",
                "text-face-name"    : "arial",
                "text-size"         : 12,
                "text-fill"         : "#550033",
                "text-opacity"      : 1,
                "text-halo-fill"  : "#fff",
                "text-halo-radius": 0,

                "text-dx"           : 0,
                "text-dy"           : 0,

                "text-horizontal-alignment" : "middle", //left | middle | right | auto
                "text-vertical-alignment"   : "middle",   // top | middle | bottom | auto
                "text-align"                : "left" //left | right | center | auto
            }/*,
            {
                "shield-placement"  : "point", // point | vertex | line | interior

                "shield-file"       : "images/resource/marker.png",

                "shield-name"       : "文本标注：[marker_name]",
                "shield-face-name"  : "arial",
                "shield-size"       :  12,
                "shield-fill"       : "#550033",
                "shield-opacity"    :  1,
                "shield-text-opacity": 1,
                "shield-halo-fill"  : "#fff",
                "shield-halo-radius": 0,

                "shield-dx"         :  0,
                "shield-dy"         :  0,
                "shield-text-dx"    :  0,
                "shield-text-dy"    :  0,

                "shield-horizontal-alignment"   : "middle", //left | middle | right | auto
                "shield-vertical-alignment"     : "middle",   // top | middle | bottom | auto
                "shield-justify-alignment"      : "left" //left | right | center | auto
            }*/
    ],

    lineAndFill: {
                "line-pattern-file" : "images/resource/marker.png",
                "line-color"        : "#f00",
                "line-width"        : 5,
                "line-opacity"      : 1,
                "line-join"         : "miter", //round bevel
                "line-cap"          : "round", //butt square
                "line-dasharray"    : [20, 5, 20],
                "polygon-pattern-file"  : "images/resource/marker.png",
                "polygon-fill"          : "#f00",
                "polygon-opacity"       : 1
            },

    testGeoSymbols:function(geometry, map) {
        // enable debug symbolizer
        geometry.config('debug', true);
        geometry.remove();
        var layer = new maptalks.VectorLayer("symboltest_layer_svg");
        map.addLayer(layer);
        layer.addGeometry(geometry);
        var i;
        for (i = this.markerSymbols.length - 1; i >= 0; i--) {
            geometry.setSymbol(this.markerSymbols[i]);
        }
        if (!(geometry instanceof Z.Marker) && !(geometry instanceof Z.MultiPoint)) {
            geometry.setSymbol(this.lineAndFill);
        }
        geometry.remove();
        layer = new maptalks.VectorLayer("symboltest_layer_canvas",{"render":"canvas"});
        map.addLayer(layer);
        layer.addGeometry(geometry);
        for (i = this.markerSymbols.length - 1; i >= 0; i--) {
            geometry.setSymbol(this.markerSymbols[i]);
        }
        if (!(geometry instanceof Z.Marker) && !(geometry instanceof Z.MultiPoint)) {
            geometry.setSymbol(this.lineAndFill);
        }
    }
};

/**
 * geometry事件测试类
 * testSVGEvents测试SVG类图层上的事件响应
 * testCanvasEvents测试Canvas类图层上的事件响应
 * @type {Object}
 */
var GeoEventsTester = function() {
};

GeoEventsTester.prototype = {
    //happen 支持的事件种类
    eventsToTest : 'click mousedown mouseup dblclick', //mousemove

    testSVGEvents:function(geometry, map) {
        return;
        var layer = new Z.VectorLayer('event_test_layer_svg');
        map.addLayer(layer);
        if (!this.spy) {
            this.spy = sinon.spy(this,'_eventCallBack');
        }
        var vector = geometry;
        vector.on(this.eventsToTest, this._eventCallBack);
        layer.addGeometry(vector);
        var dom = vector._getPainter().getSvgDom()[0];
        this._verifyGeometryEvents(dom);
    },

    testCanvasEvents:function(vector, map, testPoint) {
        var layer = new Z.VectorLayer('event_test_layer_canvas',{'render':'canvas'});
        if (!layer.isCanvasRender()) {
            return;
        }
        map.addLayer(layer);
        if (!this.spy) {
            this.spy = sinon.spy(this,'_eventCallBack');
        }
        vector.on(this.eventsToTest, this._eventCallBack );
        layer.addGeometry(vector);
        var point = map.coordinateToContainerPoint(testPoint);
        var dom = map._panels.mapPlatform;
        var domPosition = Z.DomUtil.getPagePosition(dom);
        point._add(domPosition);
        this._verifyGeometryEvents(dom,
            {
            'screenX':point.x,
            'screenY':point.y,
            'clientX':point.x,
            'clientY':point.y
            });
    },

    _eventCallBack:function(param) {
        expect(param).to.be.ok();
        expect(param.type).to.be.ok();
        expect(param.target).to.be.ok();
        expect(param.containerPoint).to.be.ok();
        expect(param.coordinate).to.be.ok();
        expect(param.domEvent).to.be.ok();
    },

    _verifyGeometryEvents:function(dom,options) {
        var events = this.eventsToTest.split(' ');

        for (var i=0, len=events.length;i<len;i++) {
            if (options) {
                happen[events[i]](dom,options);
            } else {
                happen[events[i]](dom);
            }
        }
        var spy = this.spy;
        expect(spy.callCount).to.be(events.length);
        // spy.reset();
    }

};
