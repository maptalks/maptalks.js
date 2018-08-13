if (maptalks.Browser.ie) {
    // change marker's default symbol to on IE due to the Security Error.
    maptalks.Marker.prototype.options.symbol = {
        'markerType' : 'ellipse',
        'markerFill' : '#0ff',
        'markerWidth' : 20,
        'markerHeight' : 20
    };
}


/*eslint-disable no-unused-vars */
function GEN_GEOMETRIES_OF_ALL_TYPES() {
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var w = 200, h = 200, r = 200;
    return [
        new maptalks.Marker(center),
        new maptalks.Label('■■■■■■■■■', center),
        new maptalks.TextBox('test textbox', center, 100, 50),
        new maptalks.Circle(center, r),
        new maptalks.Ellipse(center, w, h),
        new maptalks.Rectangle(center, w, h),
        new maptalks.Sector(center, r, 90, 180),
        new maptalks.LineString([
            { x: 121.111, y: 30.111 },
            { x: 121.222, y: 30.222 }
        ]),
        new maptalks.ArcCurve(
            //线端点坐标数组
            [[121.48416288620015, 31.24488412311837], [121.48394830947899, 31.242664302121515], [121.48595460182202, 31.242535881128543], [121.48695238357557, 31.244838259576046], [121.48944147354125, 31.24487495041167], [121.49018176322932, 31.242664302121515], [121.49290688758839, 31.242765204207824], [121.49358280426011, 31.245040058995645], [121.49601825004554, 31.245159303904526], [121.49715550666777, 31.242921143583686]],
            //bezierCurveDegree指贝塞尔曲线的度, 取值为2或者3即二阶贝塞尔曲线或三阶贝塞尔曲线
            { arcDegree:120, arrowStyle:'classic', arrowPlacement:'point' }),
        new maptalks.QuadBezierCurve(
            //线端点坐标数组
            [[121.48416288620015, 31.24488412311837], [121.48394830947899, 31.242664302121515], [121.48595460182202, 31.242535881128543], [121.48695238357557, 31.244838259576046], [121.48944147354125, 31.24487495041167], [121.49018176322932, 31.242664302121515], [121.49290688758839, 31.242765204207824], [121.49358280426011, 31.245040058995645], [121.49601825004554, 31.245159303904526], [121.49715550666777, 31.242921143583686]],
            //bezierCurveDegree指贝塞尔曲线的度, 取值为2或者3即二阶贝塞尔曲线或三阶贝塞尔曲线
            { arrowStyle:'classic', arrowPlacement:'point' }),
        new maptalks.CubicBezierCurve(
            //线端点坐标数组
            [[121.48416288620015, 31.24488412311837], [121.48394830947899, 31.242664302121515], [121.48595460182202, 31.242535881128543], [121.48695238357557, 31.244838259576046], [121.48944147354125, 31.24487495041167], [121.49018176322932, 31.242664302121515], [121.49290688758839, 31.242765204207824], [121.49358280426011, 31.245040058995645], [121.49601825004554, 31.245159303904526], [121.49715550666777, 31.242921143583686]],
            //bezierCurveDegree指贝塞尔曲线的度, 取值为2或者3即二阶贝塞尔曲线或三阶贝塞尔曲线
            { arrowStyle:'classic', arrowPlacement:'point' }),
        new maptalks.Polygon([
            [
                { x: 121.111, y: 30.111 },
                { x: 122.222, y: 30.111 },
                { x: 122.222, y: 30.333 },
                { x: 121.111, y: 30.333 }
            ]
        ]),
        new maptalks.MultiLineString([
            [
                { x: 121.111, y: 30.111 },
                { x: 121.222, y: 30.222 }
            ],
            [
                { x: 121.333, y: 30.333 },
                { x: 121.444, y: 30.444 }
            ]
        ]),
        new maptalks.MultiPolygon([
            [
                [
                    { x: 121.111, y: 30.111 },
                    { x: 121.222, y: 30.222 },
                    { x: 121.333, y: 30.333 }
                ]
            ],
            [
                [
                    { x: 121.444, y: 30.444 },
                    { x: 121.555, y: 30.555 },
                    { x: 121.666, y: 30.666 }
                ]
            ]
        ])
    ];
    // return geometries;
}

/**
 * Common map creation
 * @param  {Coordinate} center
 * @return {Object}
 */
function COMMON_CREATE_MAP(center, baseLayer, options) {
    var container = document.createElement('div');
    container.id = 'test_container';
    container.style.width = (options && options.width || 80) + 'px';
    container.style.height = (options && options.height || 60) + 'px';
    document.body.appendChild(container);
    var option = {
        zoomAnimationDuration : 50,
        zoom: 17,
        center: center,
        // centerCross : true
    };
    if (options) {
        delete options.width;
        delete options.height;
        for (var p in options) {
            if (options.hasOwnProperty(p)) {
                option[p] = options[p];
            }
        }
    }
    if (baseLayer) {
        option.baseLayer = baseLayer;
    }
    var map = new maptalks.Map(container, option);
    return {
        'container':container,
        'map':map
    };
}

function REMOVE_CONTAINER() {
    document.body.innerHTML = '';
}

var TILE_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAIAAAD9iXMrAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAPSURBVChTYxgFo4CBgQEAAggAAWc5B7gAAAAASUVORK5CYII=';

var COMMON_SYMBOL_TESTOR = {
    markerSymbols : [
        {
            'markerPlacement':'point', //point | line | interior
            'markerFile'   : 'images/control/2.png',
            'markerRotation' : 30,
            //设定marker-file后, 只有下面的属性起作用
            'markerWidth'  : 20,
            'markerHeight' : 20,
            'markerOpacity': 1,
            //两个cartocss里没有的扩展属性, 用来标注相对中心点的像素距离
            'markerDx'     : 0, //<-------
            'markerDy'     : 0  //<-------
        },
        {
            'markerPlacement':'point', //point | line | interior
            'markerRotation' : 30,
            //marker-type中定义了若干cartoCSS中没有的属性值
            'markerType': 'ellipse', //<----- ellipse | triangle | square | bar等,默认ellipse
            'markerOpacity': 1,
            'markerFill': '#ff0000',
            'markerFillOpacity': 1,
            'markerLineColor': '#0000ff',
            'markerLineWidth': 1,
            'markerLineOpacity': 1,
            'markerWidth': 30,
            'markerHeight': 30,

            'markerDx': 0,
            'markerDy': 0
        },
        {
            'markerPlacement':'line', //point | line | interior

            //marker-type中定义了若干cartoCSS中没有的属性值
            'markerType': 'ellipse', //<----- ellipse | triangle | square | bar等,默认ellipse
            'markerOpacity': 1,
            'markerFill': '#ff0000',
            'markerFillOpacity': 1,
            'markerLineColor': '#0000ff',
            'markerLineWidth': 1,
            'markerLineOpacity': 1,
            'markerWidth': 30,
            'markerHeight': 30,

            'markerDx': 0,
            'markerDy': 0
        },
        {
            'markerPlacement':'point', //point | line | interior
            'markerType': 'path', //<----- ellipse | triangle | square | bar等,默认ellipse
            'markerPath' : 'M129.657,71.361C129.657,75.173,128.55200000000002,78.812,126.504,81.924C125.275',
            'markerOpacity': 1,
            'markerFill': '#ff0000',
            'markerFillOpacity': 1,
            'markerLineColor': '#0000ff',
            'markerLineWidth': 1,
            'markerLineOpacity': 1,
            'markerWidth': 30,
            'markerHeight': 30,

            'markerDx': 0,
            'markerDy': 0
        },
        {
            'textPlacement'    : 'point', // point | vertex | line | interior
            'textRotation' : 30,
            'textName'         : '文本标注：[marker_name]',
            'textFaceName'    : 'arial',
            'textSize'         : 12,
            'textFill'         : '#550033',
            'textOpacity'      : 1,
            'textHaloFill'    : '#fff',
            'textHaloRadius'  : 5,
            'textHaloOpacity' : 0.5,

            'textDx'           : 0,
            'textDy'           : 0,

            'textHorizontalAlignment' : 'middle', //left | middle | right | auto
            'textVerticalAlignment'   : 'middle',   // top | middle | bottom | auto
            'textAlign'                : 'left' //left | right | center | auto
        }
    ],

    lineAndFill: {
        'linePatternFile' : 'url(images/control/2.png)',
        // "lineColor"        : "#f00",
        'lineWidth'        : 5,
        'lineOpacity'      : 1,
        'lineJoin'         : 'miter', //round bevel
        'lineCap'          : 'round', //butt square
        'lineDasharray'    : [20, 5, 20],
        'polygonPatternFile'  : 'url(images/control/2.png)',
        'polygonFill'          : '#f00',
        'polygonOpacity'       : 1
    },

    testGeoSymbols:function (geometry, map, done) {
        var counter = 0;
        function getLayer(id) {
            counter++;
            var layer = map.getLayer(id) || new maptalks.VectorLayer(id, { 'debug' : true }).addTo(map);
            layer.on('layerload', onLayerLoad);
            return layer;
        }
        function onLayerLoad() {
            counter--;
            if (counter === 0) {
                done();
            }
        }
        for (var i = this.markerSymbols.length - 1; i >= 0; i--) {
            geometry.copy().setSymbol(this.markerSymbols[i]).addTo(getLayer('symbol_test_' + i));
        }
        if (!(geometry instanceof maptalks.Marker) && !(geometry instanceof maptalks.MultiPoint)) {
            geometry.copy().setSymbol(this.lineAndFill).addTo(getLayer('symbol_test_linefill'));
        }
        // // enable debug symbolizer
        // geometry.config('debug', true);
        // geometry.remove();
        // var layer = map.getLayer("symboltest_layer_svg") || new maptalks.VectorLayer("symboltest_layer_svg").addTo(map);
        // layer.config('drawImmediate' , true);
        // // map.addLayer(layer);
        // layer.addGeometry(geometry);
        // var i;
        // for (i = this.markerSymbols.length - 1; i >= 0; i--) {
        //     geometry.setSymbol(this.markerSymbols[i]);
        // }
        // if (!(geometry instanceof maptalks.Marker) && !(geometry instanceof maptalks.MultiPoint)) {
        //     geometry.setSymbol(this.lineAndFill);
        // }
        // geometry.remove();
        // layer = map.getLayer("symboltest_layer_canvas") || new maptalks.VectorLayer("symboltest_layer_canvas",{"render":"canvas"}).addTo(map);
        // layer.config('drawImmediate' , true);
        // // map.addLayer(layer);
        // layer.addGeometry(geometry);
        // for (i = this.markerSymbols.length - 1; i >= 0; i--) {
        //     geometry.setSymbol(this.markerSymbols[i]);
        // }
        // if (!(geometry instanceof maptalks.Marker) && !(geometry instanceof maptalks.MultiPoint)) {
        //     geometry.setSymbol(this.lineAndFill);
        // }
    }
};

/**
 * Tester for geometry events
 * @type {Object}
 */
var COMMON_GEOEVENTS_TESTOR = function () {
};

COMMON_GEOEVENTS_TESTOR.prototype = {
    eventsToTest : 'click mousedown mouseup dblclick', //mousemove

    testCanvasEvents:function (vector, map, testPoint) {
        var layer = new maptalks.VectorLayer('event_test_layer_canvas', { 'render':'canvas' });
        if (!layer.isCanvasRender()) {
            return;
        }
        map.addLayer(layer);
        if (!this.spy) {
            this.spy = sinon.spy(this, '_eventCallBack');
        }
        vector.on(this.eventsToTest, this._eventCallBack);
        layer.addGeometry(vector);
        var point = map.coordinateToContainerPoint(testPoint);
        var dom = map._panels.front;
        var domPosition = GET_PAGE_POSITION(dom);
        point._add(domPosition);
        this._verifyGeometryEvents(dom,
            {
                'screenX':point.x,
                'screenY':point.y,
                'clientX':point.x,
                'clientY':point.y
            });
    },

    _eventCallBack:function (param) {
        expect(param).to.be.ok();
        expect(param.type).to.be.ok();
        expect(param.target).to.be.ok();
        expect(param.containerPoint).to.be.ok();
        expect(param.coordinate).to.be.ok();
        expect(param.domEvent).to.be.ok();
        expect(param.point2d).to.be.ok();
    },

    _verifyGeometryEvents:function (dom, options) {
        var events = this.eventsToTest.split(' ');

        for (var i = 0, len = events.length; i < len; i++) {
            if (options) {
                happen[events[i]](dom, options);
            } else {
                happen[events[i]](dom);
            }
        }
        var spy = this.spy;
        expect(spy.callCount).to.be(events.length);
        // spy.reset();
    }

};

var COMMON_GET_MAP_COLOR = function (map, x, y) {
    return  map._getRenderer().canvas.getContext('2d').getImageData(x, y, 1, 1).data;
};

function GET_PAGE_POSITION(obj) {
    var docEl = document.documentElement;
    var rect = obj.getBoundingClientRect();
    return new maptalks.Point(rect['left'] + docEl['scrollLeft'], rect['top'] + docEl['scrollTop']);
}
/*eslint-enable no-unused-vars */
