/**
 * A Layer to render with THREE.JS (http://threejs.org), the most popular library for WebGL. <br>
 *
 * @classdesc
 * A layer to render with THREE.JS
 * @example
 *  var layer = new maptalks.ThreeLayer('three');
 *
 *  layer.prepareToDraw = function (context) {
 *      var size = map.getSize();
 *      return [size.width, size.height]
 *  };
 *
 *  layer.draw = function (context, width, height) {
 *      context.fillStyle = "#f00";
 *      context.fillRect(0, 0, w, h);
 *  };
 *  layer.addTo(map);
 * @class
 * @category layer
 * @extends {maptalks.Layer}
 * @param {String|Number} id - layer's id
 * @param {Object} options - options defined in [options]{@link maptalks.ThreeLayer#options}
 */
maptalks.ThreeLayer = maptalks.CanvasLayer.extend(/** @lends maptalks.ThreeLayer.prototype */{
    options: {
        'renderWhenPanning' : true,
        'camera'   : 'perspective', //orth, perspective
        'renderer' : 'webgl'
    },

    coordinateToVector: function (coordinate) {
        var map = this.getMap();
        if (!map) {
            return null;
        }
        return map.coordinateToPoint(coordinate, map.getMaxZoom());
    },

    distanceToVector: function (w, h) {
        var map = this.getMap();
        var scale = map.getScale();
        var size = map.distanceToPixel(w, h)._multi(scale);
        return new THREE.Vector2(size.width, size.height);
    },

    toShape: function (polygon) {
        if (!polygon) {
            return null;
        }
        var me = this;
        if (polygon instanceof maptalks.MultiPolygon) {
            return polygon.getGeometries().map(function (c) {
                return me.toShape(c);
            });
        }
        var center = polygon.getCenter();
        var centerPt = this.coordinateToVector(center);
        var shell = polygon.getShell();
        var outer = shell.map(function (c) {
            var p = me.coordinateToVector(c)._substract(centerPt);
            return new THREE.Vector2(p.x, p.y);
        });
        var shape = new THREE.Shape(outer);
        var holes = polygon.getHoles();

        if (holes && holes.length > 0) {
            shape.holes = holes.map(function (item) {
                var pts = item.map(function (c) {
                    var p = me.coordinateToVector(c)._substract(centerPt);
                    return new THREE.Vector2(p.x, p.y);
                });
                return new THREE.Shape(pts);
            });
        }

        return shape;
    },

    toExtrudeGeometry: function (polygon, amount, material) {
        if (!polygon) {
            return null;
        }
        var me = this;
        if (polygon instanceof maptalks.MultiPolygon) {
            return polygon.getGeometries().map(function (c) {
                return me.toExtrudeGeometry(c, amount, material);
            });
        }
        var shape = this.toShape(polygon);
        var center = this.coordinateToVector(polygon.getCenter());
        amount = this.distanceToVector(amount, amount).x;
        //{ amount: extrudeH, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };
        var geom = new THREE.ExtrudeGeometry(shape, { 'amount': amount, 'bevelEnabled': true });
        var mesh = new THREE.Mesh(geom, material);
        // mesh.translateZ(-amount - 1);
        // mesh.translateX(center.x);
        // mesh.translateY(center.y);
        mesh.position.set(center.x, center.y, -amount);
        return mesh;
    },

    lookAt: function (vector) {
        var renderer = this._getRenderer();
        if (renderer) {
            renderer.context.lookAt(vector);
        }
        return this;
    },

    getCamera: function () {
        var renderer = this._getRenderer();
        if (renderer) {
            return renderer.camera;
        }
        return null;
    },

    getScene: function () {
        var renderer = this._getRenderer();
        if (renderer) {
            return renderer.scene;
        }
        return null;
    },

    renderScene: function () {
        var renderer = this._getRenderer();
        if (renderer) {
            return renderer.renderScene();
        }
        return this;
    },

    getThreeRenderer: function () {
        var renderer = this._getRenderer();
        if (renderer) {
            return renderer.context;
        }
        return null;
    }
});

(function () {

    var ThreeRenderer = maptalks.CanvasLayer.getRendererClass('canvas').extend({
        initialize: function (layer) {
            this.layer = layer;
        },

        hitDetect: function () {
            return false;
        },

        createCanvas: function () {
            if (this.canvas) {
                return;
            }
            var map = this.getMap();
            var size = map.getSize();
            var r = maptalks.Browser.retina ? 2 : 1;
            this.canvas = maptalks.Canvas.createCanvas(r * size['width'], r * size['height']);
            var renderer = this.layer.options['renderer'];
            var gl;
            if (renderer === 'webgl') {
                gl = new THREE.WebGLRenderer({
                    'canvas' : this.canvas,
                    'alpha' : true,
                    'preserveDrawingBuffer' : true
                });
                gl.autoClear = false;
                gl.clear();
            } else if (renderer === 'canvas') {
                gl = new THREE.CanvasRenderer({
                    'canvas' : this.canvas,
                    'alpha' : true
                });
            }
            gl.setSize(this.canvas.width, this.canvas.height);
            gl.setClearColor(new THREE.Color(1, 1, 1), 0);
            gl.canvas = this.canvas;
            this.context = gl;
            var maxScale = map.getScale(map.getMinZoom()) / map.getScale(map.getMaxZoom());
            // scene
            var scene = this.scene = new THREE.Scene();
            //TODO can be orth or perspective camera
            var camera = this.camera =  new THREE.PerspectiveCamera(90, size.width / size.height, 1, maxScale * 10000);
            this.onCanvasCreate();
            this.layer.onCanvasCreate(this.context, this.scene, this.camera);
            scene.add(camera);
        },

        resizeCanvas: function (canvasSize) {
            if (!this.canvas) {
                return;
            }
            var size;
            if (!canvasSize) {
                var map = this.getMap();
                size = map.getSize();
            } else {
                size = canvasSize;
            }
            var r = maptalks.Browser.retina ? 2 : 1;
            //retina support
            this.canvas.height = r * size['height'];
            this.canvas.width = r * size['width'];
            this.camera.aspect = this.canvas.width / this.canvas.height;
            this.camera.updateProjectionMatrix();
            this.context.setSize(this.canvas.width, this.canvas.height);
        },

        clearCanvas: function () {
            if (!this.canvas) {
                return;
            }

            this.context.clear();
        },

        prepareCanvas: function () {
            if (!this.canvas) {
                this.createCanvas();
            } else {
                this.clearCanvas();
            }
            this.layer.fire('renderstart', { 'context' : this.context });
            return null;
        },

        draw: function () {
            this.prepareCanvas();
            if (!this._predrawed) {
                this._drawContext = this.layer.prepareToDraw(this.context, this.scene, this. camera);
                if (!this._drawContext) {
                    this._drawContext = [];
                }
                if (!Array.isArray(this._drawContext)) {
                    this._drawContext = [this._drawContext];
                }
                this._predrawed = true;
            }
            this._drawLayer();
        },

        _drawLayer: function () {
            this.layer.draw.apply(this.layer, [this.context, this.scene, this.camera].concat(this._drawContext));
            this.renderScene();
            this._play();
        },

        renderScene: function () {
            this._locateCamera();
            this.context.clear();
            this.context.render(this.scene, this.camera);
            this.completeRender();
        },

        remove: function () {
            delete this._drawContext;
            maptalks.renderer.Canvas.prototype.remove.call(this);
        },

        onZoomStart: function (param) {
            this.layer.onZoomStart(this.scene, this.camera, param);
            maptalks.renderer.Canvas.prototype.onZoomStart.call(this);
        },

        onZoomEnd: function (param) {
            this.layer.onZoomEnd(this.scene, this.camera, param);
            maptalks.renderer.Canvas.prototype.onZoomEnd.call(this);
        },

        onMoveStart: function (param) {
            this.layer.onMoveStart(this.scene, this.camera, param);
            maptalks.renderer.Canvas.prototype.onMoveStart.call(this);
        },

        onMoving: function () {
            if (this.layer.options['renderWhenPanning']) {
                this.prepareRender();
                this.draw();
            }
        },

        onMoveEnd: function (param) {
            this.layer.onMoveEnd(this.scene, this.camera, param);
            maptalks.renderer.Canvas.prototype.onMoveEnd.call(this);
        },

        onResize: function (param) {
            this.layer.onResize(this.scene, this.camera, param);
            maptalks.renderer.Canvas.prototype.onResize.call(this);
        },

        _locateCamera: function () {
            var map = this.getMap();
            var fullExtent = map.getFullExtent();
            var size = map.getSize();
            var scale = map.getScale();
            var camera = this.camera;
            var center = map.getCenter();
            var center2D = map.coordinateToPoint(center, map.getMaxZoom());
            var z = scale * size.height / 2;
            camera.position.set(center2D.x, center2D.y, -z);
            camera.up.set(0, (fullExtent['top'] >= fullExtent['bottom'] ? -1 : 1), 0);
            camera.lookAt(new THREE.Vector3(center2D.x, center2D.y, 0));
            this.camera.updateProjectionMatrix();
        }
    });

    maptalks.ThreeLayer.registerRenderer('canvas', ThreeRenderer);
    maptalks.ThreeLayer.registerRenderer('webgl', ThreeRenderer);

})();
