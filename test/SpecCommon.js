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
                {x: 122.222, y: 30.111},
                {x: 122.222, y: 30.333},
                {x: 121.111, y: 30.333}
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
    if (baseLayer === undefined) {
        var tile = new Z.TileLayer('tile', {
            urlTemplate:"/resources/tile.png",
            subdomains: [1, 2, 3]
        });
        map.setBaseLayer(tile);
    } else if (baseLayer) {
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
                "markerPlacement":"point", //point | line | interior
                "markerFile"   : "images/control/2.png",
                //设定marker-file后, 只有下面的属性起作用
                "markerWidth"  : 20,
                "markerHeight" : 20,
                "markerOpacity": 1,
                //两个cartocss里没有的扩展属性, 用来标注相对中心点的像素距离
                "markerDx"     : 0, //<-------
                "markerDy"     : 0  //<-------
            },
            {
                "markerPlacement":"point", //point | line | interior

                //marker-type中定义了若干cartoCSS中没有的属性值
                "markerType": "ellipse", //<----- ellipse | triangle | square | bar等,默认ellipse
                "markerOpacity": 1,
                "markerFill": "#ff0000",
                "markerFillOpacity": 1,
                "markerLineColor": "#0000ff",
                "markerLineWidth": 1,
                "markerLineOpacity": 1,
                "markerWidth": 30,
                "markerHeight": 30,

                "markerDx": 0,
                "markerDy": 0
            },
            {
                "markerPlacement":"point", //point | line | interior
                "markerType": "path", //<----- ellipse | triangle | square | bar等,默认ellipse
                "markerPath" : "M129.657,71.361C129.657,75.173,128.55200000000002,78.812,126.504,81.924C125.275",
                "markerOpacity": 1,
                "markerFill": "#ff0000",
                "markerFillOpacity": 1,
                "markerLineColor": "#0000ff",
                "markerLineWidth": 1,
                "markerLineOpacity": 1,
                "markerWidth": 30,
                "markerHeight": 30,

                "markerDx": 0,
                "markerDy": 0
            },
            {
                "textPlacement"    : "point", // point | vertex | line | interior

                "textName"         : "文本标注：[marker_name]",
                "textFaceName"    : "arial",
                "textSize"         : 12,
                "textFill"         : "#550033",
                "textOpacity"      : 1,
                "textHaloFill"  : "#fff",
                "textHaloRadius": 5,

                "textDx"           : 0,
                "textDy"           : 0,

                "textHorizontalAlignment" : "middle", //left | middle | right | auto
                "textVerticalAlignment"   : "middle",   // top | middle | bottom | auto
                "textAlign"                : "left" //left | right | center | auto
            }/*,
            {
                "shield-placement"  : "point", // point | vertex | line | interior

                "shield-file"       : "images/control/2.png",

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
                "linePatternFile" : "url(images/control/2.png)",
                // "lineColor"        : "#f00",
                "lineWidth"        : 5,
                "lineOpacity"      : 1,
                "lineJoin"         : "miter", //round bevel
                "lineCap"          : "round", //butt square
                "lineDasharray"    : [20, 5, 20],
                "polygonPatternFile"  : "url(images/control/2.png)",
                "polygonFill"          : "#f00",
                "polygonOpacity"       : 1
            },

    testGeoSymbols:function(geometry, map) {
        // enable debug symbolizer
        geometry.config('debug', true);
        geometry.remove();
        var layer = new maptalks.VectorLayer("symboltest_layer_svg");
        layer.config('drawImmediate' , true);
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
        layer.config('drawImmediate' , true);
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
